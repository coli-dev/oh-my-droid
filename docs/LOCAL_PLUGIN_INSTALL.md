# Local Plugin Installation

How to install oh-my-droid from a local development directory as a Droid plugin.

## Quick Install

```bash
# 1. Add local directory as a marketplace
droid plugin marketplace add /path/to/oh-my-droid

# 2. Install the plugin from the local marketplace
droid plugin install oh-my-droid@oh-my-droid

# 3. Restart Droid to pick up the plugin
```

## Commands Reference

```bash
# List configured marketplaces
droid plugin marketplace list

# Update marketplace (re-read from source)
droid plugin marketplace update oh-my-droid

# Update the installed plugin
droid plugin update oh-my-droid@oh-my-droid

# List installed plugins
droid plugin list

# Uninstall
droid plugin uninstall oh-my-droid@oh-my-droid

# Remove marketplace
droid plugin marketplace remove oh-my-droid
```

## Plugin Structure

The plugin requires a `plugin.json` manifest:

```json
{
  "name": "oh-my-droid",
  "version": "3.4.0",
  "description": "Multi-agent orchestration system for Droid",
  "hooks": {
    "PreToolUse": ["scripts/pre-tool-enforcer.mjs"],
    "PostToolUse": ["scripts/post-tool-verifier.mjs"],
    "SessionStart": ["scripts/session-start.mjs"]
  },
  "agents": ["agents/*.md"],
  "commands": ["commands/**/*.md"],
  "skills": ["skills/*.md"]
}
```

## Development Workflow

After making changes to the plugin:

```bash
# 1. Build (if TypeScript changes)
npm run build

# 2. Update the marketplace cache
droid plugin marketplace update oh-my-droid

# 3. Update the installed plugin
droid plugin update oh-my-droid@oh-my-droid

# 4. Restart Droid session
```

## Vs. npm Global Install

| Method | Command | Files Location |
|--------|---------|----------------|
| Plugin | `droid plugin install` | `~/.droid/plugins/cache/` |
| npm global | `npm install -g` | `~/.droid/agents/`, `~/.droid/commands/` |

**Plugin mode is preferred** - it keeps files isolated and uses the native Droid plugin system with `${DROID_PLUGIN_ROOT}` variable for path resolution.

## Troubleshooting

**Plugin not loading:**
- Restart Droid after installation
- Check `droid plugin list` shows status as "enabled"
- Verify plugin.json exists and is valid JSON

**Old version showing:**
- The cache directory name may show old version, but the actual code is from latest commit
- Run `droid plugin marketplace update` then `droid plugin update`
