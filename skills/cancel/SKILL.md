---
name: cancel
description: Cancel any active OMD mode (autopilot, ralph, ultrawork, ecomode, ultraqa, swarm, ultrapilot, pipeline, team)
---

# Cancel Skill

Intelligent cancellation that detects and cancels the active OMD mode.

**The cancel skill is the standard way to complete and exit any OMD mode.**
When the stop hook detects work is complete, it instructs the LLM to invoke
this skill for proper state cleanup. If cancel fails or is interrupted,
retry with `--force` flag, or wait for the 2-hour staleness timeout as
a last resort.

## What It Does

Automatically detects which mode is active and cancels it:
- **Autopilot**: Stops workflow, preserves progress for resume
- **Ralph**: Stops persistence loop, clears linked ultrawork if applicable
- **Ultrawork**: Stops parallel execution (standalone or linked)
- **Ecomode**: Stops token-efficient parallel execution (standalone or linked to ralph)
- **UltraQA**: Stops QA cycling workflow
- **Swarm**: Stops coordinated agent swarm, releases claimed tasks
- **Ultrapilot**: Stops parallel autopilot workers
- **Pipeline**: Stops sequential agent pipeline
- **Team**: Sends shutdown_request to all teammates, waits for responses, calls TeamDelete

## Usage

```
/oh-my-droid:cancel
```

Or say: "cancelomd", "stopomd"

## Auto-Detection

The skill checks state files to determine what's active:
- `.omd/state/autopilot-state.json` → Autopilot detected
- `.omd/state/ralph-state.json` → Ralph detected
- `.omd/state/ultrawork-state.json` → Ultrawork detected
- `.omd/state/ecomode-state.json` → Ecomode detected
- `.omd/state/ultraqa-state.json` → UltraQA detected
- `.omd/state/swarm.db` → Swarm detected (SQLite database)
- `.omd/state/ultrapilot-state.json` → Ultrapilot detected
- `.omd/state/pipeline-state.json` → Pipeline detected
- `.omd/state/plan-consensus.json` → Plan Consensus detected
- `.omd/state/ralplan-state.json` → Plan Consensus detected (legacy)
- `~/.factory/teams/*/config.json` → Team detected (Droid native team)

If multiple modes are active, they're cancelled in order of dependency:
1. Autopilot (includes ralph/ultraqa/ecomode cleanup)
2. Ralph (includes linked ultrawork OR ecomode cleanup)
3. Ultrawork (standalone)
4. Ecomode (standalone)
5. UltraQA (standalone)
6. Swarm (standalone)
7. Ultrapilot (standalone)
8. Pipeline (standalone)
9. Team (Droid native)
10. Plan Consensus (standalone)

## Force Clear All

To clear ALL state files regardless of what's active:

```
/oh-my-droid:cancel --force
```

Or use the `--all` alias:

```
/oh-my-droid:cancel --all
```

This removes all state files:
- `.omd/state/autopilot-state.json`
- `.omd/state/ralph-state.json`
- `.omd/state/ralph-plan-state.json`
- `.omd/state/ralph-verification.json`
- `.omd/state/ultrawork-state.json`
- `.omd/state/ecomode-state.json`
- `.omd/state/ultraqa-state.json`
- `.omd/state/swarm.db`
- `.omd/state/swarm.db-wal`
- `.omd/state/swarm.db-shm`
- `.omd/state/swarm-active.marker`
- `.omd/state/swarm-tasks.db`
- `.omd/state/ultrapilot-state.json`
- `.omd/state/ultrapilot-ownership.json`
- `.omd/state/pipeline-state.json`
- `.omd/state/plan-consensus.json`
- `.omd/state/ralplan-state.json`
- `.omd/state/boulder.json`
- `.omd/state/hud-state.json`
- `.omd/state/subagent-tracking.json`
- `.omd/state/subagent-tracker.lock`
- `.omd/state/rate-limit-daemon.pid`
- `.omd/state/rate-limit-daemon.log`
- `.omd/state/checkpoints/` (directory)

## Implementation Steps

When you invoke this skill:

### 1. Parse Arguments

```bash
# Check for --force or --all flags
FORCE_MODE=false
if [[ "$*" == *"--force"* ]] || [[ "$*" == *"--all"* ]]; then
  FORCE_MODE=true
fi
```

### 2. Detect Active Modes

```bash
# Check which modes are active
AUTOPILOT_ACTIVE=false
RALPH_ACTIVE=false
ULTRAWORK_ACTIVE=false
ECOMODE_ACTIVE=false
ULTRAQA_ACTIVE=false

if [[ -f .omd/state/autopilot-state.json ]]; then
  AUTOPILOT_ACTIVE=$(cat .omd/state/autopilot-state.json | jq -r '.active // false')
fi

if [[ -f .omd/state/ralph-state.json ]]; then
  RALPH_ACTIVE=$(cat .omd/state/ralph-state.json | jq -r '.active // false')
fi

if [[ -f .omd/state/ultrawork-state.json ]]; then
  ULTRAWORK_ACTIVE=$(cat .omd/state/ultrawork-state.json | jq -r '.active // false')
fi

if [[ -f .omd/state/ecomode-state.json ]]; then
  ECOMODE_ACTIVE=$(cat .omd/state/ecomode-state.json | jq -r '.active // false')
fi

if [[ -f .omd/state/ultraqa-state.json ]]; then
  ULTRAQA_ACTIVE=$(cat .omd/state/ultraqa-state.json | jq -r '.active // false')
fi

PLAN_CONSENSUS_ACTIVE=false

# Check both new and legacy locations
if [[ -f .omd/state/plan-consensus.json ]]; then
  PLAN_CONSENSUS_ACTIVE=$(cat .omd/state/plan-consensus.json | jq -r '.active // false')
elif [[ -f .omd/state/ralplan-state.json ]]; then
  PLAN_CONSENSUS_ACTIVE=$(cat .omd/state/ralplan-state.json | jq -r '.active // false')
fi
```

### 3A. Force Mode (if --force or --all)

```bash
if [[ "$FORCE_MODE" == "true" ]]; then
  echo "FORCE CLEAR: Removing all OMD state files..."

  # Remove local state files
  rm -f .omd/state/autopilot-state.json
  rm -f .omd/state/ralph-state.json
  rm -f .omd/state/ralph-plan-state.json
  rm -f .omd/state/ralph-verification.json
  rm -f .omd/state/ultrawork-state.json
  rm -f .omd/state/ecomode-state.json
  rm -f .omd/state/ultraqa-state.json
  rm -f .omd/state/swarm.db
  rm -f .omd/state/swarm.db-wal
  rm -f .omd/state/swarm.db-shm
  rm -f .omd/state/swarm-active.marker
  rm -f .omd/state/swarm-tasks.db
  rm -f .omd/state/ultrapilot-state.json
  rm -f .omd/state/ultrapilot-ownership.json
  rm -f .omd/state/pipeline-state.json
  rm -f .omd/state/plan-consensus.json
  rm -f .omd/state/ralplan-state.json
  rm -f .omd/state/boulder.json
  rm -f .omd/state/hud-state.json
  rm -f .omd/state/subagent-tracking.json
  rm -f .omd/state/subagent-tracker.lock
  rm -f .omd/state/rate-limit-daemon.pid
  rm -f .omd/state/rate-limit-daemon.log
  rm -rf .omd/state/checkpoints/

  # Remove team state and attempt cleanup
  rm -f .omd/state/team-state.json
  # Attempt TeamDelete for any existing teams (best-effort)
  # If TeamDelete fails, manually remove:
  #   rm -rf ~/.factory/teams/*/
  #   rm -rf ~/.factory/tasks/*/

  # Stop rate-limit daemon if running
  if [[ -f .omd/state/rate-limit-daemon.pid ]]; then
    kill "$(cat .omd/state/rate-limit-daemon.pid)" 2>/dev/null || true
    rm -f .omd/state/rate-limit-daemon.pid
  fi

  echo "All OMD modes cleared. You are free to start fresh."
  exit 0
fi
```

### 3B. Smart Cancellation (default)

#### If Team Active (Droid native)

Teams are detected by checking for config files in `~/.factory/teams/`:

```bash
# Check for active teams
TEAM_CONFIGS=$(find ~/.factory/teams -name config.json -maxdepth 2 2>/dev/null)
```

**Two-pass cancellation protocol:**

**Pass 1: Graceful Shutdown**
```
For each team found in ~/.factory/teams/:
  1. Read config.json to get team_name and members list
  2. For each non-lead member:
     a. Send shutdown_request via SendMessage
     b. Wait up to 15 seconds for shutdown_response
     c. If response received: member terminates and is auto-removed
     d. If timeout: mark member as unresponsive, continue to next
  3. Log: "Graceful pass: X/Y members responded"
```

**Pass 2: Reconciliation**
```
After graceful pass:
  1. Re-read config.json to check remaining members
  2. If only lead remains (or config is empty): proceed to TeamDelete
  3. If unresponsive members remain:
     a. Wait 5 more seconds (they may still be processing)
     b. Re-read config.json again
     c. If still stuck: attempt TeamDelete anyway
     d. If TeamDelete fails: report manual cleanup path
```

**TeamDelete + Cleanup:**
```
  1. Call TeamDelete() — removes ~/.factory/teams/{name}/ and ~/.factory/tasks/{name}/
  2. Remove local state: rm -f .omd/state/team-state.json
  3. Emit structured cancel report
```

**Structured Cancel Report:**
```
Team "{team_name}" cancelled:
  - Members signaled: N
  - Responses received: M
  - Unresponsive: K (list names if any)
  - TeamDelete: success/failed
  - Manual cleanup needed: yes/no
    Path: ~/.factory/teams/{name}/ and ~/.factory/tasks/{name}/
```

**Implementation note:** The cancel skill is executed by the LLM, not as a bash script. When you detect an active team:
1. Read `~/.factory/teams/*/config.json` to find active teams
2. If multiple teams exist, cancel oldest first (by `createdAt`)
3. For each non-lead member, call `SendMessage(type: "shutdown_request", recipient: member-name, content: "Cancelling")`
4. Wait briefly for shutdown responses (15s per member timeout)
5. Re-read config.json to check for remaining members (reconciliation pass)
6. Call `TeamDelete()` to clean up
7. Remove any local state: `rm -f .omd/state/team-state.json`
8. Report structured summary to user

#### If Autopilot Active

Call `cancelAutopilot()` from `src/hooks/autopilot/cancel.ts:27-78`:

```bash
# Autopilot handles its own cleanup + ralph + ultraqa
# Just mark autopilot as inactive (preserves state for resume)
if [[ -f .omd/state/autopilot-state.json ]]; then
  # Clean up ralph if active
  if [[ -f .omd/state/ralph-state.json ]]; then
    RALPH_STATE=$(cat .omd/state/ralph-state.json)
    LINKED_UW=$(echo "$RALPH_STATE" | jq -r '.linked_ultrawork // false')

    # Clean linked ultrawork first
    if [[ "$LINKED_UW" == "true" ]] && [[ -f .omd/state/ultrawork-state.json ]]; then
      rm -f .omd/state/ultrawork-state.json
      echo "Cleaned up: ultrawork (linked to ralph)"
    fi

    # Clean ralph
    rm -f .omd/state/ralph-state.json
    rm -f .omd/state/ralph-verification.json
    echo "Cleaned up: ralph"
  fi

  # Clean up ultraqa if active
  if [[ -f .omd/state/ultraqa-state.json ]]; then
    rm -f .omd/state/ultraqa-state.json
    echo "Cleaned up: ultraqa"
  fi

  # Mark autopilot inactive but preserve state
  CURRENT_STATE=$(cat .omd/state/autopilot-state.json)
  CURRENT_PHASE=$(echo "$CURRENT_STATE" | jq -r '.phase // "unknown"')
  echo "$CURRENT_STATE" | jq '.active = false' > .omd/state/autopilot-state.json

  echo "Autopilot cancelled at phase: $CURRENT_PHASE. Progress preserved for resume."
  echo "Run /oh-my-droid:autopilot to resume."
fi
```

#### If Ralph Active (but not Autopilot)

Call `clearRalphState()` + `clearLinkedUltraworkState()` from `src/hooks/ralph-loop/index.ts:147-182`:

```bash
if [[ -f .omd/state/ralph-state.json ]]; then
  # Check if ultrawork is linked
  RALPH_STATE=$(cat .omd/state/ralph-state.json)
  LINKED_UW=$(echo "$RALPH_STATE" | jq -r '.linked_ultrawork // false')

  # Clean linked ultrawork first
  if [[ "$LINKED_UW" == "true" ]] && [[ -f .omd/state/ultrawork-state.json ]]; then
    UW_STATE=$(cat .omd/state/ultrawork-state.json)
    UW_LINKED=$(echo "$UW_STATE" | jq -r '.linked_to_ralph // false')

    # Only clear if it was linked to ralph
    if [[ "$UW_LINKED" == "true" ]]; then
      rm -f .omd/state/ultrawork-state.json
      echo "Cleaned up: ultrawork (linked to ralph)"
    fi
  fi

  # Clean ralph state
  rm -f .omd/state/ralph-state.json
  rm -f .omd/state/ralph-plan-state.json
  rm -f .omd/state/ralph-verification.json

  echo "Ralph cancelled. Persistent mode deactivated."
fi
```

#### If Ultrawork Active (standalone, not linked)

Call `deactivateUltrawork()` from `src/hooks/ultrawork/index.ts:150-173`:

```bash
if [[ -f .omd/state/ultrawork-state.json ]]; then
  # Check if linked to ralph
  UW_STATE=$(cat .omd/state/ultrawork-state.json)
  LINKED=$(echo "$UW_STATE" | jq -r '.linked_to_ralph // false')

  if [[ "$LINKED" == "true" ]]; then
    echo "Ultrawork is linked to Ralph. Use /oh-my-droid:cancel to cancel both."
    exit 1
  fi

  # Remove local state
  rm -f .omd/state/ultrawork-state.json

  echo "Ultrawork cancelled. Parallel execution mode deactivated."
fi
```

#### If UltraQA Active (standalone)

Call `clearUltraQAState()` from `src/hooks/ultraqa/index.ts:107-120`:

```bash
if [[ -f .omd/state/ultraqa-state.json ]]; then
  rm -f .omd/state/ultraqa-state.json
  echo "UltraQA cancelled. QA cycling workflow stopped."
fi
```

#### No Active Modes

```bash
echo "No active OMD modes detected."
echo ""
echo "Checked for:"
echo "  - Autopilot (.omd/state/autopilot-state.json)"
echo "  - Ralph (.omd/state/ralph-state.json)"
echo "  - Ultrawork (.omd/state/ultrawork-state.json)"
echo "  - UltraQA (.omd/state/ultraqa-state.json)"
echo ""
echo "Use --force to clear all state files anyway."
```

## Complete Implementation

Here's the complete bash implementation you should run:

```bash
#!/bin/bash

# Parse arguments
FORCE_MODE=false
if [[ "$*" == *"--force"* ]] || [[ "$*" == *"--all"* ]]; then
  FORCE_MODE=true
fi

# Force mode: clear everything
if [[ "$FORCE_MODE" == "true" ]]; then
  echo "FORCE CLEAR: Removing all OMD state files..."

  mkdir -p .omd/state

  # Stop rate-limit daemon if running
  if [[ -f .omd/state/rate-limit-daemon.pid ]]; then
    kill "$(cat .omd/state/rate-limit-daemon.pid)" 2>/dev/null || true
    rm -f .omd/state/rate-limit-daemon.pid
  fi

  # Remove local state files
  rm -f .omd/state/autopilot-state.json
  rm -f .omd/state/ralph-state.json
  rm -f .omd/state/ralph-plan-state.json
  rm -f .omd/state/ralph-verification.json
  rm -f .omd/state/ultrawork-state.json
  rm -f .omd/state/ecomode-state.json
  rm -f .omd/state/ultraqa-state.json
  rm -f .omd/state/swarm.db
  rm -f .omd/state/swarm.db-wal
  rm -f .omd/state/swarm.db-shm
  rm -f .omd/state/swarm-active.marker
  rm -f .omd/state/swarm-tasks.db
  rm -f .omd/state/ultrapilot-state.json
  rm -f .omd/state/ultrapilot-ownership.json
  rm -f .omd/state/pipeline-state.json
  rm -f .omd/state/plan-consensus.json
  rm -f .omd/state/ralplan-state.json
  rm -f .omd/state/boulder.json
  rm -f .omd/state/hud-state.json
  rm -f .omd/state/subagent-tracking.json
  rm -f .omd/state/subagent-tracker.lock
  rm -f .omd/state/rate-limit-daemon.log
  rm -rf .omd/state/checkpoints/

  echo ""
  echo "All OMD modes cleared. You are free to start fresh."
  exit 0
fi

# Track what we cancelled
CANCELLED_ANYTHING=false

# 1. Check Autopilot (highest priority, includes cleanup of ralph/ultraqa)
if [[ -f .omd/state/autopilot-state.json ]]; then
  AUTOPILOT_STATE=$(cat .omd/state/autopilot-state.json)
  AUTOPILOT_ACTIVE=$(echo "$AUTOPILOT_STATE" | jq -r '.active // false')

  if [[ "$AUTOPILOT_ACTIVE" == "true" ]]; then
    CURRENT_PHASE=$(echo "$AUTOPILOT_STATE" | jq -r '.phase // "unknown"')
    CLEANED_UP=()

    # Clean up ralph if active
    if [[ -f .omd/state/ralph-state.json ]]; then
      RALPH_STATE=$(cat .omd/state/ralph-state.json)
      RALPH_ACTIVE=$(echo "$RALPH_STATE" | jq -r '.active // false')

      if [[ "$RALPH_ACTIVE" == "true" ]]; then
        LINKED_UW=$(echo "$RALPH_STATE" | jq -r '.linked_ultrawork // false')

        # Clean linked ultrawork first
        if [[ "$LINKED_UW" == "true" ]] && [[ -f .omd/state/ultrawork-state.json ]]; then
          rm -f .omd/state/ultrawork-state.json
          CLEANED_UP+=("ultrawork")
        fi

        # Clean ralph
        rm -f .omd/state/ralph-state.json
        rm -f .omd/state/ralph-verification.json
        CLEANED_UP+=("ralph")
      fi
    fi

    # Clean up ultraqa if active
    if [[ -f .omd/state/ultraqa-state.json ]]; then
      ULTRAQA_STATE=$(cat .omd/state/ultraqa-state.json)
      ULTRAQA_ACTIVE=$(echo "$ULTRAQA_STATE" | jq -r '.active // false')

      if [[ "$ULTRAQA_ACTIVE" == "true" ]]; then
        rm -f .omd/state/ultraqa-state.json
        CLEANED_UP+=("ultraqa")
      fi
    fi

    # Mark autopilot inactive but preserve state for resume
    echo "$AUTOPILOT_STATE" | jq '.active = false' > .omd/state/autopilot-state.json

    echo "Autopilot cancelled at phase: $CURRENT_PHASE."

    if [[ ${#CLEANED_UP[@]} -gt 0 ]]; then
      echo "Cleaned up: ${CLEANED_UP[*]}"
    fi

    echo "Progress preserved for resume. Run /oh-my-droid:autopilot to continue."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 2. Check Ralph (if not handled by autopilot)
if [[ -f .omd/state/ralph-state.json ]]; then
  RALPH_STATE=$(cat .omd/state/ralph-state.json)
  RALPH_ACTIVE=$(echo "$RALPH_STATE" | jq -r '.active // false')

  if [[ "$RALPH_ACTIVE" == "true" ]]; then
    LINKED_UW=$(echo "$RALPH_STATE" | jq -r '.linked_ultrawork // false')

    # Clean linked ultrawork first
    if [[ "$LINKED_UW" == "true" ]] && [[ -f .omd/state/ultrawork-state.json ]]; then
      UW_STATE=$(cat .omd/state/ultrawork-state.json)
      UW_LINKED=$(echo "$UW_STATE" | jq -r '.linked_to_ralph // false')

      # Only clear if it was linked to ralph
      if [[ "$UW_LINKED" == "true" ]]; then
        rm -f .omd/state/ultrawork-state.json
        echo "Cleaned up: ultrawork (linked to ralph)"
      fi
    fi

    # Clean linked ecomode if present
    LINKED_ECO=$(echo "$RALPH_STATE" | jq -r '.linked_ecomode // false')

    if [[ "$LINKED_ECO" == "true" ]] && [[ -f .omd/state/ecomode-state.json ]]; then
      ECO_STATE=$(cat .omd/state/ecomode-state.json)
      ECO_LINKED=$(echo "$ECO_STATE" | jq -r '.linked_to_ralph // false')

      if [[ "$ECO_LINKED" == "true" ]]; then
        rm -f .omd/state/ecomode-state.json
        echo "Cleaned up: ecomode (linked to ralph)"
      fi
    fi

    # Clean ralph state
    rm -f .omd/state/ralph-state.json
    rm -f .omd/state/ralph-plan-state.json
    rm -f .omd/state/ralph-verification.json

    echo "Ralph cancelled. Persistent mode deactivated."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 3. Check Ultrawork (standalone, not linked)
if [[ -f .omd/state/ultrawork-state.json ]]; then
  UW_STATE=$(cat .omd/state/ultrawork-state.json)
  UW_ACTIVE=$(echo "$UW_STATE" | jq -r '.active // false')

  if [[ "$UW_ACTIVE" == "true" ]]; then
    LINKED=$(echo "$UW_STATE" | jq -r '.linked_to_ralph // false')

    if [[ "$LINKED" == "true" ]]; then
      echo "Warning: Ultrawork is linked to Ralph, but Ralph is not active."
      echo "Clearing ultrawork state anyway..."
    fi

    # Remove local state
    rm -f .omd/state/ultrawork-state.json

    echo "Ultrawork cancelled. Parallel execution mode deactivated."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 4. Check Ecomode (standalone, not linked)
if [[ -f .omd/state/ecomode-state.json ]]; then
  ECO_STATE=$(cat .omd/state/ecomode-state.json)
  ECO_ACTIVE=$(echo "$ECO_STATE" | jq -r '.active // false')

  if [[ "$ECO_ACTIVE" == "true" ]]; then
    LINKED=$(echo "$ECO_STATE" | jq -r '.linked_to_ralph // false')

    if [[ "$LINKED" == "true" ]]; then
      echo "Warning: Ecomode is linked to Ralph, but Ralph is not active."
      echo "Clearing ecomode state anyway..."
    fi

    # Remove local state
    rm -f .omd/state/ecomode-state.json

    echo "Ecomode cancelled. Token-efficient execution mode deactivated."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 5. Check UltraQA (standalone)
if [[ -f .omd/state/ultraqa-state.json ]]; then
  ULTRAQA_STATE=$(cat .omd/state/ultraqa-state.json)
  ULTRAQA_ACTIVE=$(echo "$ULTRAQA_STATE" | jq -r '.active // false')

  if [[ "$ULTRAQA_ACTIVE" == "true" ]]; then
    rm -f .omd/state/ultraqa-state.json
    echo "UltraQA cancelled. QA cycling workflow stopped."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 6. Check Swarm (SQLite-based)
SWARM_DB=".omd/state/swarm.db"
if [[ -f "$SWARM_DB" ]]; then
  # Check if sqlite3 CLI is available
  if command -v sqlite3 &>/dev/null; then
    # Query SQLite to check if swarm is active
    SWARM_ACTIVE=$(sqlite3 "$SWARM_DB" "SELECT active FROM swarm_session WHERE id = 1;" 2>/dev/null || echo "0")

    if [[ "$SWARM_ACTIVE" == "1" ]]; then
      # Get stats before cancelling
      DONE_TASKS=$(sqlite3 "$SWARM_DB" "SELECT COUNT(*) FROM tasks WHERE status = 'done';" 2>/dev/null || echo "0")
      TOTAL_TASKS=$(sqlite3 "$SWARM_DB" "SELECT COUNT(*) FROM tasks;" 2>/dev/null || echo "0")

      # Mark swarm as inactive
      sqlite3 "$SWARM_DB" "UPDATE swarm_session SET active = 0, completed_at = $(date +%s000) WHERE id = 1;"

      echo "Swarm cancelled. $DONE_TASKS/$TOTAL_TASKS tasks completed."
      echo "Database preserved at $SWARM_DB for analysis."
      CANCELLED_ANYTHING=true
      exit 0
    fi
  else
    # Fallback: Check marker file if sqlite3 is not available
    MARKER_FILE=".omd/state/swarm-active.marker"
    if [[ -f "$MARKER_FILE" ]]; then
      rm -f "$MARKER_FILE"
      echo "Swarm cancelled (marker file removed). Database at $SWARM_DB may need manual cleanup."
      CANCELLED_ANYTHING=true
      exit 0
    fi
  fi
fi

# 7. Check Ultrapilot (standalone)
if [[ -f .omd/state/ultrapilot-state.json ]]; then
  ULTRAPILOT_STATE=$(cat .omd/state/ultrapilot-state.json)
  ULTRAPILOT_ACTIVE=$(echo "$ULTRAPILOT_STATE" | jq -r '.active // false')

  if [[ "$ULTRAPILOT_ACTIVE" == "true" ]]; then
    rm -f .omd/state/ultrapilot-state.json
    echo "Ultrapilot cancelled. Parallel autopilot workers stopped."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 8. Check Pipeline (standalone)
if [[ -f .omd/state/pipeline-state.json ]]; then
  PIPELINE_STATE=$(cat .omd/state/pipeline-state.json)
  PIPELINE_ACTIVE=$(echo "$PIPELINE_STATE" | jq -r '.active // false')

  if [[ "$PIPELINE_ACTIVE" == "true" ]]; then
    rm -f .omd/state/pipeline-state.json
    echo "Pipeline cancelled. Sequential agent chain stopped."
    CANCELLED_ANYTHING=true
    exit 0
  fi
fi

# 9. Check Plan Consensus (standalone)
if [[ "$PLAN_CONSENSUS_ACTIVE" == "true" ]]; then
  echo "Cancelling Plan Consensus mode..."

  # Clear state files
  rm -f .omd/state/plan-consensus.json
  rm -f .omd/state/ralplan-state.json

  echo "Plan Consensus cancelled. Planning session ended."
  echo "Note: Plan file preserved at path specified in state."
  CANCELLED_ANYTHING=true
  exit 0
fi

# No active modes found
if [[ "$CANCELLED_ANYTHING" == "false" ]]; then
  echo "No active OMD modes detected."
  echo ""
  echo "Checked for:"
  echo "  - Autopilot (.omd/state/autopilot-state.json)"
  echo "  - Ralph (.omd/state/ralph-state.json)"
  echo "  - Ultrawork (.omd/state/ultrawork-state.json)"
  echo "  - Ecomode (.omd/state/ecomode-state.json)"
  echo "  - UltraQA (.omd/state/ultraqa-state.json)"
  echo "  - Swarm (.omd/state/swarm.db)"
  echo "  - Ultrapilot (.omd/state/ultrapilot-state.json)"
  echo "  - Pipeline (.omd/state/pipeline-state.json)"
  echo "  - Plan Consensus (.omd/state/plan-consensus.json)"
  echo ""
  echo "Use --force to clear all state files anyway."
fi
```

## Messages Reference

| Mode | Success Message |
|------|-----------------|
| Autopilot | "Autopilot cancelled at phase: {phase}. Progress preserved for resume." |
| Ralph | "Ralph cancelled. Persistent mode deactivated." |
| Ultrawork | "Ultrawork cancelled. Parallel execution mode deactivated." |
| Ecomode | "Ecomode cancelled. Token-efficient execution mode deactivated." |
| UltraQA | "UltraQA cancelled. QA cycling workflow stopped." |
| Swarm | "Swarm cancelled. Coordinated droids stopped." |
| Ultrapilot | "Ultrapilot cancelled. Parallel autopilot workers stopped." |
| Pipeline | "Pipeline cancelled. Sequential agent chain stopped." |
| Team | "Team cancelled. Teammates shut down and cleaned up." |
| Plan Consensus | "Plan Consensus cancelled. Planning session ended." |
| Force | "All OMD modes cleared. You are free to start fresh." |
| None | "No active OMD modes detected." |

## What Gets Preserved

| Mode | State Preserved | Resume Command |
|------|-----------------|----------------|
| Autopilot | Yes (phase, files, spec, plan, verdicts) | `/oh-my-droid:autopilot` |
| Ralph | No | N/A |
| Ultrawork | No | N/A |
| UltraQA | No | N/A |
| Swarm | No | N/A |
| Ultrapilot | No | N/A |
| Pipeline | No | N/A |
| Plan Consensus | Yes (plan file path preserved) | N/A |

## Notes

- **Dependency-aware**: Autopilot cancellation cleans up Ralph and UltraQA
- **Link-aware**: Ralph cancellation cleans up linked Ultrawork or Ecomode
- **Safe**: Only clears linked Ultrawork, preserves standalone Ultrawork
- **Local-only**: Clears state files in `.omd/state/` directory
- **Resume-friendly**: Autopilot state is preserved for seamless resume
- **Team-aware**: Detects native Droid teams and performs graceful shutdown

## MCP Worker Cleanup

When cancelling modes that may have spawned MCP workers (team bridge daemons), the cancel skill should also:

1. **Check for active MCP workers**: Look for heartbeat files at `.omd/state/team-bridge/{team}/*.heartbeat.json`
2. **Send shutdown signals**: Write shutdown signal files for each active worker
3. **Kill tmux sessions**: Run `tmux kill-session -t omd-team-{team}-{worker}` for each worker
4. **Clean up heartbeat files**: Remove all heartbeat files for the team
5. **Clean up shadow registry**: Remove `.omd/state/team-mcp-workers.json`

### Force Clear Addition

When `--force` is used, also clean up:
```bash
rm -rf .omd/state/team-bridge/       # Heartbeat files
rm -f .omd/state/team-mcp-workers.json  # Shadow registry
# Kill all omd-team-* tmux sessions
tmux list-sessions -F '#{session_name}' 2>/dev/null | grep '^omd-team-' | while read s; do tmux kill-session -t "$s" 2>/dev/null; done
```
