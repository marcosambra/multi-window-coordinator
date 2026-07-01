import express, { Request, Response } from 'express';
import {
  ConflictError,
  InMemoryCoordinatorStore,
  NotFoundError,
  UnauthorizedError,
} from './store.js';
import {
  CreateTaskRequest,
  HeartbeatRequest,
  RegisterWindowRequest,
  SummaryRequest,
  TaskActionRequest,
  WindowMessageRequest,
} from './types.js';

const app = express();
const store = new InMemoryCoordinatorStore();
const host = process.env.COORDINATOR_HOST || '127.0.0.1';
const port = Number(process.env.COORDINATOR_PORT || 4317);

app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/windows/register', (request: Request<unknown, unknown, RegisterWindowRequest>, response) => {
  const registration = store.registerWindow(request.body);
  response.status(201).json(registration);
});

app.post('/api/windows/:windowId/heartbeat', (request: Request<{ windowId: string }, unknown, HeartbeatRequest>, response) => {
  store.updateHeartbeat(request.params.windowId, request.body);
  response.status(204).send();
});

app.post('/api/windows/:windowId/summary', (request: Request<{ windowId: string }, unknown, SummaryRequest>, response) => {
  store.updateSummary(request.params.windowId, request.body);
  response.status(204).send();
});

app.get('/api/windows', (_request, response) => {
  response.json(store.listWindows());
});

app.get('/api/windows/:windowId', (request: Request<{ windowId: string }>, response) => {
  response.json(store.getWindow(request.params.windowId));
});

app.get('/api/windows/:windowId/inbox', (request: Request<{ windowId: string }, unknown, unknown, { sessionId?: string }>, response) => {
  const sessionId = request.query.sessionId;
  if (!sessionId) {
    response.status(400).json({ error: 'sessionId is required.' });
    return;
  }

  response.json(store.readInbox(request.params.windowId, sessionId));
});

app.get('/api/tasks', (request: Request<unknown, unknown, unknown, { assignedWindowId?: string; status?: string; workflowId?: string }>, response) => {
  response.json(
    store.listTasks({
      assignedWindowId: request.query.assignedWindowId,
      status: request.query.status,
      workflowId: request.query.workflowId,
    })
  );
});

app.post('/api/tasks', (request: Request<unknown, unknown, CreateTaskRequest>, response) => {
  const task = store.createTask(request.body);
  response.status(201).json(task);
});

app.post('/api/tasks/:taskId/accept', (request: Request<{ taskId: string }, unknown, TaskActionRequest>, response) => {
  store.acceptTask(request.params.taskId, request.body);
  response.status(204).send();
});

app.post('/api/tasks/:taskId/complete', (request: Request<{ taskId: string }, unknown, TaskActionRequest>, response) => {
  store.completeTask(request.params.taskId, request.body);
  response.status(204).send();
});

app.get('/api/workflows/:workflowId', (request: Request<{ workflowId: string }>, response) => {
  response.json(store.getWorkflow(request.params.workflowId));
});

app.post('/api/messages', (request: Request<unknown, unknown, WindowMessageRequest>, response) => {
  store.postWindowMessage(request.body);
  response.status(204).send();
});

app.use((error: unknown, _request: Request, response: Response, _next: express.NextFunction) => {
  if (error instanceof NotFoundError) {
    response.status(404).json({ error: error.message });
    return;
  }

  if (error instanceof UnauthorizedError) {
    response.status(401).json({ error: error.message });
    return;
  }

  if (error instanceof ConflictError) {
    response.status(409).json({ error: error.message });
    return;
  }

  if (error instanceof SyntaxError) {
    response.status(400).json({ error: 'Invalid JSON request body.' });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown server error';
  response.status(500).json({ error: message });
});

app.listen(port, host, () => {
  console.log(`Multi-window coordinator listening on http://${host}:${port}`);
});
