export interface RegistrationRequest {
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

export interface RegistrationResponse {
  windowId: string;
  sessionId: string;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
}

export interface WindowRecord {
  windowId: string;
  workspaceName: string;
  workspacePath: string;
  appRole: string;
  focused: boolean;
  status: string;
  lastSeenAt?: string;
}

export interface WindowSummaryPayload {
  sessionId: string;
  summary: {
    activeFile: string | null;
    branch: string | null;
    diagnostics: {
      errors: number;
      warnings: number;
    };
  };
}

export interface HeartbeatPayload {
  sessionId: string;
  focused: boolean;
  status: string;
}

export interface CoordinatorEvent {
  eventId: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface InboxResponse {
  events: CoordinatorEvent[];
}

export interface TaskRecord {
  taskId: string;
  title: string;
  description?: string;
  status: string;
  workflowId?: string;
  assignedWindowId?: string;
}

export interface TaskActionPayload {
  windowId: string;
  sessionId: string;
  note?: string;
}

export interface WindowSession {
  windowId: string;
  sessionId: string;
  heartbeatIntervalMs: number;
  pollIntervalMs: number;
}
