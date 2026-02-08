---
description: N coordinated droids on shared task list using Droid native teams
aliases: [team-droids, team-mode]
---

# Team Command

[TEAM MODE ACTIVATED]

Spawn N coordinated droids working on a shared task list using Droid's native TeamCreate, SendMessage, and TaskCreate tools. Like a dev team with real-time communication—fast, reliable, and with built-in coordination.

## User's Request

{{ARGUMENTS}}

## Usage Patterns

### Standard Mode (1-5 droids)
```
/oh-my-droid:team N:agent-type "task description"
```

### Parameters

- **N** - Number of droids (1-5, Droid background task limit)
- **agent-type** - Agent to spawn (e.g., executor, build-fixer, architect)
- **task** - High-level task to decompose and distribute

### Examples

```bash
/oh-my-droid:team 5:executor "fix all TypeScript errors"
/oh-my-droid:team 3:build-fixer "fix build errors in src/"
/oh-my-droid:team 4:designer "implement responsive layouts for all components"
/oh-my-droid:team 2:architect "analyze and document all API endpoints"
```

## Architecture

```
User: "/team 5:executor fix all TypeScript errors"
              |
              v
      [TEAM ORCHESTRATOR]
              |
     TeamCreate("fix-ts-errors")
              |
    TaskCreate × N (one per subtask)
              |
   Task(team_name) × 5
              |
   +--+--+--+--+--+
   |  |  |  |  |
   v  v  v  v  v
  T1 T2 T3 T4 T5   ← teammates
   |  |  |  |  |
   TaskList → claim → work → complete
   |  |  |  |  |
   SendMessage → team lead
```

**Key Features:**
- Native Droid team tools (TeamCreate/SendMessage/TaskCreate)
- Real-time inter-agent messaging (DMs and broadcasts)
- Built-in task dependencies (blocks/blockedBy)
- Graceful shutdown protocol
- Zero external dependencies (no SQLite needed)

## ENFORCEMENT (CRITICAL - HARD RULES)

### Mandatory Tool Sequence

**EVERY TEAM MODE SESSION MUST FOLLOW THIS EXACT SEQUENCE:**

1. **TeamCreate()** - MUST be called FIRST before any Task droids
2. **TaskCreate() × N** - Create all subtasks on the shared task list
3. **Task(team_name=..., name=...) × N** - Spawn teammates WITH both team_name and name parameters
4. **Monitor** - Track progress via TaskList + receive automatic SendMessage from teammates
5. **SendMessage(type="shutdown_request") × N** - Graceful shutdown each teammate
6. **TeamDelete()** - Clean up team resources

**SKIPPING ANY STEP = NOT TEAM MODE.**

### ANTI-PATTERNS (NEVER DO THIS)

❌ **Launching Task droids without calling TeamCreate first**
   - If you skip TeamCreate, you're doing ultrawork, NOT team mode

❌ **Using run_in_background without team_name parameter**
   - That's parallel ultrawork, not team coordination

❌ **Skipping TaskCreate and having droids self-organize**
   - Defeats the purpose of shared task list coordination

❌ **Skipping shutdown_request / TeamDelete cleanup**
   - Leaves zombie team state and orphaned task lists

❌ **Using Task tool without the `name` parameter**
   - Teammates need names for messaging - name identifies them in SendMessage

❌ **Spawning droids then claiming "team mode complete" without cleanup**
   - You MUST call SendMessage(shutdown_request) and TeamDelete

### Mode Distinction

```
┌─────────────────────────────────────────────────────────────┐
│ TEAM MODE = TeamCreate + TaskCreate + Task(team_name, name) │
│           + SendMessage + TeamDelete                         │
│                                                              │
│ ULTRAWORK = Task(run_in_background) without team infra      │
│                                                              │
│ If you skip TeamCreate, you are doing ULTRAWORK, NOT TEAM.  │
└─────────────────────────────────────────────────────────────┘
```

### Tool Call Requirements

**Task tool for teammates MUST include:**
- `team_name` - Links agent to team's shared task list
- `name` - Identifies agent for messaging (e.g., "agent-1", "executor-2", "fixer-a")

**Example:**
```typescript
Task(
  subagent_type="oh-my-droid:executor",
  team_name="fix-issues",
  name="agent-1",
  prompt="Fix TypeScript errors in src/commands/"
)
```

## Verification Gate

**Before claiming team mode is complete, verify ALL of:**

1. ✅ TeamCreate was called (team config exists at `~/.factory/teams/{team-name}/config.json`)
2. ✅ All TaskCreate tasks show `status=completed` in TaskList
3. ✅ All teammates received `shutdown_request` via SendMessage
4. ✅ TeamDelete was called to clean up team resources

**If ANY verification fails → CONTINUE WORKING until all pass.**

## Workflow

### 1. Parse Input

From `{{ARGUMENTS}}`, extract:
- N (agent count, validate <= 5)
- agent-type (executor, build-fixer, etc.)
- task description

### 2. Analyze & Decompose Task
- Explore codebase to understand scope
- Break into N independent subtasks
- Identify file ownership per subtask

### 3. Create Team & Tasks
- TeamCreate with descriptive name
- TaskCreate for each subtask (with dependencies if needed)

### 4. Spawn Teammates
- Launch N droids via Task tool with BOTH `team_name` AND `name` parameters
- Each teammate: TaskList → claim → work → complete → report

**Example:**
```typescript
Task(
  subagent_type="oh-my-droid:executor",
  team_name="fix-issues",
  name="agent-1",
  prompt="Fix TypeScript errors in src/commands/"
)
```

### 5. Monitor & Coordinate
- Track progress via TaskList
- Receive automatic messages from teammates
- Send guidance/coordination messages as needed

### 6. Completion & Cleanup
- Verify all tasks completed
- SendMessage(shutdown_request) to each teammate
- TeamDelete to clean up

## Cancellation

Use unified cancel command:
```
/oh-my-droid:cancel
```

## Output

Report when complete:
- Total tasks completed
- Tasks per agent
- Total time elapsed
- Summary of changes made
