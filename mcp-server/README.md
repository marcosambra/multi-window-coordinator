# Multi-Window Coordinator MCP Server

This scaffold exposes a localhost coordinator as MCP tools.

## Environment

- `COORDINATOR_BASE_URL` defaults to `http://127.0.0.1:4317`
- `COORDINATOR_AUTH_TOKEN` is optional and forwarded as a bearer token

## Tools

- `list_windows`
- `get_window_summary`
- `create_cross_app_task`
- `accept_task`
- `complete_task`
- `get_workflow_state`
- `post_window_note`

## Expected coordinator endpoints

- `GET /api/windows`
- `GET /api/windows/{windowId}`
- `GET /api/tasks?assignedWindowId=...`
- `POST /api/tasks`
- `POST /api/tasks/{taskId}/accept`
- `POST /api/tasks/{taskId}/complete`
- `GET /api/workflows/{workflowId}`
- `POST /api/messages`
