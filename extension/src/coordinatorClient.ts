import * as vscode from 'vscode';
import {
  CoordinatorEvent,
  HeartbeatPayload,
  InboxResponse,
  RegistrationRequest,
  RegistrationResponse,
  TaskActionPayload,
  TaskRecord,
  WindowRecord,
  WindowSession,
  WindowSummaryPayload,
} from './types';

export class CoordinatorClient {
  constructor(private readonly baseUrl: string) {}

  async registerWindow(request: RegistrationRequest): Promise<WindowSession> {
    const response = await this.request<RegistrationResponse>('POST', '/api/windows/register', request);
    return {
      windowId: response.windowId,
      sessionId: response.sessionId,
      heartbeatIntervalMs: response.heartbeatIntervalMs,
      pollIntervalMs: response.pollIntervalMs,
    };
  }

  async sendHeartbeat(windowId: string, payload: HeartbeatPayload): Promise<void> {
    await this.request<void>('POST', `/api/windows/${windowId}/heartbeat`, payload);
  }

  async updateSummary(windowId: string, payload: WindowSummaryPayload): Promise<void> {
    await this.request<void>('POST', `/api/windows/${windowId}/summary`, payload);
  }

  async listWindows(): Promise<WindowRecord[]> {
    return this.request<WindowRecord[]>('GET', '/api/windows');
  }

  async getInbox(windowId: string, sessionId: string): Promise<CoordinatorEvent[]> {
    const query = new URLSearchParams({ sessionId });
    const response = await this.request<InboxResponse>('GET', `/api/windows/${windowId}/inbox?${query.toString()}`);
    return response.events;
  }

  async listTasks(windowId: string): Promise<TaskRecord[]> {
    const query = new URLSearchParams({ assignedWindowId: windowId });
    return this.request<TaskRecord[]>('GET', `/api/tasks?${query.toString()}`);
  }

  async acceptTask(taskId: string, payload: TaskActionPayload): Promise<void> {
    await this.request<void>('POST', `/api/tasks/${taskId}/accept`, payload);
  }

  async completeTask(taskId: string, payload: TaskActionPayload): Promise<void> {
    await this.request<void>('POST', `/api/tasks/${taskId}/complete`, payload);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(new URL(path, this.baseUrl), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Coordinator request failed (${response.status}): ${errorBody}`);
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

export function createCoordinatorClient(): CoordinatorClient {
  const config = vscode.workspace.getConfiguration('multiWindowCoordinator');
  const baseUrl = config.get<string>('baseUrl', 'http://127.0.0.1:4317');
  return new CoordinatorClient(baseUrl);
}
