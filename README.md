# KwikLedgers Multi-Window Coordinator

Repository name: `kwikledgers-multi-window-coordinator`

Folder: `/home/ambra/Kwikledgers/multi-window-coordinator`

Description: prototype coordination platform for multi-window VS Code workflows, combining a local coordinator service, a window-local extension, and an MCP facade for AI orchestration.

## Purpose

This repository is separate from the daily Azure DevOps agent flow. It explores cross-window task routing and workflow handoff between multiple VS Code windows without pretending one extension host can directly control another.

Main parts:

- `coordinator/`: local HTTP service that stores window and task state
- `extension/`: VS Code extension that registers a window and receives tasks
- `mcp-server/`: MCP facade exposing coordinator actions to AI hosts
- `ARCHITECTURE.md`: system design
- `LOCAL_SETUP.md`: local execution guide

## Recommended Use

Treat this as an experimental or platform repository, not as part of the minimal daily agent MVP.

Use it when you need:

- multi-window task handoff
- cross-app workflow coordination
- explicit routing between frontend/backend windows

## Recommended License Structure

For internal-only development:

```text
LICENSE.md
README.md
ARCHITECTURE.md
LOCAL_SETUP.md
```

If you later decide to open-source this prototype, MIT would be the simplest future-friendly choice.

## Repository Hygiene Notes

Do not track `node_modules/` or build output. Keep only source, docs, and lockfiles versioned.
