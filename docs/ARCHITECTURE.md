# Architecture

> How oh-my-droid orchestrates multi-agent workflows.

## Overview

oh-my-droid enables Droid to orchestrate specialized droids through a skill-based routing system.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OH-MY-DROIDCODE                                 │
│                     Intelligent Skill Activation                         │
└─────────────────────────────────────────────────────────────────────────┘

  User Input                      Skill Detection                 Execution
  ──────────                      ───────────────                 ─────────
       │                                │                              │
       ▼                                ▼                              ▼
┌─────────────┐              ┌──────────────────┐           ┌─────────────────┐
│  "ultrawork │              │   AGENTS.md      │           │ SKILL ACTIVATED │
│   refactor  │─────────────▶│   Auto-Routing   │──────────▶│                 │
│   the API"  │              │                  │           │ ultrawork +     │
└─────────────┘              │ Task Type:       │           │ default +       │
                             │  - Implementation│           │ git-master      │
                             │  - Multi-file    │           │                 │
                             │  - Parallel OK   │           │ ┌─────────────┐ │
                             │                  │           │ │ Parallel    │ │
                             │ Skills:          │           │ │ droids      │ │
                             │  - ultrawork ✓   │           │ │ launched    │ │
                             │  - default ✓     │           │ └─────────────┘ │
                             │  - git-master ✓  │           │                 │
                             └──────────────────┘           │ ┌─────────────┐ │
                                                            │ │ Atomic      │ │
                                                            │ │ commits     │ │
                                                            │ └─────────────┘ │
                                                            └─────────────────┘
```

## Core Concepts

### Skills

Skills are **behavior injections** that modify how the orchestrator operates. Instead of swapping droids, we inject capabilities through composable skills:

- **Execution Skills**: Primary task handlers (`default`, `planner`, `orchestrate`)
- **Enhancement Skills**: Additional capabilities (`ultrawork`, `git-master`, `frontend-ui-ux`)
- **Guarantee Skills**: Completion enforcement (`ralph`)

Skills can stack and compose:
```
Task: "ultrawork: refactor API with proper commits"
Skills: ultrawork + default + git-master
```

### Agents

32 specialized droids organized by complexity tier:

| Tier | Model | Use For |
|------|-------|---------|
| LOW | Haiku | Quick lookups, simple operations |
| MEDIUM | Sonnet | Standard implementations |
| HIGH | Opus | Complex reasoning, architecture |

See [REFERENCE.md](./REFERENCE.md) for the complete agent roster.

### Delegation

Work is delegated through the Task tool with intelligent model routing:

```typescript
Task(
  subagent_type="oh-my-droid:executor",
  model="sonnet",
  prompt="Implement feature..."
)
```

Categories like `visual-engineering` and `ultrabrain` auto-select model tier, temperature, and thinking budget.

## Skill Composition

Skills compose in layers:

```
┌─────────────────────────────────────────────────────────────┐
│  GUARANTEE LAYER (optional)                                  │
│  ralph: "Cannot stop until verified done"                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ENHANCEMENT LAYER (0-N skills)                              │
│  ultrawork (parallel) | git-master (commits) | frontend-ui-ux│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  EXECUTION LAYER (primary skill)                             │
│  default (build) | orchestrate (coordinate) | planner (plan) │
└─────────────────────────────────────────────────────────────┘
```

**Formula:** `[Execution Skill] + [0-N Enhancements] + [Optional Guarantee]`

## State Management

State files follow standardized locations:

**Local Project State:**
- `.omd/state/{name}.json` - Session state (ultrapilot, swarm, pipeline)
- `.omd/notepads/{plan-name}/` - Plan-scoped wisdom capture

**Global State:**
- `~/.omd/state/{name}.json` - User preferences and global config

Legacy locations are auto-migrated on read.

## Hooks

oh-my-droid includes 31 hooks in `src/hooks/` for lifecycle events:

| Event | Purpose |
|-------|---------|
| `UserPromptSubmit` | Keyword detection, mode activation |
| `Stop` | Continuation enforcement, session end |
| `PreToolUse` | Permission validation |
| `PostToolUse` | Error recovery, rules injection |

See [REFERENCE.md](./REFERENCE.md) for the complete hooks list.

## Verification Protocol

The verification module ensures work completion with evidence:

**Standard Checks:**
- BUILD: Compilation passes
- TEST: All tests pass
- LINT: No linting errors
- FUNCTIONALITY: Feature works as expected
- ARCHITECT: Opus-tier review approval
- TODO: All tasks completed
- ERROR_FREE: No unresolved errors

Evidence must be fresh (within 5 minutes) and include actual command output.

## For More Details

- **Complete Reference**: See [REFERENCE.md](./REFERENCE.md)
- **Internal API**: See [FEATURES.md](./FEATURES.md)
- **User Guide**: See [README.md](../README.md)
- **Skills Reference**: See AGENTS.md in your project
