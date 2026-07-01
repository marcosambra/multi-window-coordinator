import {
  CreateTaskRequest,
  TaskActionRequest,
  TaskRecord,
  WindowMessageRequest,
  WindowRecord,
  WorkflowRecord,
} from './types.js';

export class CoordinatorApi {
  constructor(
    private readonly baseUrl: string,
    private readonly authToken?: string
  ) {}

  listWindows(): Promise<WindowRecord[]> {
    return this.request<WindowRecord[]>('GET', '/api/windows');
  }

  getWindowSummary(windowId: string): Promise<WindowRecord> {
    return this.request<WindowRecord>('GET', `/api/windows/${windowId}`);
  }

  listTasks(windowId: string): Promise<TaskRecord[]> {
    const query = new URLSearchParams({ assignedWindowId: windowId });
    return this.request<TaskRecord[]>('GET', `/api/tasks?${query.toString()}`);
  }

  createTask(input: CreateTaskRequest): Promise<TaskRecord> {
    return this.request<TaskRecord>('POST', '/api/tasks', input);
  }

  acceptTask(taskId: string, input: TaskActionRequest): Promise<void> {
    return this.request<void>('POST', `/api/tasks/${taskId}/accept`, input);
  }

  completeTask(taskId: string, input: TaskActionRequest): Promise<void> {
    return this.request<void>('POST', `/api/tasks/${taskId}/complete`, input);
  }

  getWorkflowState(workflowId: string): Promise<WorkflowRecord> {
    return this.request<WorkflowRecord>('GET', `/api/workflows/${workflowId}`);
  }

  postWindowNote(input: WindowMessageRequest): Promise<void> {
    return this.request<void>('POST', '/api/messages', input);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(new URL(path, this.baseUrl), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coordinator API failed (${response.status}): ${errorText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }
}

export function createCoordinatorApi(): CoordinatorApi {
  const baseUrl = process.env.COORDINATOR_BASE_URL || 'http://127.0.0.1:4317';
  const authToken = process.env.COORDINATOR_AUTH_TOKEN;
  return new CoordinatorApi(baseUrl, authToken);
}
