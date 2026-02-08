# oh-my-droid

[![npm version](https://img.shields.io/npm/v/oh-my-droid?color=cb3837)](https://www.npmjs.com/package/oh-my-droid)
[![npm downloads](https://img.shields.io/npm/dm/oh-my-droid?color=blue)](https://www.npmjs.com/package/oh-my-droid)
[![GitHub stars](https://img.shields.io/github/stars/coli-dev/oh-my-droid?style=flat&color=yellow)](https://github.com/coli-dev/oh-my-droid/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-red?style=flat&logo=github)](https://github.com/sponsors/coli-dev)

**Multi-agent orchestration for Droid. Zero learning curve.**

*Don't learn Droid. Just use OMD.*

[Get Started](#quick-start) • [Documentation](https://yeachan-heo.github.io/oh-my-droid-website) • [Migration Guide](docs/MIGRATION.md)

---

## Quick Start

**Step 1: Install**
```bash
/plugin marketplace add https://github.com/coli-dev/oh-my-droid
/plugin install oh-my-droid
```

**Step 2: Setup**
```bash
/oh-my-droid:omd-setup
```

**Step 3: Build something**
```
autopilot: build a REST API for managing tasks
```

That's it. Everything else is automatic.

### Updating

```bash
# 1. Update the plugin
/plugin install oh-my-droid

# 2. Re-run setup to refresh configuration
/oh-my-droid:omd-setup
```

If you experience issues after updating, clear the old plugin cache:

```bash
/oh-my-droid:doctor
```

<h1 align="center">Your Droid Just Have been Steroided.</h1>

<p align="center">
  <img src="assets/omd-character.jpg" alt="oh-my-droid" width="400" />
</p>

---

## Why oh-my-droid?

- **Zero configuration required** - Works out of the box with intelligent defaults
- **Natural language interface** - No commands to memorize, just describe what you want
- **Automatic parallelization** - Complex tasks distributed across specialized agents
- **Persistent execution** - Won't give up until the job is verified complete
- **Cost optimization** - Smart model routing saves 30-50% on tokens
- **Learn from experience** - Automatically extracts and reuses problem-solving patterns
- **Real-time visibility** - HUD statusline shows what's happening under the hood

---

## Features

### Execution Modes
Multiple strategies for different use cases - from fully autonomous builds to token-efficient refactoring. [Learn more →](https://yeachan-heo.github.io/oh-my-droid-website/docs.html#execution-modes)

| Mode | Speed | Use For |
|------|-------|---------|
| **Autopilot** | Fast | Full autonomous workflows |
| **Ultrawork** | Parallel | Maximum parallelism for any task |
| **Ralph** | Persistent | Tasks that must complete fully |
| **Ultrapilot** | 3-5x faster | Multi-component systems |
| **Ecomode** | Fast + 30-50% cheaper | Budget-conscious projects |
| **Swarm** | Coordinated | Parallel independent tasks |
| **Pipeline** | Sequential | Multi-stage processing |

### Intelligent Orchestration

- **32 specialized agents** for architecture, research, design, testing, data science
- **Smart model routing** - Haiku for simple tasks, Opus for complex reasoning
- **Automatic delegation** - Right agent for the job, every time

### Developer Experience

- **Magic keywords** - `ralph`, `ulw`, `eco`, `plan` for explicit control
- **HUD statusline** - Real-time orchestration metrics in your status bar
- **Skill learning** - Extract reusable patterns from your sessions
- **Analytics & cost tracking** - Understand token usage across all sessions

[Full feature list →](docs/REFERENCE.md)

---

## Magic Keywords

Optional shortcuts for power users. Natural language works fine without them.

| Keyword | Effect | Example |
|---------|--------|---------|
| `autopilot` | Full autonomous execution | `autopilot: build a todo app` |
| `ralph` | Persistence mode | `ralph: refactor auth` |
| `ulw` | Maximum parallelism | `ulw fix all errors` |
| `eco` | Token-efficient execution | `eco: migrate database` |
| `plan` | Planning interview | `plan the API` |
| `ralplan` | Iterative planning consensus | `ralplan this feature` |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

---

## Utilities

### Rate Limit Wait

Auto-resume Droid sessions when rate limits reset.

```bash
omd wait          # Check status, get guidance
omd wait --start  # Enable auto-resume daemon
omd wait --stop   # Disable daemon
```

**Requires:** tmux (for session detection)

---

## Documentation

- **[Full Reference](docs/REFERENCE.md)** - Complete feature documentation
- **[Performance Monitoring](docs/PERFORMANCE-MONITORING.md)** - Agent tracking, debugging, and optimization
- **[Website](https://yeachan-heo.github.io/oh-my-droid-website)** - Interactive guides and examples
- **[Migration Guide](docs/MIGRATION.md)** - Upgrade from v2.x
- **[Architecture](docs/ARCHITECTURE.md)** - How it works under the hood

---

## Requirements

- [Droid](https://docs.anthropic.com/droid-code) CLI
- Droid Max/Pro subscription OR Anthropic API key

### Optional: Multi-AI Orchestration

OMD can optionally orchestrate external AI providers for cross-validation and design consistency. These are **not required** — OMD works fully without them.

| Provider | Install | What it enables |
|----------|---------|-----------------|
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `npm install -g @google/gemini-cli` | Design review, UI consistency (1M token context) |
| [Codex CLI](https://github.com/openai/codex) | `npm install -g @openai/codex` | Architecture validation, code review cross-check |

**Cost:** 3 Pro plans (Droid + Gemini + ChatGPT) cover everything for ~$60/month.

---

## License

MIT

---

<div align="center">

**Inspired by:** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) • [droid-hud](https://github.com/ryanjoachim/droid-hud) • [Superpowers](https://github.com/NexTechFusion/Superpowers) • [everything-droid-code](https://github.com/affaan-m/everything-droid-code)

**Zero learning curve. Maximum power.**

</div>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=coli-dev/oh-my-droid&type=date&legend=top-left)](https://www.star-history.com/#coli-dev/oh-my-droid&type=date&legend=top-left)

## 💖 Support This Project

If Oh-My-DroidCode helps your workflow, consider sponsoring:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-❤️-red?style=for-the-badge&logo=github)](https://github.com/sponsors/coli-dev)

### Why sponsor?

- Keep development active
- Priority support for sponsors
- Influence roadmap & features
- Help maintain free & open source

### Other ways to help

- ⭐ Star the repo
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Contribute code
