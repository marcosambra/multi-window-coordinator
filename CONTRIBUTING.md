# Contributing

## English

### Scope

This repository owns the coordinator service, the VS Code extension, the MCP
facade, and the supporting architecture and setup documentation.

### First Steps

1. Read `README.md`, `LOCAL_SETUP.md`, and `ARCHITECTURE.md`.
2. Confirm whether the change belongs in `coordinator/`, `extension/`, or
   `mcp-server/`.
3. Keep component boundaries clear across HTTP coordination, extension logic,
   and MCP exposure.
4. When this repository is edited from the workspace root, also append the root
   history file in `../docs/history/`.

### Pull Request Expectations

- Explain the workflow you are changing.
- Validate the affected package or command path.
- Update docs when setup or MCP behavior changes.
- Avoid mixing unrelated coordinator and extension refactors.

## Portugues

### Escopo

Este repositorio cuida do servico coordinator, da extensao do VS Code, da
fachada MCP e da documentacao de arquitetura e setup associada.

### Primeiros Passos

1. Leia `README.md`, `LOCAL_SETUP.md` e `ARCHITECTURE.md`.
2. Confirme se a mudanca pertence a `coordinator/`, `extension/` ou
   `mcp-server/`.
3. Mantenha claras as fronteiras entre coordenacao HTTP, logica da extensao e
   exposicao MCP.
4. Quando este repositorio for editado a partir da raiz do workspace, adicione
   tambem o registro na history raiz em `../docs/history/`.

### Expectativas Para Pull Request

- Explique o fluxo que esta sendo alterado.
- Valide o pacote ou o caminho de comando afetado.
- Atualize a documentacao quando setup ou comportamento MCP mudarem.
- Evite misturar refactors sem relacao entre coordinator e extension.