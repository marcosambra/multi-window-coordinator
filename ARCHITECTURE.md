# Multi-Window Coordinator Architecture

## Goal

Coordinate work across multiple open VS Code windows without pretending that one extension host can directly control all others.

The architecture uses three layers:

1. A VS Code extension running in each window
2. A localhost coordinator service that owns shared state and routing
3. An MCP server facade that exposes coordination tools to AI hosts

## Design Principles

- Keep editor control local to the current window
- Keep workflow state centralized in the coordinator
- Make all cross-window actions explicit and auditable
- Prefer task handoff over remote control
- Treat file contents as opt-in, not background telemetry

## Components

### 1. VS Code extension

Responsibilities:
- Register the current window with the coordinator
- Report local metadata and health
- Poll or subscribe for assigned tasks
- Expose commands for accepting, completing, and inspecting work
- Show notifications when a handoff arrives

Local-only data owned by the extension:
- Active editor path
- Workspace folders
- Branch name if available
- Diagnostics summary
- Window focus state

### 2. Coordinator service

Responsibilities:
- Maintain the canonical registry of connected windows
- Route tasks to a target window or app role
- Persist task, workflow, and handoff state
- Publish events for task changes and window lifecycle updates
- Provide a stable HTTP API for extensions and MCP server

### 3. MCP server facade

Responsibilities:
- Expose coordinator capabilities as MCP tools and resources
- Validate tool arguments and map them to coordinator API calls
- Return structured results suitable for AI orchestration
- Never execute local editor actions directly

## Identity Model

### Window

```json
{
  "windowId": "win_01HT6T8WQK7M5S5H1KJ1QZ1A4V",
  "sessionId": "sess_01HT6TBK4G7DX8S6E8N6B6DKVX",
  "workspacePath": "/repos/accountant_frontend",
  "workspaceName": "accountant_frontend",
  "appRole": "frontend",
  "machineId": "machine_localhost",
  "focused": true,
  "status": "ready",
  "lastSeenAt": "2026-04-08T15:30:00.000Z"
}
```

### Task

```json
{
  "taskId": "task_01HT6TFB8S4Q7Z1GN48XJQ0N2M",
  "workflowId": "wf_01HT6TFFPEW6B0WY3GYQ0CMEYV",
  "title": "Align bank account DTO with backend",
  "description": "Frontend must adopt the new account status field before backend closes the workflow.",
  "target": {
    "type": "appRole",
    "value": "frontend"
  },
  "status": "assigned",
  "dependencies": [],
  "createdBy": "mcp",
  "assignedWindowId": "win_01HT6T8WQK7M5S5H1KJ1QZ1A4V",
  "createdAt": "2026-04-08T15:31:00.000Z",
  "updatedAt": "2026-04-08T15:31:00.000Z"
}
```

### Workflow

```json
{
  "workflowId": "wf_01HT6TFFPEW6B0WY3GYQ0CMEYV",
  "title": "Cross-app bank access rollout",
  "status": "in_progress",
  "tasks": ["task_01", "task_02"],
  "blockers": [],
  "createdAt": "2026-04-08T15:30:30.000Z"
}
```

## Extension Commands

Command IDs contributed by the extension:

1. `multiWindowCoordinator.connect`
   Registers the current window and starts background synchronization.

2. `multiWindowCoordinator.showWindows`
   Shows a quick-pick list of connected windows and their status.

3. `multiWindowCoordinator.refreshSummary`
   Captures a fresh local summary and sends it to the coordinator.

4. `multiWindowCoordinator.acceptNextTask`
   Accepts the next assigned task for the current window.

5. `multiWindowCoordinator.completeActiveTask`
   Completes a selected assigned or in-progress task and sends an optional handoff note.

6. `multiWindowCoordinator.openTaskBoard`
   Opens the coordinator web UI if configured.

## Event Model

Events are emitted by the coordinator and consumed by extensions and MCP layer.

### Window lifecycle events

- `window.registered`
- `window.heartbeat`
- `window.disconnected`
- `window.focus.changed`
- `window.summary.updated`

### Task lifecycle events

- `task.created`
- `task.assigned`
- `task.accepted`
- `task.completed`
- `task.blocked`
- `task.reassigned`

### Workflow events

- `workflow.created`
- `workflow.updated`
- `workflow.completed`

### Notification envelope

```json
{
  "eventId": "evt_01HT6TMQ1CZQYAKJ1EGZV4J4QE",
  "type": "task.assigned",
  "occurredAt": "2026-04-08T15:35:00.000Z",
  "windowId": "win_01HT6T8WQK7M5S5H1KJ1QZ1A4V",
  "payload": {
    "taskId": "task_01HT6TFB8S4Q7Z1GN48XJQ0N2M",
    "title": "Align bank account DTO with backend"
  }
}
```

## Coordinator HTTP API

Base URL: `http://127.0.0.1:4317`

### Register window

`POST /api/windows/register`

Request:

```json
{
  "workspacePath": "/repos/accountant_frontend",
  "workspaceName": "accountant_frontend",
  "appRole": "frontend",
  "focused": true,
  "capabilities": {
    "canEdit": true,
    "canRunCommands": true,
    "canReportDiagnostics": true
  }
}
```

Response:

```json
{
  "windowId": "win_01HT6T8WQK7M5S5H1KJ1QZ1A4V",
  "sessionId": "sess_01HT6TBK4G7DX8S6E8N6B6DKVX",
  "heartbeatIntervalMs": 15000,
  "pollIntervalMs": 8000
}
```

### Heartbeat

`POST /api/windows/{windowId}/heartbeat`

Request:

```json
{
  "sessionId": "sess_01HT6TBK4G7DX8S6E8N6B6DKVX",
  "focused": false,
  "status": "ready"
}
```

### Update local summary

`POST /api/windows/{windowId}/summary`

Request:

```json
{
  "sessionId": "sess_01HT6TBK4G7DX8S6E8N6B6DKVX",
  "summary": {
    "activeFile": "src/app/app.component.ts",
    "branch": "feature/bank-access",
    "diagnostics": {
      "errors": 0,
      "warnings": 3
    }
  }
}
```

### List windows

`GET /api/windows`

### Poll inbox

`GET /api/windows/{windowId}/inbox?sessionId=...`

Response:

```json
{
  "events": [
    {
      "eventId": "evt_01HT6TMQ1CZQYAKJ1EGZV4J4QE",
      "type": "task.assigned",
      "occurredAt": "2026-04-08T15:35:00.000Z",
      "payload": {
        "taskId": "task_01HT6TFB8S4Q7Z1GN48XJQ0N2M",
        "title": "Align bank account DTO with backend"
      }
    }
  ]
}
```

### Create task

`POST /api/tasks`

### List tasks

`GET /api/tasks?assignedWindowId=...&status=assigned`

### Accept task

`POST /api/tasks/{taskId}/accept`

Request:

```json
{
  "windowId": "win_01HT6T8WQK7M5S5H1KJ1QZ1A4V",
  "sessionId": "sess_01HT6TBK4G7DX8S6E8N6B6DKVX"
}
```

### Complete task

`POST /api/tasks/{taskId}/complete`

Request:

```json
{
  "windowId": "win_01HT6T8WQK7M5S5H1KJ1QZ1A4V",
  "sessionId": "sess_01HT6TBK4G7DX8S6E8N6B6DKVX",
  "note": "Frontend validation updated; backend window can proceed."
}
```

### Get workflow state

`GET /api/workflows/{workflowId}`

## MCP Tool Contract

The MCP layer maps tools to the coordinator API and never talks to the extension directly.

### `list_windows`
- Returns all known windows with focus, role, and status.

### `get_window_summary`
- Input: `windowId`
- Returns the latest snapshot and assigned tasks.

### `create_cross_app_task`
- Input: `title`, `description`, `target`, `workflowId?`, `dependencies?`
- Creates a task and assigns it to the best matching window.

### `accept_task`
- Input: `taskId`, `windowId`
- Marks a task as accepted on behalf of a specific window.

### `complete_task`
- Input: `taskId`, `windowId`, `note?`
- Completes a task and emits any configured handoff.

### `get_workflow_state`
- Input: `workflowId`
- Returns workflow summary, tasks, blockers, and suggested next target.

### `post_window_note`
- Input: `windowId`, `message`, `severity?`
- Sends a coordination note to a specific window inbox.

## Security Rules

- Bind the coordinator to `127.0.0.1`
- Generate a per-session secret or bearer token for extension registration
- Require `sessionId` for all mutating window calls
- Treat coordinator messages as requests, never silent remote execution
- Record audit logs for task creation, assignment, acceptance, and completion

## Suggested Runtime Sequence

1. Extension activates in window A
2. Extension registers with coordinator and receives `windowId`
3. Extension sends heartbeats and summary updates
4. MCP host creates a cross-app task targeting app role `frontend`
5. Coordinator assigns task to window A and records `task.assigned`
6. Extension polls inbox, shows notification, and user accepts the task
7. Extension completes the task and sends a handoff note
8. Coordinator assigns the next task to the backend window and records the handoff

## Future Upgrades

- Replace inbox polling with SSE or WebSocket subscriptions
- Add coordinator dashboard for workflow visualization
- Add workspace trust and signing for extension registration
- Add durable queues for offline windows
- Add richer resources in MCP for workflow summaries and audit trails
