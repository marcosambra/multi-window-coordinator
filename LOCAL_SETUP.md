# Local Setup

This document shows how to run the local coordinator, load the VS Code extension, and register the MCP server in VS Code.

## 1. Start the local coordinator

```bash
cd /home/ambra/Kwikledgers/accountant_frontend/tools/multi-window-coordinator/coordinator
npm install
npm run build
npm start
```

Expected result:

- HTTP base URL: `http://127.0.0.1:4317`
- Health check: `GET http://127.0.0.1:4317/health`

## 2. Run the VS Code extension scaffold

Open the extension project folder in VS Code:

```bash
cd /home/ambra/Kwikledgers/accountant_frontend/tools/multi-window-coordinator/extension
code .
```

Then:

1. Open `package.json` in that extension project.
2. Use the precreated launch config in `extension/.vscode/launch.json`.
3. Press `F5` to launch the Extension Development Host.
4. In the new window, open the Command Palette.
5. Run `Multi-Window Coordinator: Connect`.
6. Optionally set `multiWindowCoordinator.appRole` in settings to values like `frontend`, `backend`, or `mobile`.
7. Run `Multi-Window Coordinator: Refresh Summary`.
8. Run `Multi-Window Coordinator: Show Windows` to confirm registration.

Repeat the same process in another Extension Development Host if you want to simulate multiple windows.

## 3. Register the MCP server in VS Code

VS Code supports local MCP server configuration through `mcp.json`.

### Workspace option

Create or open `.vscode/mcp.json` in the workspace where you want the MCP server available.

Example:

```json
{
  "servers": {
    "multi-window-coordinator": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/home/ambra/Kwikledgers/accountant_frontend/tools/multi-window-coordinator/mcp-server/out/index.js"
      ],
      "env": {
        "COORDINATOR_BASE_URL": "http://127.0.0.1:4317"
      }
    }
  }
}
```

You can also copy the ready-made example from `tools/multi-window-coordinator/examples/mcp.json`.

### User profile option

1. Open the Command Palette.
2. Run `MCP: Open User Configuration`.
3. Add the same server definition to your user `mcp.json`.

After editing `mcp.json`:

1. Run `MCP: List Servers`.
2. Select `multi-window-coordinator`.
3. Start the server if it is not already running.
4. Trust the server when VS Code prompts for confirmation.

## 4. Test the end-to-end flow

With the coordinator running and at least one extension window connected:

1. Open Chat in VS Code.
2. Use the MCP server toolset through an agent-enabled chat.
3. Ask for a window inventory first.

Example prompts:

- `List the connected coordinator windows and their roles.`
- `Create a cross-app task for the frontend window to review the bank access flow.`
- `Post a note to the frontend window saying the backend change is ready.`

Expected flow:

1. MCP tool calls hit the local coordinator.
2. The coordinator assigns tasks to the matching window.
3. The extension polls the inbox and shows task notifications.
4. You accept or complete the task from the extension commands.

## 5. Optional curl smoke tests

Register a fake window:

```bash
curl -X POST http://127.0.0.1:4317/api/windows/register \
  -H 'Content-Type: application/json' \
  -d '{
    "workspacePath": "/tmp/frontend",
    "workspaceName": "frontend",
    "appRole": "frontend",
    "focused": true,
    "capabilities": {
      "canEdit": true,
      "canRunCommands": true,
      "canReportDiagnostics": true
    }
  }'
```

Create a task for the frontend role:

```bash
curl -X POST http://127.0.0.1:4317/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Review bank access flow",
    "target": {
      "type": "appRole",
      "value": "frontend"
    }
  }'
```

## 6. Current limitations

- The coordinator uses in-memory state only.
- The extension uses polling, not push subscriptions.
- Window switching is still user-driven.
- There is no authentication layer beyond per-window session IDs.
