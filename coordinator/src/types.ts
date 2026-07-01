export interface RegisterWindowRequest {
  workspacePath: string;
  workspaceName: string;
  appRole: string;
  focused: boolean;
  capabilities: {
    canEdit: boolean;
    canRunCommands: boolean;
    canReportDiagnostics: boolean;
  };
}

export interface RegisterWindowResponse {
  windowId: string;
  sessionId: string;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
}

export interface HeartbeatRequest {
  sessionId: string;
  focused: boolean;
  status: string;
}

export interface SummaryRequest {
  sessionId: string;
  summary: WindowSummary;
}

export interface WindowSummary {
  activeFile: string | null;
  branch: string | null;
  diagnostics: {
    errors: number;
    warnings: number;
  };
}

export interface WindowRecord {
  windowId: string;
  workspacePath: string;
  workspaceName: string;
  appRole: string;
  focused: boolean;
  status: string;
  lastSeenAt: string;
  capabilities: {
    canEdit: boolean;
    canRunCommands: boolean;
    canReportDiagnostics: boolean;
  };
  summary?: WindowSummary;
}

export interface CoordinatorEvent {
  eventId: string;
  type: string;
  occurredAt: string;
  windowId?: string;
  payload: Record<string, unknown>;
}

export interface InboxResponse {
  events: CoordinatorEvent[];
}

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'blocked';

export interface TaskTarget {
  type: 'windowId' | 'appRole';
  value: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  target: TaskTarget;
  workflowId?: string;
  dependencies?: string[];
}

export interface TaskRecord {
  taskId: string;
  workflowId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  target: TaskTarget;
  dependencies: string[];
  assignedWindowId?: string;
  createdBy: string;
  completionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActionRequest {
  windowId: string;
  note?: string;
}

export interface WorkflowRecord {
  workflowId: string;
  title: string;
  status: 'in_progress' | 'completed';
  taskIds: string[];
  blockers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WindowMessageRequest {
  windowId: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}
