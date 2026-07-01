export interface WindowRecord {
  windowId: string;
  workspaceName: string;
  workspacePath: string;
  appRole: string;
  focused: boolean;
  status: string;
  lastSeenAt?: string;
  summary?: WindowSummary;
}

export interface WindowSummary {
  activeFile: string | null;
  branch: string | null;
  diagnostics: {
    errors: number;
    warnings: number;
  };
}

export interface TaskRecord {
  taskId: string;
  workflowId?: string;
  title: string;
  description?: string;
  status: string;
  assignedWindowId?: string;
}

export interface WorkflowRecord {
  workflowId: string;
  title: string;
  status: string;
  tasks: TaskRecord[];
  blockers: string[];
}

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

export interface TaskActionRequest {
  windowId: string;
  note?: string;
}

export interface WindowMessageRequest {
  windowId: string;
  message: string;
  severity?: 'info' | 'warning' | 'error';
}
