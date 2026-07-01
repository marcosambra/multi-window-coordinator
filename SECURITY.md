# Security Policy

## English

### Scope

This policy covers the local coordinator service, the VS Code extension, the
MCP facade, and repository-level setup documentation.

### Reporting

Do not open normal issues for sensitive disclosures such as exploitable local
HTTP endpoints, unsafe task routing, extension privilege misuse, or leaked
session identifiers.

Use the team's private internal security or incident channel and include:

- affected package and path
- impact and exposure conditions
- reproduction steps
- mitigation notes if known

### Sensitive Areas

- `coordinator/` HTTP endpoints and in-memory state
- `extension/` commands and local window registration
- `mcp-server/` coordinator-facing tool exposure
- example or local setup files that expose local endpoints

## Portugues

### Escopo

Esta politica cobre o servico coordinator local, a extensao do VS Code, a
fachada MCP e a documentacao de setup no nivel do repositorio.

### Reporte

Nao abra issues normais para divulgacoes sensiveis, como endpoints HTTP locais
exploraveis, roteamento inseguro de tasks, uso indevido de privilegios da
extensao ou vazamento de identificadores de sessao.

Use o canal interno e privado de seguranca ou incidentes da equipe e inclua:

- pacote e caminho afetados
- impacto e condicoes de exposicao
- passos de reproducao
- observacoes de mitigacao, se conhecidas

### Areas Sensiveis

- endpoints HTTP e estado em memoria em `coordinator/`
- comandos da extensao e registro local de janelas em `extension/`
- exposicao de ferramentas voltadas ao coordinator em `mcp-server/`
- arquivos de exemplo ou setup que exponham endpoints locais