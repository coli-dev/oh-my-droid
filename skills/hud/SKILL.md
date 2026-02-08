---
name: hud
description: Configure HUD display options (layout, presets, display elements)
role: config-writer  # DOCUMENTATION ONLY - This skill writes to ~/.factory/ paths
scope: ~/.factory/**  # DOCUMENTATION ONLY - Allowed write scope
---

# HUD Skill

Configure the OMD HUD (Heads-Up Display) for the statusline.

## Quick Commands

| Command | Description |
|---------|-------------|
| `/oh-my-droid:hud` | Show current HUD status (auto-setup if needed) |
| `/oh-my-droid:hud setup` | Install/repair HUD statusline |
| `/oh-my-droid:hud minimal` | Switch to minimal display |
| `/oh-my-droid:hud focused` | Switch to focused display (default) |
| `/oh-my-droid:hud full` | Switch to full display |
| `/oh-my-droid:hud status` | Show detailed HUD status |

## Auto-Setup

When you run `/oh-my-droid:hud` or `/oh-my-droid:hud setup`, the system will automatically:
1. Check if `~/.factory/hud/omd-hud.mjs` exists
2. Check if `statusLine` is configured in `~/.factory/settings.json`
3. If missing, create the HUD wrapper script and configure settings
4. Report status and prompt to restart Droid if changes were made

**IMPORTANT**: If the argument is `setup` OR if the HUD script doesn't exist at `~/.factory/hud/omd-hud.mjs`, you MUST create the HUD files directly using the instructions below.

### Setup Instructions (Run These Commands)

**Step 1:** Check if setup is needed:
```bash
ls ~/.factory/hud/omd-hud.mjs 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**Step 2:** Verify the plugin is installed:
```bash
PLUGIN_VERSION=$(ls ~/.factory/plugins/cache/omd/oh-my-droid/ 2>/dev/null | sort -V | tail -1)
if [ -n "$PLUGIN_VERSION" ]; then
  ls ~/.factory/plugins/cache/omd/oh-my-droid/$PLUGIN_VERSION/dist/hud/index.js 2>/dev/null && echo "READY" || echo "NOT_FOUND - try reinstalling: /plugin install oh-my-droid"
else
  echo "Plugin not installed - run: /plugin install oh-my-droid"
fi
```

**Step 3:** If omd-hud.mjs is MISSING or argument is `setup`, create the HUD directory and script:

First, create the directory:
```bash
mkdir -p ~/.factory/hud
```

Then, use the Write tool to create `~/.factory/hud/omd-hud.mjs` with this exact content:

```javascript
#!/usr/bin/env node
/**
 * OMD HUD - Statusline Script
 * Wrapper that imports from plugin cache or development paths
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Semantic version comparison: returns negative if a < b, positive if a > b, 0 if equal
function semverCompare(a, b) {
  // Use parseInt to handle pre-release suffixes (e.g. "0-beta" -> 0)
  const pa = a.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  // If numeric parts equal, non-pre-release > pre-release
  const aHasPre = /-/.test(a);
  const bHasPre = /-/.test(b);
  if (aHasPre && !bHasPre) return -1;
  if (!aHasPre && bHasPre) return 1;
  return 0;
}

async function main() {
  const home = homedir();
  let pluginCacheDir = null;

  // 1. Try plugin cache first (marketplace: omd, plugin: oh-my-droid)
  const pluginCacheBase = join(home, ".factory/plugins/cache/omd/oh-my-droid");
  if (existsSync(pluginCacheBase)) {
    try {
      const versions = readdirSync(pluginCacheBase);
      if (versions.length > 0) {
        const latestVersion = versions.sort(semverCompare).reverse()[0];
        pluginCacheDir = join(pluginCacheBase, latestVersion);
        const pluginPath = join(pluginCacheDir, "dist/hud/index.js");
        if (existsSync(pluginPath)) {
          await import(pathToFileURL(pluginPath).href);
          return;
        }
      }
    } catch { /* continue */ }
  }

  // 2. Development paths
  const devPaths = [
    join(home, "Workspace/oh-my-droid/dist/hud/index.js"),
    join(home, "workspace/oh-my-droid/dist/hud/index.js"),
    join(home, "Workspace/oh-my-droid/dist/hud/index.js"),
    join(home, "workspace/oh-my-droid/dist/hud/index.js"),
  ];

  for (const devPath of devPaths) {
    if (existsSync(devPath)) {
      try {
        await import(pathToFileURL(devPath).href);
        return;
      } catch { /* continue */ }
    }
  }

  // 3. Fallback - HUD not found (provide actionable error message)
  if (pluginCacheDir) {
    console.log(`[OMD] HUD not built. Run: cd "${pluginCacheDir}" && npm install`);
  } else {
    console.log("[OMD] Plugin not found. Run: /oh-my-droid:omd-setup");
  }
}

main();
```

**Step 3:** Make it executable:
```bash
chmod +x ~/.factory/hud/omd-hud.mjs
```

**Step 4:** Update settings.json to use the HUD:

Read `~/.factory/settings.json`, then update/add the `statusLine` field.

**IMPORTANT:** The command must use an absolute path, not `~`, because Windows does not expand `~` in shell commands.

First, determine the correct path:
```bash
node -e "const p=require('path').join(require('os').homedir(),'.factory','hud','omd-hud.mjs');console.log(JSON.stringify(p))"
```

Then set the `statusLine` field using the resolved path. On Unix it will look like:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node /home/username/.factory/hud/omd-hud.mjs"
  }
}
```

On Windows it will look like:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:\\Users\\username\\.factory\\hud\\omd-hud.mjs"
  }
}
```

Use the Edit tool to add/update this field while preserving other settings.

**Step 5:** Clean up old HUD scripts (if any):
```bash
rm -f ~/.factory/hud/sisyphus-hud.mjs 2>/dev/null
```

**Step 6:** Tell the user to restart Droid for changes to take effect.

## Display Presets

### Minimal
Shows only the essentials:
```
[OMD] ralph | ultrawork | todos:2/5
```

### Focused (Default)
Shows all relevant elements:
```
[OMD] ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | droids:2 | bg:3/5 | todos:2/5
```

### Full
Shows everything including multi-line agent details:
```
[OMD] ralph:3/10 | US-002 (2/5) | ultrawork | ctx:[████░░]67% | droids:3 | bg:3/5 | todos:2/5
├─ O architect    2m   analyzing architecture patterns...
├─ e explore     45s   searching for test files
└─ s executor     1m   implementing validation logic
```

## Multi-Line Agent Display

When droids are running, the HUD shows detailed information on separate lines:
- **Tree characters** (`├─`, `└─`) show visual hierarchy
- **Agent code** (O, e, s) indicates agent type with model tier color
- **Duration** shows how long each agent has been running
- **Description** shows what each agent is doing (up to 45 chars)

## Display Elements

| Element | Description |
|---------|-------------|
| `[OMD]` | Mode identifier |
| `ralph:3/10` | Ralph loop iteration/max |
| `US-002` | Current PRD story ID |
| `ultrawork` | Active mode badge |
| `skill:name` | Last activated skill (cyan) |
| `ctx:67%` | Context window usage |
| `droids:2` | Running subagent count |
| `bg:3/5` | Background task slots |
| `todos:2/5` | Todo completion |

## Color Coding

- **Green**: Normal/healthy
- **Yellow**: Warning (context >70%, ralph >7)
- **Red**: Critical (context >85%, ralph at max)

## Configuration Location

HUD config is stored at: `~/.factory/.omd/hud-config.json`

## Manual Configuration

You can manually edit the config file. Each option can be set individually - any unset values will use defaults.

```json
{
  "preset": "focused",
  "elements": {
    "omdLabel": true,
    "ralph": true,
    "prdStory": true,
    "activeSkills": true,
    "lastSkill": true,
    "contextBar": true,
    "droids": true,
    "backgroundTasks": true,
    "todos": true,
    "showCache": true,
    "showCost": true,
    "maxOutputLines": 4
  },
  "thresholds": {
    "contextWarning": 70,
    "contextCritical": 85,
    "ralphWarning": 7
  }
}
```

## Troubleshooting

If the HUD is not showing:
1. Run `/oh-my-droid:hud setup` to auto-install and configure
2. Restart Droid after setup completes
3. If still not working, run `/oh-my-droid:doctor` for full diagnostics

Manual verification:
- HUD script: `~/.factory/hud/omd-hud.mjs`
- Settings: `~/.factory/settings.json` should have `statusLine` configured

---

*The HUD updates automatically every ~300ms during active sessions.*
