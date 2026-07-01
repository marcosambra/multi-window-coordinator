# Multi-Window Coordinator Extension

This scaffold registers the active VS Code window with a localhost coordinator service, refreshes a lightweight local summary, and supports a basic task handoff workflow.

## Commands

- `Multi-Window Coordinator: Connect`
- `Multi-Window Coordinator: Show Windows`
- `Multi-Window Coordinator: Refresh Summary`
- `Multi-Window Coordinator: Accept Next Task`
- `Multi-Window Coordinator: Complete Active Task`
- `Multi-Window Coordinator: Open Task Board`

## Settings

- `multiWindowCoordinator.baseUrl`
- `multiWindowCoordinator.appRole`
- `multiWindowCoordinator.autoConnect`
- `multiWindowCoordinator.openTaskBoardUrl`

## Expected Coordinator Endpoints

- `POST /api/windows/register`
- `POST /api/windows/{windowId}/heartbeat`
- `POST /api/windows/{windowId}/summary`
- `GET /api/windows`
- `GET /api/windows/{windowId}/inbox`
- `GET /api/tasks?assignedWindowId=...`
- `POST /api/tasks/{taskId}/accept`
- `POST /api/tasks/{taskId}/complete`
