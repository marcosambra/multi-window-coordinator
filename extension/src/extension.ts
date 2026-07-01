import * as vscode from 'vscode';
import { CoordinatorClient, createCoordinatorClient } from './coordinatorClient';
import { CoordinatorEvent, WindowSession } from './types';

let coordinatorClient: CoordinatorClient;
let currentSession: WindowSession | undefined;
let heartbeatTimer: NodeJS.Timeout | undefined;
let inboxTimer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  coordinatorClient = createCoordinatorClient();
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'multiWindowCoordinator.showWindows';
  statusBarItem.text = '$(broadcast) Coordinator: disconnected';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand('multiWindowCoordinator.connect', async () => {
      await connectAndStart(context, true);
    }),
    vscode.commands.registerCommand('multiWindowCoordinator.showWindows', async () => {
      await showWindows();
    }),
    vscode.commands.registerCommand('multiWindowCoordinator.refreshSummary', async () => {
      await refreshSummary();
    }),
    vscode.commands.registerCommand('multiWindowCoordinator.acceptNextTask', async () => {
      await acceptNextTask();
    }),
    vscode.commands.registerCommand('multiWindowCoordinator.completeActiveTask', async () => {
      await completeActiveTask();
    }),
    vscode.commands.registerCommand('multiWindowCoordinator.openTaskBoard', async () => {
      await openTaskBoard();
    }),
    vscode.window.onDidChangeWindowState(async () => {
      await sendHeartbeat('ready');
    }),
    vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration('multiWindowCoordinator.baseUrl')) {
        coordinatorClient = createCoordinatorClient();
        await connectAndStart(context, false);
      }
    })
  );

  const config = vscode.workspace.getConfiguration('multiWindowCoordinator');
  if (config.get<boolean>('autoConnect', true)) {
    await connectAndStart(context, false);
  }
}

export function deactivate(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
  if (inboxTimer) {
    clearInterval(inboxTimer);
  }
}

async function connectAndStart(context: vscode.ExtensionContext, userInitiated: boolean): Promise<void> {
  try {
    currentSession = await coordinatorClient.registerWindow(buildRegistrationPayload());
    updateStatusBar('connected');
    await refreshSummary();
    startHeartbeatLoop();
    startInboxLoop();

    if (userInitiated) {
      void vscode.window.showInformationMessage(`Connected window ${currentSession.windowId} to coordinator.`);
    }
  } catch (error) {
    updateStatusBar('error');
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    if (userInitiated) {
      void vscode.window.showErrorMessage(`Coordinator connection failed: ${message}`);
    }
  }
}

function buildRegistrationPayload() {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const config = vscode.workspace.getConfiguration('multiWindowCoordinator');

  return {
    workspacePath: workspaceFolder?.uri.fsPath ?? '',
    workspaceName: workspaceFolder?.name ?? 'untitled',
    appRole: config.get<string>('appRole', 'unknown'),
    focused: vscode.window.state.focused,
    capabilities: {
      canEdit: true,
      canRunCommands: true,
      canReportDiagnostics: true,
    },
  };
}

async function showWindows(): Promise<void> {
  try {
    const windows = await coordinatorClient.listWindows();
    const items = windows.map((windowRecord) => ({
      label: `${windowRecord.workspaceName} (${windowRecord.appRole})`,
      description: `${windowRecord.status}${windowRecord.focused ? ' • focused' : ''}`,
      detail: windowRecord.workspacePath,
    }));

    await vscode.window.showQuickPick(items, {
      title: 'Connected coordinator windows',
      placeHolder: items.length ? 'Coordinator windows' : 'No windows registered',
    });
  } catch (error) {
    await showError(error, 'Unable to load windows');
  }
}

async function refreshSummary(): Promise<void> {
  if (!currentSession) {
    return;
  }

  try {
    await coordinatorClient.updateSummary(currentSession.windowId, {
      sessionId: currentSession.sessionId,
      summary: {
        activeFile: vscode.window.activeTextEditor?.document.uri.fsPath ?? null,
        branch: null,
        diagnostics: collectDiagnostics(),
      },
    });
  } catch (error) {
    await showError(error, 'Unable to refresh coordinator summary');
  }
}

async function acceptNextTask(): Promise<void> {
  if (!currentSession) {
    await vscode.window.showWarningMessage('Coordinator is not connected.');
    return;
  }

  try {
    const tasks = await coordinatorClient.listTasks(currentSession.windowId);
    const nextTask = tasks.find((task) => task.status === 'assigned');
    if (!nextTask) {
      await vscode.window.showInformationMessage('No assigned tasks available for this window.');
      return;
    }

    await coordinatorClient.acceptTask(nextTask.taskId, {
      windowId: currentSession.windowId,
      sessionId: currentSession.sessionId,
    });

    await vscode.window.showInformationMessage(`Accepted task: ${nextTask.title}`);
  } catch (error) {
    await showError(error, 'Unable to accept task');
  }
}

async function completeActiveTask(): Promise<void> {
  if (!currentSession) {
    await vscode.window.showWarningMessage('Coordinator is not connected.');
    return;
  }

  try {
    const tasks = await coordinatorClient.listTasks(currentSession.windowId);
    const candidates = tasks.filter((task) => task.status === 'assigned' || task.status === 'in_progress');
    if (!candidates.length) {
      await vscode.window.showInformationMessage('No assigned or in-progress tasks available.');
      return;
    }

    const selection = await vscode.window.showQuickPick(
      candidates.map((task) => ({
        label: task.title,
        description: task.status,
        task,
      })),
      {
        title: 'Complete coordinator task',
      }
    );

    if (!selection) {
      return;
    }

    const note = await vscode.window.showInputBox({
      title: 'Completion note',
      prompt: 'Optional handoff note for the next window',
      placeHolder: 'Frontend complete; backend can proceed.',
    });

    await coordinatorClient.completeTask(selection.task.taskId, {
      windowId: currentSession.windowId,
      sessionId: currentSession.sessionId,
      note: note?.trim() || undefined,
    });

    await vscode.window.showInformationMessage(`Completed task: ${selection.task.title}`);
  } catch (error) {
    await showError(error, 'Unable to complete task');
  }
}

async function openTaskBoard(): Promise<void> {
  const config = vscode.workspace.getConfiguration('multiWindowCoordinator');
  const boardUrl = config.get<string>('openTaskBoardUrl', '').trim();
  if (!boardUrl) {
    await vscode.window.showWarningMessage('No task board URL configured.');
    return;
  }

  await vscode.env.openExternal(vscode.Uri.parse(boardUrl));
}

function startHeartbeatLoop(): void {
  if (!currentSession) {
    return;
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  heartbeatTimer = setInterval(() => {
    void sendHeartbeat('ready');
  }, currentSession.heartbeatIntervalMs);
}

function startInboxLoop(): void {
  if (!currentSession) {
    return;
  }

  if (inboxTimer) {
    clearInterval(inboxTimer);
  }

  inboxTimer = setInterval(() => {
    void pollInbox();
  }, currentSession.pollIntervalMs);
}

async function sendHeartbeat(status: string): Promise<void> {
  if (!currentSession) {
    return;
  }

  try {
    await coordinatorClient.sendHeartbeat(currentSession.windowId, {
      sessionId: currentSession.sessionId,
      focused: vscode.window.state.focused,
      status,
    });
  } catch {
    updateStatusBar('error');
  }
}

async function pollInbox(): Promise<void> {
  if (!currentSession) {
    return;
  }

  try {
    const events = await coordinatorClient.getInbox(currentSession.windowId, currentSession.sessionId);
    updateStatusBar('connected');
    for (const event of events) {
      await handleEvent(event);
    }
  } catch {
    updateStatusBar('error');
  }
}

async function handleEvent(event: CoordinatorEvent): Promise<void> {
  if (event.type === 'task.assigned') {
    const title = asString(event.payload.title) ?? 'New coordinator task';
    const note = asString(event.payload.note);
    const message = note ? `${title} — ${note}` : title;
    const action = await vscode.window.showInformationMessage(message, 'Accept');
    if (action === 'Accept') {
      await acceptTaskFromEvent(event);
    }
    return;
  }

  if (event.type === 'window.note') {
    const message = asString(event.payload.message) ?? 'Coordinator note received.';
    const severity = asString(event.payload.severity) ?? 'info';

    if (severity === 'warning') {
      await vscode.window.showWarningMessage(message);
      return;
    }

    if (severity === 'error') {
      await vscode.window.showErrorMessage(message);
      return;
    }

    await vscode.window.showInformationMessage(message);
    return;
  }

  if (event.type === 'task.reassigned' || event.type === 'task.completed') {
    const title = asString(event.payload.title) ?? event.type;
    await vscode.window.showInformationMessage(`Coordinator update: ${title}`);
  }
}

async function acceptTaskFromEvent(event: CoordinatorEvent): Promise<void> {
  if (!currentSession) {
    return;
  }

  const taskId = asString(event.payload.taskId);
  if (!taskId) {
    return;
  }

  await coordinatorClient.acceptTask(taskId, {
    windowId: currentSession.windowId,
    sessionId: currentSession.sessionId,
  });
}

function collectDiagnostics(): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;

  for (const [, diagnostics] of vscode.languages.getDiagnostics()) {
    for (const diagnostic of diagnostics) {
      if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
        errors += 1;
      } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
        warnings += 1;
      }
    }
  }

  return { errors, warnings };
}

function updateStatusBar(status: 'connected' | 'disconnected' | 'error'): void {
  if (!statusBarItem) {
    return;
  }

  if (status === 'connected') {
    statusBarItem.text = '$(broadcast) Coordinator: connected';
    statusBarItem.tooltip = 'Multi-window coordinator connected';
    return;
  }

  if (status === 'error') {
    statusBarItem.text = '$(warning) Coordinator: error';
    statusBarItem.tooltip = 'Multi-window coordinator unreachable';
    return;
  }

  statusBarItem.text = '$(broadcast) Coordinator: disconnected';
  statusBarItem.tooltip = 'Multi-window coordinator disconnected';
}

async function showError(error: unknown, prefix: string): Promise<void> {
  const message = error instanceof Error ? error.message : 'Unknown error';
  await vscode.window.showErrorMessage(`${prefix}: ${message}`);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

