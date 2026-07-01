# KwikLedgers Multi-Window Coordinator

Repository name: `kwikledgers-multi-window-coordinator`

Folder: `/home/ambra/Kwikledgers/multi-window-coordinator`

Description: prototype coordination platform for multi-window VS Code workflows, combining a local coordinator service, a window-local extension, and an MCP facade for AI orchestration.

## English

### Purpose

This repository is separate from the daily Azure DevOps agent flow. It explores
cross-window task routing and workflow handoff between multiple VS Code windows
without pretending one extension host can directly control another.

Main parts:

- `coordinator/`: local HTTP service that stores window and task state
- `extension/`: VS Code extension that registers a window and receives tasks
- `mcp-server/`: MCP facade exposing coordinator actions to AI hosts
- `ARCHITECTURE.md`: system design
- `LOCAL_SETUP.md`: local execution guide

### First Steps

1. Read [LOCAL_SETUP.md](LOCAL_SETUP.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
2. Install dependencies and start the service in `coordinator/`.
3. Open `extension/` in VS Code, press `F5`, and run `Multi-Window Coordinator: Connect`.
4. Register `mcp-server/` in your workspace or user `mcp.json`.
5. Ask an MCP-enabled chat to list connected windows before creating tasks.

### How To Use

Treat this as an experimental coordination platform, not as part of the
minimal daily agent MVP.

Use it when you need:

- multi-window task handoff
- cross-app workflow coordination
- explicit routing between frontend and backend windows

Example prompts:

- `List the connected coordinator windows and their roles.`
- `Create a cross-app task for the frontend window to review the bank access flow.`
- `Post a note to the frontend window saying the backend change is ready.`

### Repository Guides

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [Bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- [Documentation update template](.github/ISSUE_TEMPLATE/documentation_update.md)

### Recommended License Structure

For internal-only development:

```text
LICENSE.md
README.md
ARCHITECTURE.md
LOCAL_SETUP.md
```

If you later decide to open-source this prototype, MIT would be the simplest
future-friendly choice.

### Repository Hygiene Notes

Do not track `node_modules/` or build output. Keep only source, docs, and
lockfiles versioned.

## Portugues

### Objetivo

Este repositorio e separado do fluxo diario do agente de Azure DevOps. Ele
explora roteamento de tarefas entre multiplas janelas do VS Code e handoff de
workflow sem assumir que um unico extension host pode controlar outro
diretamente.

Partes principais:

- `coordinator/`: servico HTTP local que guarda estado de janelas e tarefas
- `extension/`: extensao do VS Code que registra uma janela e recebe tarefas
- `mcp-server/`: fachada MCP que expoe acoes do coordinator para hosts de IA
- `ARCHITECTURE.md`: desenho do sistema
- `LOCAL_SETUP.md`: guia de execucao local

### Primeiros Passos

1. Leia [LOCAL_SETUP.md](LOCAL_SETUP.md) e [ARCHITECTURE.md](ARCHITECTURE.md).
2. Instale as dependencias e inicie o servico em `coordinator/`.
3. Abra `extension/` no VS Code, pressione `F5` e rode `Multi-Window Coordinator: Connect`.
4. Registre `mcp-server/` no `mcp.json` do workspace ou do usuario.
5. Peca a um chat com MCP para listar as janelas conectadas antes de criar tarefas.

### Como Usar

Trate este repositorio como uma plataforma experimental de coordenacao, e nao
como parte do MVP minimo do agente diario.

Use quando voce precisar de:

- handoff de tarefas entre janelas
- coordenacao de fluxo entre aplicativos
- roteamento explicito entre janelas de frontend e backend

Prompts de exemplo:

- `Liste as janelas conectadas ao coordinator e seus papeis.`
- `Crie uma tarefa cross-app para a janela frontend revisar o fluxo de acesso bancario.`
- `Envie uma nota para a janela frontend informando que a mudanca de backend esta pronta.`

### Guias Do Repositorio

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [Template de bug](.github/ISSUE_TEMPLATE/bug_report.md)
- [Template de funcionalidade](.github/ISSUE_TEMPLATE/feature_request.md)
- [Template de documentacao](.github/ISSUE_TEMPLATE/documentation_update.md)

### Estrutura Recomendada De Licenca

Para desenvolvimento interno:

```text
LICENSE.md
README.md
ARCHITECTURE.md
LOCAL_SETUP.md
```

Se este prototipo for aberto futuramente, MIT seria a escolha mais simples e
amigavel para evolucao.

### Notas De Higiene Do Repositorio

Nao versione `node_modules/` nem saida de build. Mantenha apenas source,
documentacao e lockfiles no repositorio.
