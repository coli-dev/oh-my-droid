---
name: omd-setup
description: Setup and configure oh-my-droid (the ONLY command you need to learn)
---

# OMD Setup

This is the **only command you need to learn**. After running this, everything else is automatic.

## Pre-Setup Check: Already Configured?

**CRITICAL**: Before doing anything else, check if setup has already been completed. This prevents users from having to re-run the full setup wizard after every update.

```bash
# Check if setup was already completed
CONFIG_FILE="$HOME/.factory/.omd-config.json"

if [ -f "$CONFIG_FILE" ]; then
  SETUP_COMPLETED=$(jq -r '.setupCompleted // empty' "$CONFIG_FILE" 2>/dev/null)
  SETUP_VERSION=$(jq -r '.setupVersion // empty' "$CONFIG_FILE" 2>/dev/null)

  if [ -n "$SETUP_COMPLETED" ] && [ "$SETUP_COMPLETED" != "null" ]; then
    echo "OMD setup was already completed on: $SETUP_COMPLETED"
    [ -n "$SETUP_VERSION" ] && echo "Setup version: $SETUP_VERSION"
    ALREADY_CONFIGURED="true"
  fi
fi
```

### If Already Configured (and no --force flag)

If `ALREADY_CONFIGURED` is true AND the user did NOT pass `--force`, `--local`, or `--global` flags:

Use AskUser to prompt:

**Question:** "OMD is already configured. What would you like to do?"

**Options:**
1. **Update AGENTS.md only** - Download latest AGENTS.md without re-running full setup
2. **Run full setup again** - Go through the complete setup wizard
3. **Cancel** - Exit without changes

**If user chooses "Update AGENTS.md only":**
- Detect if local (.factory/AGENTS.md) or global (~/.factory/AGENTS.md) config exists
- If local exists, run the download/merge script from Step 2A
- If only global exists, run the download/merge script from Step 2B
- Skip all other steps
- Report success and exit

**If user chooses "Run full setup again":**
- Continue with Step 0 (Resume Detection) below

**If user chooses "Cancel":**
- Exit without any changes

### Force Flag Override

If user passes `--force` flag, skip this check and proceed directly to setup.

## Graceful Interrupt Handling

**IMPORTANT**: This setup process saves progress after each step. If interrupted (Ctrl+C or connection loss), the setup can resume from where it left off.

### State File Location
- `.omd/state/setup-state.json` - Tracks completed steps

### Resume Detection (Step 0)

Before starting any step, check for existing state:

```bash
# Check for existing setup state
STATE_FILE=".omd/state/setup-state.json"

# Cross-platform ISO date to epoch conversion
iso_to_epoch() {
  local iso_date="$1"
  local epoch=""
  # Try GNU date first (Linux)
  epoch=$(date -d "$iso_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  # Try BSD/macOS date
  local clean_date=$(echo "$iso_date" | sed 's/[+-][0-9][0-9]:[0-9][0-9]$//' | sed 's/Z$//' | sed 's/T/ /')
  epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "$clean_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  echo "0"
}

if [ -f "$STATE_FILE" ]; then
  # Check if state is stale (older than 24 hours)
  TIMESTAMP_RAW=$(jq -r '.timestamp // empty' "$STATE_FILE" 2>/dev/null)
  if [ -n "$TIMESTAMP_RAW" ]; then
    TIMESTAMP_EPOCH=$(iso_to_epoch "$TIMESTAMP_RAW")
    NOW_EPOCH=$(date +%s)
    STATE_AGE=$((NOW_EPOCH - TIMESTAMP_EPOCH))
  else
    STATE_AGE=999999  # Force fresh start if no timestamp
  fi
  if [ "$STATE_AGE" -gt 86400 ]; then
    echo "Previous setup state is more than 24 hours old. Starting fresh."
    rm -f "$STATE_FILE"
  else
    LAST_STEP=$(jq -r ".lastCompletedStep // 0" "$STATE_FILE" 2>/dev/null || echo "0")
    TIMESTAMP=$(jq -r .timestamp "$STATE_FILE" 2>/dev/null || echo "unknown")
    echo "Found previous setup session (Step $LAST_STEP completed at $TIMESTAMP)"
  fi
fi
```

If state exists, use AskUser to prompt:

**Question:** "Found a previous setup session. Would you like to resume or start fresh?"

**Options:**
1. **Resume from step $LAST_STEP** - Continue where you left off
2. **Start fresh** - Begin from the beginning (clears saved state)

If user chooses "Start fresh":
```bash
rm -f ".omd/state/setup-state.json"
echo "Previous state cleared. Starting fresh setup."
```

### Save Progress Helper

After completing each major step, save progress:

```bash
# Save setup progress (call after each step)
# Usage: save_setup_progress STEP_NUMBER
save_setup_progress() {
  mkdir -p .omd/state
  cat > ".omd/state/setup-state.json" << EOF
{
  "lastCompletedStep": $1,
  "timestamp": "$(date -Iseconds)",
  "configType": "${CONFIG_TYPE:-unknown}"
}
EOF
}
```

### Clear State on Completion

After successful setup completion (Step 7/8), remove the state file:

```bash
rm -f ".omd/state/setup-state.json"
echo "Setup completed successfully. State cleared."
```

## Usage Modes

This skill handles three scenarios:

1. **Initial Setup (no flags)**: First-time installation wizard
2. **Local Configuration (`--local`)**: Configure project-specific settings (.factory/AGENTS.md)
3. **Global Configuration (`--global`)**: Configure global settings (~/.factory/AGENTS.md)

## Mode Detection

Check for flags in the user's invocation:
- If `--local` flag present → Skip Pre-Setup Check, go to Local Configuration (Step 2A)
- If `--global` flag present → Skip Pre-Setup Check, go to Global Configuration (Step 2B)
- If `--force` flag present → Skip Pre-Setup Check, run Initial Setup wizard (Step 1)
- If no flags → Run Pre-Setup Check first, then Initial Setup wizard (Step 1) if needed

## Step 1: Initial Setup Wizard (Default Behavior)

**Note**: If resuming and lastCompletedStep >= 1, skip to the appropriate step based on configType.

Use the AskUser tool to prompt the user:

**Question:** "Where should I configure oh-my-droid?"

**Options:**
1. **Local (this project)** - Creates `.factory/AGENTS.md` in current project directory. Best for project-specific configurations.
2. **Global (all projects)** - Creates `~/.factory/AGENTS.md` for all Droid sessions. Best for consistent behavior everywhere.

## Step 2A: Local Configuration (--local flag or user chose LOCAL)

**CRITICAL**: This ALWAYS downloads fresh AGENTS.md from GitHub to the local project. DO NOT use the Write tool - use bash curl exclusively.

### Create Local .factory Directory

```bash
# Create .factory directory in current project
mkdir -p .factory && echo ".factory directory ready"
```

### Download Fresh AGENTS.md

```bash
# Define target path
TARGET_PATH=".factory/AGENTS.md"

# Extract old version before download
OLD_VERSION=$(grep -m1 "^# oh-my-droid" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# Backup existing
if [ -f "$TARGET_PATH" ]; then
  BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
  BACKUP_PATH="${TARGET_PATH}.backup.${BACKUP_DATE}"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing AGENTS.md to $BACKUP_PATH"
fi

# Download fresh OMD content to temp file
TEMP_OMD=$(mktemp /tmp/omd-droid-XXXXXX.md)
trap 'rm -f "$TEMP_OMD"' EXIT
curl -fsSL "https://raw.githubusercontent.com/coli-dev/oh-my-droid/main/docs/AGENTS.md" -o "$TEMP_OMD"

if [ ! -s "$TEMP_OMD" ]; then
  echo "ERROR: Failed to download AGENTS.md. Aborting."
  rm -f "$TEMP_OMD"
  return 1
fi

# Strip existing markers from downloaded content (idempotency)
if grep -q '<!-- OMD:START -->' "$TEMP_OMD"; then
  # Extract content between markers
  sed -n '/<!-- OMD:START -->/,/<!-- OMD:END -->/{//!p}' "$TEMP_OMD" > "${TEMP_OMD}.clean"
  mv "${TEMP_OMD}.clean" "$TEMP_OMD"
fi

if [ ! -f "$TARGET_PATH" ]; then
  # Fresh install: wrap in markers
  {
    echo '<!-- OMD:START -->'
    cat "$TEMP_OMD"
    echo '<!-- OMD:END -->'
  } > "$TARGET_PATH"
  rm -f "$TEMP_OMD"
  echo "Installed AGENTS.md (fresh)"
else
  # Merge: preserve user content outside OMD markers
  if grep -q '<!-- OMD:START -->' "$TARGET_PATH"; then
    # Has markers: replace OMD section, keep user content
    BEFORE_OMD=$(sed -n '1,/<!-- OMD:START -->/{ /<!-- OMD:START -->/!p }' "$TARGET_PATH")
    AFTER_OMD=$(sed -n '/<!-- OMD:END -->/,${  /<!-- OMD:END -->/!p }' "$TARGET_PATH")
    {
      [ -n "$BEFORE_OMD" ] && printf '%s\n' "$BEFORE_OMD"
      echo '<!-- OMD:START -->'
      cat "$TEMP_OMD"
      echo '<!-- OMD:END -->'
      [ -n "$AFTER_OMD" ] && printf '%s\n' "$AFTER_OMD"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Updated OMD section (user customizations preserved)"
  else
    # No markers: wrap new content in markers, append old content as user section
    OLD_CONTENT=$(cat "$TARGET_PATH")
    {
      echo '<!-- OMD:START -->'
      cat "$TEMP_OMD"
      echo '<!-- OMD:END -->'
      echo ""
      echo "<!-- User customizations (migrated from previous AGENTS.md) -->"
      printf '%s\n' "$OLD_CONTENT"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Migrated existing AGENTS.md (added OMD markers, preserved old content)"
  fi
  rm -f "$TEMP_OMD"
fi

# Extract new version and report
NEW_VERSION=$(grep -m1 "^# oh-my-droid" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed AGENTS.md: $NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "AGENTS.md unchanged: $NEW_VERSION"
else
  echo "Updated AGENTS.md: $OLD_VERSION -> $NEW_VERSION"
fi
```

**Note**: The downloaded AGENTS.md includes Context Persistence instructions with `<remember>` tags for surviving conversation compaction.

**Note**: If an existing AGENTS.md is found, it will be backed up to `.factory/AGENTS.md.backup.YYYY-MM-DD` before downloading the new version.

**MANDATORY**: Always run this command. Do NOT skip. Do NOT use Write tool.

**FALLBACK** if curl fails:
Tell user to manually download from:
https://raw.githubusercontent.com/coli-dev/oh-my-droid/main/docs/AGENTS.md

### Verify Plugin Installation

```bash
grep -q "oh-my-droid" ~/.factory/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: droid /install-plugin oh-my-droid"
```

### Confirm Local Configuration Success

After completing local configuration, save progress and report:

```bash
# Save progress - Step 2 complete (Local config)
mkdir -p .omd/state
cat > ".omd/state/setup-state.json" << EOF
{
  "lastCompletedStep": 2,
  "timestamp": "$(date -Iseconds)",
  "configType": "local"
}
EOF
```

**OMD Project Configuration Complete**
- AGENTS.md: Updated with latest configuration from GitHub at ./.factory/AGENTS.md
- Backup: Previous AGENTS.md backed up to `.factory/AGENTS.md.backup.YYYY-MM-DD` (if existed)
- Scope: **PROJECT** - applies only to this project
- Hooks: Provided by plugin (no manual installation needed)
- Droids: 28+ available (base + tiered variants)
- Model routing: Haiku/Sonnet/Opus based on task complexity

**Note**: This configuration is project-specific and won't affect other projects or global settings.

If `--local` flag was used, clear state and **STOP HERE**:
```bash
rm -f ".omd/state/setup-state.json"
```
Do not continue to HUD setup or other steps.

## Step 2B: Global Configuration (--global flag or user chose GLOBAL)

**CRITICAL**: This ALWAYS downloads fresh AGENTS.md from GitHub to global config. DO NOT use the Write tool - use bash curl exclusively.

### Download Fresh AGENTS.md

```bash
# Define target path
TARGET_PATH="$HOME/.factory/AGENTS.md"

# Extract old version before download
OLD_VERSION=$(grep -m1 "^# oh-my-droid" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# Backup existing
if [ -f "$TARGET_PATH" ]; then
  BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
  BACKUP_PATH="${TARGET_PATH}.backup.${BACKUP_DATE}"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing AGENTS.md to $BACKUP_PATH"
fi

# Download fresh OMD content to temp file
TEMP_OMD=$(mktemp /tmp/omd-droid-XXXXXX.md)
trap 'rm -f "$TEMP_OMD"' EXIT
curl -fsSL "https://raw.githubusercontent.com/coli-dev/oh-my-droid/main/docs/AGENTS.md" -o "$TEMP_OMD"

if [ ! -s "$TEMP_OMD" ]; then
  echo "ERROR: Failed to download AGENTS.md. Aborting."
  rm -f "$TEMP_OMD"
  return 1
fi

# Strip existing markers from downloaded content (idempotency)
if grep -q '<!-- OMD:START -->' "$TEMP_OMD"; then
  # Extract content between markers
  sed -n '/<!-- OMD:START -->/,/<!-- OMD:END -->/{//!p}' "$TEMP_OMD" > "${TEMP_OMD}.clean"
  mv "${TEMP_OMD}.clean" "$TEMP_OMD"
fi

if [ ! -f "$TARGET_PATH" ]; then
  # Fresh install: wrap in markers
  {
    echo '<!-- OMD:START -->'
    cat "$TEMP_OMD"
    echo '<!-- OMD:END -->'
  } > "$TARGET_PATH"
  rm -f "$TEMP_OMD"
  echo "Installed AGENTS.md (fresh)"
else
  # Merge: preserve user content outside OMD markers
  if grep -q '<!-- OMD:START -->' "$TARGET_PATH"; then
    # Has markers: replace OMD section, keep user content
    BEFORE_OMD=$(sed -n '1,/<!-- OMD:START -->/{ /<!-- OMD:START -->/!p }' "$TARGET_PATH")
    AFTER_OMD=$(sed -n '/<!-- OMD:END -->/,${  /<!-- OMD:END -->/!p }' "$TARGET_PATH")
    {
      [ -n "$BEFORE_OMD" ] && printf '%s\n' "$BEFORE_OMD"
      echo '<!-- OMD:START -->'
      cat "$TEMP_OMD"
      echo '<!-- OMD:END -->'
      [ -n "$AFTER_OMD" ] && printf '%s\n' "$AFTER_OMD"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Updated OMD section (user customizations preserved)"
  else
    # No markers: wrap new content in markers, append old content as user section
    OLD_CONTENT=$(cat "$TARGET_PATH")
    {
      echo '<!-- OMD:START -->'
      cat "$TEMP_OMD"
      echo '<!-- OMD:END -->'
      echo ""
      echo "<!-- User customizations (migrated from previous AGENTS.md) -->"
      printf '%s\n' "$OLD_CONTENT"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Migrated existing AGENTS.md (added OMD markers, preserved old content)"
  fi
  rm -f "$TEMP_OMD"
fi

# Extract new version and report
NEW_VERSION=$(grep -m1 "^# oh-my-droid" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed AGENTS.md: $NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "AGENTS.md unchanged: $NEW_VERSION"
else
  echo "Updated AGENTS.md: $OLD_VERSION -> $NEW_VERSION"
fi
```

**Note**: If an existing AGENTS.md is found, it will be backed up to `~/.factory/AGENTS.md.backup.YYYY-MM-DD` before downloading the new version.

### Clean Up Legacy Hooks (if present)

Check if old manual hooks exist and remove them to prevent duplicates:

```bash
# Remove legacy bash hook scripts (now handled by plugin system)
rm -f ~/.factory/hooks/keyword-detector.sh
rm -f ~/.factory/hooks/stop-continuation.sh
rm -f ~/.factory/hooks/persistent-mode.sh
rm -f ~/.factory/hooks/session-start.sh
echo "Legacy hooks cleaned"
```

Check `~/.factory/settings.json` for manual hook entries. If the "hooks" key exists with UserPromptSubmit, Stop, or SessionStart entries pointing to bash scripts, inform the user:

> **Note**: Found legacy hooks in settings.json. These should be removed since the plugin now provides hooks automatically. Remove the "hooks" section from ~/.factory/settings.json to prevent duplicate hook execution.

### Verify Plugin Installation

```bash
grep -q "oh-my-droid" ~/.factory/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: droid /install-plugin oh-my-droid"
```

### Confirm Global Configuration Success

After completing global configuration, save progress and report:

```bash
# Save progress - Step 2 complete (Global config)
mkdir -p .omd/state
cat > ".omd/state/setup-state.json" << EOF
{
  "lastCompletedStep": 2,
  "timestamp": "$(date -Iseconds)",
  "configType": "global"
}
EOF
```

**OMD Global Configuration Complete**
- AGENTS.md: Updated with latest configuration from GitHub at ~/.factory/AGENTS.md
- Backup: Previous AGENTS.md backed up to `~/.factory/AGENTS.md.backup.YYYY-MM-DD` (if existed)
- Scope: **GLOBAL** - applies to all Droid sessions
- Hooks: Provided by plugin (no manual installation needed)
- Droids: 28+ available (base + tiered variants)
- Model routing: Haiku/Sonnet/Opus based on task complexity

**Note**: Hooks are now managed by the plugin system automatically. No manual hook installation required.

If `--global` flag was used, clear state and **STOP HERE**:
```bash
rm -f ".omd/state/setup-state.json"
```
Do not continue to HUD setup or other steps.

## Step 3: Setup HUD Statusline

**Note**: If resuming and lastCompletedStep >= 3, skip to Step 3.5.

The HUD shows real-time status in Droid's status bar. **Invoke the hud skill** to set up and configure:

Use the Skill tool to invoke: `hud` with args: `setup`

This will:
1. Install the HUD wrapper script to `~/.factory/hud/omd-hud.mjs`
2. Configure `statusLine` in `~/.factory/settings.json`
3. Report status and prompt to restart if needed

After HUD setup completes, save progress:
```bash
# Save progress - Step 3 complete (HUD setup)
mkdir -p .omd/state
CONFIG_TYPE=$(cat ".omd/state/setup-state.json" 2>/dev/null | grep -oE '"configType":\s*"[^"]+"' | cut -d'"' -f4 || echo "unknown")
cat > ".omd/state/setup-state.json" << EOF
{
  "lastCompletedStep": 3,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 3.5: Clear Stale Plugin Cache

Clear old cached plugin versions to avoid conflicts:

```bash
# Clear stale plugin cache versions
CACHE_DIR="$HOME/.factory/plugins/cache/omd/oh-my-droid"
if [ -d "$CACHE_DIR" ]; then
  LATEST=$(ls -1 "$CACHE_DIR" | sort -V | tail -1)
  CLEARED=0
  for dir in "$CACHE_DIR"/*; do
    if [ "$(basename "$dir")" != "$LATEST" ]; then
      rm -rf "$dir"
      CLEARED=$((CLEARED + 1))
    fi
  done
  [ $CLEARED -gt 0 ] && echo "Cleared $CLEARED stale cache version(s)" || echo "Cache is clean"
else
  echo "No cache directory found (normal for new installs)"
fi
```

## Step 3.6: Check for Updates

Notify user if a newer version is available:

```bash
# Detect installed version
INSTALLED_VERSION=""

# Try cache directory first
if [ -d "$HOME/.factory/plugins/cache/omd/oh-my-droid" ]; then
  INSTALLED_VERSION=$(ls -1 "$HOME/.factory/plugins/cache/omd/oh-my-droid" | sort -V | tail -1)
fi

# Try .omd-version.json second
if [ -z "$INSTALLED_VERSION" ] && [ -f ".omd-version.json" ]; then
  INSTALLED_VERSION=$(grep -oE '"version":\s*"[^"]+' .omd-version.json | cut -d'"' -f4)
fi

# Try AGENTS.md header third (local first, then global)
if [ -z "$INSTALLED_VERSION" ]; then
  if [ -f ".factory/AGENTS.md" ]; then
    INSTALLED_VERSION=$(grep -m1 "^# oh-my-droid" .factory/AGENTS.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sed 's/^v//')
  elif [ -f "$HOME/.factory/AGENTS.md" ]; then
    INSTALLED_VERSION=$(grep -m1 "^# oh-my-droid" "$HOME/.factory/AGENTS.md" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sed 's/^v//')
  fi
fi

# Check npm for latest version
LATEST_VERSION=$(npm view oh-my-droid version 2>/dev/null)

if [ -n "$INSTALLED_VERSION" ] && [ -n "$LATEST_VERSION" ]; then
  # Simple version comparison (assumes semantic versioning)
  if [ "$INSTALLED_VERSION" != "$LATEST_VERSION" ]; then
    echo ""
    echo "UPDATE AVAILABLE:"
    echo "  Installed: v$INSTALLED_VERSION"
    echo "  Latest:    v$LATEST_VERSION"
    echo ""
    echo "To update, run: droid /install-plugin oh-my-droid"
  else
    echo "You're on the latest version: v$INSTALLED_VERSION"
  fi
elif [ -n "$LATEST_VERSION" ]; then
  echo "Latest version available: v$LATEST_VERSION"
fi
```

## Step 3.7: Set Default Execution Mode

Use the AskUser tool to prompt the user:

**Question:** "Which parallel execution mode should be your default when you say 'fast' or 'parallel'?"

**Options:**
1. **ultrawork (maximum capability)** - Uses all droid tiers including Opus for complex tasks. Best for challenging work where quality matters most. (Recommended)
2. **ecomode (token efficient)** - Prefers Haiku/Sonnet droids, avoids Opus. Best for pro-plan users who want cost efficiency.

Store the preference in `~/.factory/.omd-config.json`:

```bash
# Read existing config or create empty object
CONFIG_FILE="$HOME/.factory/.omd-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Set defaultExecutionMode (replace USER_CHOICE with "ultrawork" or "ecomode")
echo "$EXISTING" | jq --arg mode "USER_CHOICE" '. + {defaultExecutionMode: $mode, configuredAt: (now | todate)}' > "$CONFIG_FILE"
echo "Default execution mode set to: USER_CHOICE"
```

**Note**: This preference ONLY affects generic keywords ("fast", "parallel"). Explicit keywords ("ulw", "eco") always override this preference.

### Optional: Disable Ecomode Entirely

If the user wants to disable ecomode completely (so ecomode keywords are ignored), add to the config:

```bash
echo "$EXISTING" | jq '. + {ecomode: {enabled: false}}' > "$CONFIG_FILE"
echo "Ecomode disabled completely"
```

## Step 3.8: Install CLI Analytics Tools (Optional)

The OMD CLI provides standalone token analytics commands (`omd stats`, `omd droids`, `omd tui`).

Ask user: "Would you like to install the OMD CLI for standalone analytics? (Recommended for tracking token usage and costs)"

**Options:**
1. **Yes (Recommended)** - Install CLI tools globally for `omd stats`, `omd droids`, etc.
2. **No** - Skip CLI installation, use only plugin skills

### CLI Installation Note

The CLI (`omd` command) is **no longer supported** via npm/bun global install.

All functionality is available through the plugin system:
- Use `/oh-my-droid:help` for guidance
- Use `/oh-my-droid:doctor` for diagnostics

Skip this step - the plugin provides all features.

## Step 3.8.5: Select Task Management Tool

First, detect available task tools:

```bash
# Detect beads (bd)
BD_VERSION=""
if command -v bd &>/dev/null; then
  BD_VERSION=$(bd --version 2>/dev/null | head -1 || echo "installed")
fi

# Detect beads-rust (br)
BR_VERSION=""
if command -v br &>/dev/null; then
  BR_VERSION=$(br --version 2>/dev/null | head -1 || echo "installed")
fi

# Report findings
if [ -n "$BD_VERSION" ]; then
  echo "Found beads (bd): $BD_VERSION"
fi
if [ -n "$BR_VERSION" ]; then
  echo "Found beads-rust (br): $BR_VERSION"
fi
if [ -z "$BD_VERSION" ] && [ -z "$BR_VERSION" ]; then
  echo "No external task tools found. Using built-in Tasks."
fi
```

If **neither** beads nor beads-rust is detected, skip this step (default to built-in).

If beads or beads-rust is detected, use AskUser:

**Question:** "Which task management tool should I use for tracking work?"

**Options:**
1. **Built-in Tasks (default)** - Use Droid's native TaskCreate/TodoWrite. Tasks are session-only.
2. **Beads (bd)** - Git-backed persistent tasks. Survives across sessions. [Only if detected]
3. **Beads-Rust (br)** - Lightweight Rust port of beads. [Only if detected]

(Only show options 2/3 if the corresponding tool is detected)

Store the preference:

```bash
CONFIG_FILE="$HOME/.factory/.omd-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# USER_CHOICE is "builtin", "beads", or "beads-rust" based on user selection
echo "$EXISTING" | jq --arg tool "USER_CHOICE" '. + {taskTool: $tool, taskToolConfig: {injectInstructions: true, useMcp: false}}' > "$CONFIG_FILE"
echo "Task tool set to: USER_CHOICE"
```

**Note:** The beads context instructions will be injected automatically on the next session start. No restart is needed for config to take effect.

## Step 4: Verify Plugin Installation

```bash
grep -q "oh-my-droid" ~/.factory/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: droid /install-plugin oh-my-droid"
```

## Step 5: Offer MCP Server Configuration

MCP servers extend Droid with additional tools (web search, GitHub, etc.).

Ask user: "Would you like to configure MCP servers for enhanced capabilities? (Context7, Exa search, GitHub, etc.)"

If yes, invoke the mcp-setup skill:
```
/oh-my-droid:mcp-setup
```

If no, skip to next step.

## Step 5.5: Configure Droid Teams (Optional)

**Note**: If resuming and lastCompletedStep >= 5.5, skip to Step 6.

Droid teams are an experimental Droid feature that lets you spawn N coordinated droids working on a shared task list with inter-droid messaging. **Teams are disabled by default** and require enabling via `settings.json`.

Reference: https://code.factory.com/docs/en/droid-teams

Use the AskUser tool to prompt:

**Question:** "Would you like to enable droid teams? Teams let you spawn coordinated droids (e.g., `/team 3:executor 'fix all errors'`). This is an experimental Droid feature."

**Options:**
1. **Yes, enable teams (Recommended)** - Enable the experimental feature and configure defaults
2. **No, skip** - Leave teams disabled (can enable later)

### If User Chooses YES:

#### Step 5.5.1: Enable Droid Teams in settings.json

**CRITICAL**: Droid teams require `DROID_CODE_EXPERIMENTAL_AGENT_TEAMS` to be set in `~/.factory/settings.json`. This must be done carefully to preserve existing user settings.

First, read the current settings.json:

```bash
SETTINGS_FILE="$HOME/.factory/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  echo "Current settings.json found"
  cat "$SETTINGS_FILE"
else
  echo "No settings.json found - will create one"
fi
```

Then use the Read tool to read `~/.factory/settings.json` (if it exists). Use the Edit tool to merge the teams configuration while preserving ALL existing settings.

**If settings.json exists and has an `env` key**, merge the new env var into it:

```json
{
  "env": {
    "DROID_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Use jq to safely merge without overwriting existing settings:

```bash
SETTINGS_FILE="$HOME/.factory/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  # Merge env var into existing settings, preserving everything else
  TEMP_FILE=$(mktemp)
  jq '.env = (.env // {} | . + {"DROID_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"})' "$SETTINGS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$SETTINGS_FILE"
  echo "Added DROID_CODE_EXPERIMENTAL_AGENT_TEAMS to existing settings.json"
else
  # Create new settings.json with just the teams env var
  mkdir -p "$(dirname "$SETTINGS_FILE")"
  cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": {
    "DROID_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
SETTINGS_EOF
  echo "Created settings.json with teams enabled"
fi
```

**IMPORTANT**: The Edit tool is preferred for modifying settings.json when possible, since it preserves formatting and comments. The jq approach above is the fallback for when the file needs structural merging.

#### Step 5.5.2: Configure Teammate Display Mode

Use the AskUser tool:

**Question:** "How should teammates be displayed?"

**Options:**
1. **Auto (Recommended)** - Uses split panes if in tmux, otherwise in-process. Best for most users.
2. **In-process** - All teammates in your main terminal. Use Shift+Up/Down to select. Works everywhere.
3. **Split panes (tmux)** - Each teammate in its own pane. Requires tmux or iTerm2.

If user chooses anything other than "Auto", add `teammateMode` to settings.json:

```bash
SETTINGS_FILE="$HOME/.factory/settings.json"

# TEAMMATE_MODE is "in-process" or "tmux" based on user choice
# Skip this if user chose "Auto" (that's the default)
jq --arg mode "TEAMMATE_MODE" '. + {teammateMode: $mode}' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
echo "Teammate display mode set to: TEAMMATE_MODE"
```

#### Step 5.5.3: Configure Team Defaults in omd-config

Use the AskUser tool with multiple questions:

**Question 1:** "How many droids should teams spawn by default?"

**Options:**
1. **3 droids (Recommended)** - Good balance of speed and resource usage
2. **5 droids (maximum)** - Maximum parallelism for large tasks
3. **2 droids** - Conservative, for smaller projects

**Question 2:** "Which droid type should teammates use by default?"

**Options:**
1. **executor (Recommended)** - General-purpose code implementation droid
2. **build-fixer** - Specialized for build/type error fixing
3. **designer** - Specialized for UI/frontend work

**Question 3:** "Which model should teammates use by default?"

**Options:**
1. **sonnet (Recommended)** - Fast, capable, cost-effective for most tasks
2. **opus** - Maximum capability for complex tasks (higher cost)
3. **haiku** - Fastest and cheapest, good for simple/repetitive tasks

Store the team configuration in `~/.factory/.omd-config.json`:

```bash
CONFIG_FILE="$HOME/.factory/.omd-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Replace MAX_AGENTS, AGENT_TYPE, MODEL with user choices
echo "$EXISTING" | jq \
  --argjson maxAgents MAX_AGENTS \
  --arg agentType "AGENT_TYPE" \
  --arg model "MODEL" \
  '. + {team: {maxAgents: $maxAgents, defaultAgentType: $agentType, defaultModel: $model, monitorIntervalMs: 30000, shutdownTimeoutMs: 15000}}' > "$CONFIG_FILE"

echo "Team configuration saved:"
echo "  Max droids: MAX_AGENTS"
echo "  Default droid: AGENT_TYPE"
echo "  Default model: MODEL"
```

#### Verify settings.json Integrity

After all modifications, verify settings.json is valid JSON and contains the expected keys:

```bash
SETTINGS_FILE="$HOME/.factory/settings.json"

# Verify JSON is valid
if jq empty "$SETTINGS_FILE" 2>/dev/null; then
  echo "settings.json: valid JSON"
else
  echo "ERROR: settings.json is invalid JSON! Restoring from backup..."
  # The backup from Step 2 should still exist
  exit 1
fi

# Verify teams env var is present
if jq -e '.env.factory_CODE_EXPERIMENTAL_AGENT_TEAMS' "$SETTINGS_FILE" > /dev/null 2>&1; then
  echo "Droid teams: ENABLED"
else
  echo "WARNING: Droid teams env var not found in settings.json"
fi

# Show final settings.json for user review
echo ""
echo "Final settings.json:"
jq '.' "$SETTINGS_FILE"
```

### If User Chooses NO:

Skip this step. Droid teams will remain disabled. User can enable later by adding to `~/.factory/settings.json`:
```json
{
  "env": {
    "DROID_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or by running `/oh-my-droid:omd-setup --force` and choosing to enable teams.

### Save Progress

```bash
# Save progress - Step 5.5 complete (Teams configured)
mkdir -p .omd/state
CONFIG_TYPE=$(cat ".omd/state/setup-state.json" 2>/dev/null | grep -oE '"configType":\s*"[^"]+"' | cut -d'"' -f4 || echo "unknown")
cat > ".omd/state/setup-state.json" << EOF
{
  "lastCompletedStep": 5.5,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## Step 6: Detect Upgrade from 2.x

Check if user has existing configuration:
```bash
# Check for existing 2.x artifacts
ls ~/.factory/commands/ralph-loop.md 2>/dev/null || ls ~/.factory/commands/ultrawork.md 2>/dev/null
```

If found, this is an upgrade from 2.x.

## Step 7: Show Welcome Message

### For New Users:

```
OMD Setup Complete!

You don't need to learn any commands. I now have intelligent behaviors that activate automatically.

WHAT HAPPENS AUTOMATICALLY:
- Complex tasks -> I parallelize and delegate to specialists
- "plan this" -> I start a planning interview
- "don't stop until done" -> I persist until verified complete
- "stop" or "cancel" -> I intelligently stop current operation

MAGIC KEYWORDS (optional power-user shortcuts):
Just include these words naturally in your request:

| Keyword | Effect | Example |
|---------|--------|---------|
| ralph | Persistence mode | "ralph: fix the auth bug" |
| ralplan | Iterative planning | "ralplan this feature" |
| ulw | Max parallelism | "ulw refactor the API" |
| eco | Token-efficient mode | "eco refactor the API" |
| plan | Planning interview | "plan the new endpoints" |
| team | Coordinated droids | "/team 3:executor fix errors" |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

TEAMS:
Spawn coordinated droids with shared task lists and real-time messaging:
- /oh-my-droid:team 3:executor "fix all TypeScript errors"
- /oh-my-droid:team 5:build-fixer "fix build errors in src/"
Teams use Droid native tools (TeamCreate/SendMessage/TaskCreate).

MCP SERVERS:
Run /oh-my-droid:mcp-setup to add tools like web search, GitHub, etc.

HUD STATUSLINE:
The status bar now shows OMD state. Restart Droid to see it.

CLI ANALYTICS (if installed):
- omd           - Full dashboard (stats + droids + cost)
- omd stats     - View token usage and costs
- omd droids    - See droid breakdown by cost
- omd tui       - Launch interactive TUI dashboard

That's it! Just use Droid normally.
```

### For Users Upgrading from 2.x:

```
OMD Setup Complete! (Upgraded from 2.x)

GOOD NEWS: Your existing commands still work!
- /ralph, /ultrawork, /plan, etc. all still function

WHAT'S NEW in 3.0:
You no longer NEED those commands. Everything is automatic now:
- Just say "don't stop until done" instead of /ralph
- Just say "fast" or "parallel" instead of /ultrawork
- Just say "plan this" instead of /plan
- Just say "stop" instead of /cancel

MAGIC KEYWORDS (power-user shortcuts):
| Keyword | Same as old... | Example |
|---------|----------------|---------|
| ralph | /ralph | "ralph: fix the bug" |
| ralplan | /ralplan | "ralplan this feature" |
| ulw | /ultrawork | "ulw refactor API" |
| eco | (new!) | "eco fix all errors" |
| plan | /plan | "plan the endpoints" |
| team | (new!) | "/team 3:executor fix errors" |

TEAMS (NEW!):
Spawn coordinated droids with shared task lists and real-time messaging:
- /oh-my-droid:team 3:executor "fix all TypeScript errors"
- Uses Droid native tools (TeamCreate/SendMessage/TaskCreate)

HUD STATUSLINE:
The status bar now shows OMD state. Restart Droid to see it.

CLI ANALYTICS (if installed):
- omd           - Full dashboard (stats + droids + cost)
- omd stats     - View token usage and costs
- omd droids    - See droid breakdown by cost
- omd tui       - Launch interactive TUI dashboard

Your workflow won't break - it just got easier!
```

## Step 8: Ask About Starring Repository

First, check if `gh` CLI is available and authenticated:

```bash
gh auth status &>/dev/null
```

### If gh is available and authenticated:

Use the AskUser tool to prompt the user:

**Question:** "If you're enjoying oh-my-droid, would you like to support the project by starring it on GitHub?"

**Options:**
1. **Yes, star it!** - Star the repository
2. **No thanks** - Skip without further prompts
3. **Maybe later** - Skip without further prompts

If user chooses "Yes, star it!":

```bash
gh api -X PUT /user/starred/coli-dev/oh-my-droid 2>/dev/null && echo "Thanks for starring! ⭐" || true
```

**Note:** Fail silently if the API call doesn't work - never block setup completion.

### If gh is NOT available or not authenticated:

```bash
echo ""
echo "If you enjoy oh-my-droid, consider starring the repo:"
echo "  https://github.com/coli-dev/oh-my-droid"
echo ""
```

### Clear Setup State and Mark Completion

After Step 8 completes (regardless of star choice), clear the temporary state and mark setup as completed:

```bash
# Setup complete - clear temporary state file
rm -f ".omd/state/setup-state.json"

# Mark setup as completed in persistent config (prevents re-running full setup on updates)
CONFIG_FILE="$HOME/.factory/.omd-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

# Get current OMD version from AGENTS.md
OMD_VERSION=""
if [ -f ".factory/AGENTS.md" ]; then
  OMD_VERSION=$(grep -m1 "^# oh-my-droid" .factory/AGENTS.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
elif [ -f "$HOME/.factory/AGENTS.md" ]; then
  OMD_VERSION=$(grep -m1 "^# oh-my-droid" "$HOME/.factory/AGENTS.md" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
fi

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Add setupCompleted timestamp and version
echo "$EXISTING" | jq --arg ts "$(date -Iseconds)" --arg ver "$OMD_VERSION" \
  '. + {setupCompleted: $ts, setupVersion: $ver}' > "$CONFIG_FILE"

echo "Setup completed successfully!"
echo "Note: Future updates will only refresh AGENTS.md, not the full setup wizard."
```

## Keeping Up to Date

After installing oh-my-droid updates (via npm or plugin update):

**Automatic**: Just run `/oh-my-droid:omd-setup` - it will detect you've already configured and offer a quick "Update AGENTS.md only" option that skips the full wizard.

**Manual options**:
- `/oh-my-droid:omd-setup --local` to update project config only
- `/oh-my-droid:omd-setup --global` to update global config only
- `/oh-my-droid:omd-setup --force` to re-run the full wizard (reconfigure preferences)

This ensures you have the newest features and droid configurations without the token cost of repeating the full setup.

## Help Text

When user runs `/oh-my-droid:omd-setup --help` or just `--help`, display:

```
OMD Setup - Configure oh-my-droid

USAGE:
  /oh-my-droid:omd-setup           Run initial setup wizard (or update if already configured)
  /oh-my-droid:omd-setup --local   Configure local project (.factory/AGENTS.md)
  /oh-my-droid:omd-setup --global  Configure global settings (~/.factory/AGENTS.md)
  /oh-my-droid:omd-setup --force   Force full setup wizard even if already configured
  /oh-my-droid:omd-setup --help    Show this help

MODES:
  Initial Setup (no flags)
    - Interactive wizard for first-time setup
    - Configures AGENTS.md (local or global)
    - Sets up HUD statusline
    - Checks for updates
    - Offers MCP server configuration
    - Configures team mode defaults (droid count, type, model)
    - If already configured, offers quick update option

  Local Configuration (--local)
    - Downloads fresh AGENTS.md to ./.factory/
    - Backs up existing AGENTS.md to .factory/AGENTS.md.backup.YYYY-MM-DD
    - Project-specific settings
    - Use this to update project config after OMD upgrades

  Global Configuration (--global)
    - Downloads fresh AGENTS.md to ~/.factory/
    - Backs up existing AGENTS.md to ~/.factory/AGENTS.md.backup.YYYY-MM-DD
    - Applies to all Droid sessions
    - Cleans up legacy hooks
    - Use this to update global config after OMD upgrades

  Force Full Setup (--force)
    - Bypasses the "already configured" check
    - Runs the complete setup wizard from scratch
    - Use when you want to reconfigure preferences

EXAMPLES:
  /oh-my-droid:omd-setup           # First time setup (or update AGENTS.md if configured)
  /oh-my-droid:omd-setup --local   # Update this project
  /oh-my-droid:omd-setup --global  # Update all projects
  /oh-my-droid:omd-setup --force   # Re-run full setup wizard

For more info: https://github.com/coli-dev/oh-my-droid
```
