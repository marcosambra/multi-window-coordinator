# Multi-Window Coordinator Service

Local HTTP service with in-memory state for window registration, task routing, workflow tracking, and inbox polling.

## Run

```bash
npm install
npm run build
npm start
```

Default base URL: `http://127.0.0.1:4317`

## Key endpoints

- `POST /api/windows/register`
- `POST /api/windows/:windowId/heartbeat`
- `POST /api/windows/:windowId/summary`
- `GET /api/windows`
- `GET /api/windows/:windowId`
- `GET /api/windows/:windowId/inbox?sessionId=...`
- `GET /api/tasks?assignedWindowId=...&status=...`
- `POST /api/tasks`
- `POST /api/tasks/:taskId/accept`
- `POST /api/tasks/:taskId/complete`
- `GET /api/workflows/:workflowId`
- `POST /api/messages`

## Notes

- State is in memory only.
- Window inboxes are destructive on read.
- This is intended for local development and end-to-end testing of the extension and MCP server.
