# oh-my-droid

This project is a fork of [Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode).

[![npm version](https://img.shields.io/npm/v/oh-my-droid?color=cb3837)](https://www.npmjs.com/package/oh-my-droid)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Multi-droid orchestration for Droid CLI. Zero learning curve.**

`oh-my-droid` extends Droid with execution modes, specialized droids, skills, hooks, model routing, and MCP bridge servers.

---

## Quick Start

### Install plugin

```bash
/plugin marketplace add https://github.com/coli-dev/oh-my-droid
/plugin install oh-my-droid
```

### Initial setup

```bash
/oh-my-droid:omd-setup
```

### First task

```text
autopilot: build a small REST API with auth and tests
```

---

## Core Features

- Multi-droid delegation with task-aware model routing
- Execution modes: `autopilot`, `ultrawork`, `ralph`, `ultrapilot`, `swarm`, `pipeline`, `ecomode`
- 30+ skills and command wrappers
- Hook system for automation and context injection
- MCP bridge servers for Codex/Gemini orchestration
- LSP/AST integrated tooling and verification workflows

---

## Magic Keywords

You can use natural language, but these shortcuts give explicit control:

| Keyword | Effect | Example |
| --- | --- | --- |
| `autopilot` | Full autonomous execution | `autopilot: implement OAuth login` |
| `ralph` | Persistent completion loop | `ralph fix flaky test suite` |
| `ulw` / `ultrawork` | Maximum parallelism | `ulw migrate all API handlers` |
| `eco` / `ecomode` | Token-efficient execution | `eco refactor this module` |
| `plan` | Strategic planning flow | `plan this feature end-to-end` |

---

## Configuration

Main user configuration file:

- `~/.factory/.omd-config.json`

Example:

```json
{
  "defaultExecutionMode": "ultrawork",
  "mcpServers": {
    "context7": { "enabled": true },
    "exa": { "enabled": true, "apiKey": "YOUR_EXA_KEY" }
  }
}
```

Full example:

```json
{
  "defaultExecutionMode": "ultrawork",
  "maxParallelAgents": 5,
  "verification": {
    "enabled": true,
    "defaultModel": "custom:claude-sonnet-4.5-5"
  },
  "models": {
    "default": "custom:gpt-5.3-codex-3",
    "low": "custom:gpt-5.2-codex-mini-0",
    "medium": "custom:claude-sonnet-4.5-5",
    "high": "custom:claude-opus-4.5-6"
  },
  "droids": {
    "architect": { "model": "custom:claude-opus-4.5-6", "enabled": true },
    "planner": { "model": "custom:claude-opus-4.5-6", "enabled": true },
    "executor": { "model": "custom:gpt-5.3-codex-3", "enabled": true },
    "explore": { "model": "custom:gpt-5.2-codex-mini-0", "enabled": true },
    "researcher": { "model": "custom:gpt-5.2-1", "enabled": true },
    "frontendEngineer": { "model": "custom:gemini-3-pro-8", "enabled": true },
    "documentWriter": { "model": "custom:claude-haiku-4.5-4", "enabled": true },
    "multimodalLooker": { "model": "custom:gemini-3-pro-8", "enabled": true }
  },
  "mcpServers": {
    "context7": { "enabled": true },
    "exa": { "enabled": true, "apiKey": "YOUR_EXA_KEY" },
    "x": { "enabled": true },
    "g": { "enabled": true }
  },
  "features": {
    "parallelExecution": true,
    "lspTools": true,
    "astTools": true,
    "continuationEnforcement": true,
    "autoContextInjection": true
  },
  "permissions": {
    "allowBash": true,
    "allowEdit": true,
    "allowWrite": true,
    "maxBackgroundTasks": 5
  },
  "magicKeywords": {
    "ultrawork": ["ulw", "ultrawork"],
    "search": ["search", "find"],
    "analyze": ["analyze", "debug", "investigate"],
    "ultrathink": ["ultrathink", "deep think"]
  }
}
```

### MCP bridge config

Project MCP bridge definition lives in `.mcp.json`:

```json
{
  "mcpServers": {
    "t": { "command": "node", "args": ["${DROID_PLUGIN_ROOT}/bridge/mcp-server.cjs"] },
    "x": { "command": "node", "args": ["${DROID_PLUGIN_ROOT}/bridge/codex-server.cjs"] },
    "g": { "command": "node", "args": ["${DROID_PLUGIN_ROOT}/bridge/gemini-server.cjs"] }
  }
}
```

---

## Model IDs (Supported)

`oh-my-droid` supports explicit custom model IDs:

- `custom:gpt-5.2-codex-mini-0`
- `custom:gpt-5.2-1`
- `custom:gpt-5.2-codex-2`
- `custom:gpt-5.3-codex-3`
- `custom:claude-haiku-4.5-4`
- `custom:claude-sonnet-4.5-5`
- `custom:claude-opus-4.5-6`
- `custom:gemini-3-flash-7`
- `custom:gemini-3-pro-8`

Droid defaults are defined in:

- `droids/*.md` (frontmatter `model`)
- `src/agents/*.ts`
- `src/agents/definitions.ts`
- `src/config/loader.ts`

---

## Development

### Requirements

- Node.js `>= 20`
- npm

### Build and test

```bash
npm install
npm run build
npm run lint
npm test
```

### Useful scripts

```bash
npm run dev
npm run test:coverage
npm run sync-metadata
```

---

## Project Structure

- `src/` core TypeScript source
- `droids/` droid prompts
- `skills/` skill definitions
- `commands/` command wrappers
- `hooks/` hook templates
- `bridge/` compiled MCP bridge servers
- `docs/` detailed references and architecture

---

## Documentation

- `docs/REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURES.md`
- `docs/MIGRATION.md`
- `docs/COMPATIBILITY.md`

---

## License

MIT

---

Special thanks to the original author of [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode).
