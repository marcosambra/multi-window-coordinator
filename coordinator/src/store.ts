import crypto from 'node:crypto';
import {
  CoordinatorEvent,
  CreateTaskRequest,
  HeartbeatRequest,
  InboxResponse,
  RegisterWindowRequest,
  RegisterWindowResponse,
  SummaryRequest,
  TaskActionRequest,
  TaskRecord,
  TaskStatus,
  WindowMessageRequest,
  WindowRecord,
  WorkflowRecord,
} from './types.js';

type InternalWindowRecord = WindowRecord & {
  sessionId: string;
  inbox: CoordinatorEvent[];
};

export class InMemoryCoordinatorStore {
  private readonly windows = new Map<string, InternalWindowRecord>();
  private readonly tasks = new Map<string, TaskRecord>();
  private readonly workflows = new Map<string, WorkflowRecord>();

  registerWindow(request: RegisterWindowRequest): RegisterWindowResponse {
    const windowId = generateId('win');
    const sessionId = generateId('sess');
    const now = timestamp();

    this.windows.set(windowId, {
      windowId,
      sessionId,
      workspacePath: request.workspacePath,
      workspaceName: request.workspaceName,
      appRole: request.appRole || 'unknown',
      focused: request.focused,
      status: 'ready',
      lastSeenAt: now,
      capabilities: request.capabilities,
      inbox: [],
    });

    return {
      windowId,
      sessionId,
      heartbeatIntervalMs: 15000,
      pollIntervalMs: 8000,
    };
  }

  updateHeartbeat(windowId: string, request: HeartbeatRequest): void {
    const record = this.assertWindowSession(windowId, request.sessionId);
    record.focused = request.focused;
    record.status = request.status;
    record.lastSeenAt = timestamp();
  }

  updateSummary(windowId: string, request: SummaryRequest): void {
    const record = this.assertWindowSession(windowId, request.sessionId);
    record.summary = request.summary;
    record.lastSeenAt = timestamp();
  }

  listWindows(): WindowRecord[] {
    return [...this.windows.values()]
      .sort((left, right) => Number(right.focused) - Number(left.focused))
      .map(toPublicWindowRecord);
  }

  getWindow(windowId: string): WindowRecord {
    const record = this.windows.get(windowId);
    if (!record) {
      throw new NotFoundError(`Unknown window: ${windowId}`);
    }

    return toPublicWindowRecord(record);
  }

  readInbox(windowId: string, sessionId: string): InboxResponse {
    const record = this.assertWindowSession(windowId, sessionId);
    const events = [...record.inbox];
    record.inbox.length = 0;
    return { events };
  }

  listTasks(filters: { assignedWindowId?: string; status?: string; workflowId?: string }): TaskRecord[] {
    return [...this.tasks.values()].filter((task) => {
      if (filters.assignedWindowId && task.assignedWindowId !== filters.assignedWindowId) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.workflowId && task.workflowId !== filters.workflowId) {
        return false;
      }
      return true;
    });
  }

  createTask(request: CreateTaskRequest): TaskRecord {
    const taskId = generateId('task');
    const now = timestamp();
    const workflowId = request.workflowId;
    const dependencies = request.dependencies ?? [];
    const canAssign = dependencies.every((dependencyId) => this.isTaskCompleted(dependencyId));
    const assignedWindowId = canAssign ? this.selectWindow(request.target) : undefined;
    const status: TaskStatus = assignedWindowId ? 'assigned' : dependencies.length ? 'pending' : 'pending';

    const task: TaskRecord = {
      taskId,
      workflowId,
      title: request.title,
      description: request.description,
      status,
      target: request.target,
      dependencies,
      assignedWindowId,
      createdBy: 'coordinator-api',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(taskId, task);

    if (workflowId) {
      this.upsertWorkflow(workflowId, request.title, taskId);
    }

    if (assignedWindowId) {
      this.enqueue(assignedWindowId, 'task.assigned', {
        taskId,
        title: task.title,
        workflowId,
      });
    }

    return task;
  }

  acceptTask(taskId: string, request: TaskActionRequest): void {
    const task = this.assertTask(taskId);
    if (task.assignedWindowId && task.assignedWindowId !== request.windowId) {
      throw new ConflictError(`Task ${taskId} is assigned to a different window.`);
    }

    task.assignedWindowId = request.windowId;
    task.status = 'in_progress';
    task.updatedAt = timestamp();
  }

  completeTask(taskId: string, request: TaskActionRequest): void {
    const task = this.assertTask(taskId);
    if (task.assignedWindowId && task.assignedWindowId !== request.windowId) {
      throw new ConflictError(`Task ${taskId} is assigned to a different window.`);
    }

    task.assignedWindowId = request.windowId;
    task.status = 'completed';
    task.completionNote = request.note;
    task.updatedAt = timestamp();

    if (task.workflowId) {
      this.activateEligibleWorkflowTasks(task.workflowId, request.note);
      this.refreshWorkflowStatus(task.workflowId);
    }
  }

  getWorkflow(workflowId: string): WorkflowRecord & { tasks: TaskRecord[] } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new NotFoundError(`Unknown workflow: ${workflowId}`);
    }

    return {
      ...workflow,
      tasks: workflow.taskIds
        .map((taskId) => this.tasks.get(taskId))
        .filter((task): task is TaskRecord => Boolean(task)),
    };
  }

  postWindowMessage(request: WindowMessageRequest): void {
    const target = this.assertWindow(request.windowId);
    this.enqueue(target.windowId, 'window.note', {
      message: request.message,
      severity: request.severity ?? 'info',
    });
  }

  private activateEligibleWorkflowTasks(workflowId: string, note?: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return;
    }

    for (const taskId of workflow.taskIds) {
      const task = this.tasks.get(taskId);
      if (!task || task.status !== 'pending') {
        continue;
      }

      const ready = task.dependencies.every((dependencyId) => this.isTaskCompleted(dependencyId));
      if (!ready) {
        continue;
      }

      const assignedWindowId = this.selectWindow(task.target);
      if (!assignedWindowId) {
        continue;
      }

      task.assignedWindowId = assignedWindowId;
      task.status = 'assigned';
      task.updatedAt = timestamp();

      this.enqueue(assignedWindowId, 'task.assigned', {
        taskId: task.taskId,
        title: task.title,
        workflowId: task.workflowId,
        note,
      });
    }
  }

  private refreshWorkflowStatus(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return;
    }

    const tasks = workflow.taskIds
      .map((taskId) => this.tasks.get(taskId))
      .filter((task): task is TaskRecord => Boolean(task));

    workflow.status = tasks.every((task) => task.status === 'completed') ? 'completed' : 'in_progress';
    workflow.updatedAt = timestamp();
  }

  private upsertWorkflow(workflowId: string, fallbackTitle: string, taskId: string): void {
    const now = timestamp();
    const existing = this.workflows.get(workflowId);
    if (existing) {
      existing.taskIds.push(taskId);
      existing.updatedAt = now;
      return;
    }

    this.workflows.set(workflowId, {
      workflowId,
      title: fallbackTitle,
      status: 'in_progress',
      taskIds: [taskId],
      blockers: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  private selectWindow(target: TaskRecord['target']): string | undefined {
    if (target.type === 'windowId') {
      return this.windows.has(target.value) ? target.value : undefined;
    }

    const candidates = [...this.windows.values()]
      .filter((windowRecord) => windowRecord.appRole === target.value)
      .sort((left, right) => {
        if (left.focused !== right.focused) {
          return Number(right.focused) - Number(left.focused);
        }
        return right.lastSeenAt.localeCompare(left.lastSeenAt);
      });

    return candidates[0]?.windowId;
  }

  private isTaskCompleted(taskId: string): boolean {
    return this.tasks.get(taskId)?.status === 'completed';
  }

  private enqueue(windowId: string, type: string, payload: Record<string, unknown>): void {
    const target = this.assertWindow(windowId);
    target.inbox.push({
      eventId: generateId('evt'),
      type,
      occurredAt: timestamp(),
      windowId,
      payload,
    });
  }

  private assertWindow(windowId: string): InternalWindowRecord {
    const record = this.windows.get(windowId);
    if (!record) {
      throw new NotFoundError(`Unknown window: ${windowId}`);
    }

    return record;
  }

  private assertWindowSession(windowId: string, sessionId: string): InternalWindowRecord {
    const record = this.assertWindow(windowId);
    if (record.sessionId !== sessionId) {
      throw new UnauthorizedError('Invalid session for window.');
    }

    return record;
  }

  private assertTask(taskId: string): TaskRecord {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError(`Unknown task: ${taskId}`);
    }

    return task;
  }
}

export class NotFoundError extends Error {}
export class UnauthorizedError extends Error {}
export class ConflictError extends Error {}

function toPublicWindowRecord(record: InternalWindowRecord): WindowRecord {
  const { sessionId: _sessionId, inbox: _inbox, ...publicRecord } = record;
  return publicRecord;
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function timestamp(): string {
  return new Date().toISOString();
}
