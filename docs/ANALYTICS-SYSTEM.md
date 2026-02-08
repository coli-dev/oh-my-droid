# OMD Analytics System

## Overview

Automatic token tracking and cost estimation for Droid API usage in oh-my-droid.

## Features

- **Automatic Token Tracking**: Zero manual recording - tracks every HUD render
- **Cost Estimation**: Model-specific pricing with cache economics
- **Session Management**: Track costs across multiple sessions
- **Beautiful CLI**: Enhanced analytics visualization
- **HUD Integration**: Real-time cost display in statusline

## Architecture

```
StatuslineStdin → TokenExtractor → TokenTracker → Analytics Summary
                                         ↓
                                    HUD Display
                                         ↓
                                    CLI Reports
```

## Auto-Tracking

Token usage is automatically captured on every HUD render:

1. **TokenExtractor** parses StatuslineStdin for token data
2. **Delta Calculation** computes change from previous render
3. **Agent Correlation** associates tokens with running agents
4. **TokenTracker** records usage to JSONL log
5. **Summary Files** provide fast <10ms session loading

## Output Token Estimation

Since StatuslineStdin only provides input tokens, output tokens are estimated:

- **Haiku**: 30% of input tokens
- **Sonnet**: 40% of input tokens
- **Opus**: 50% of input tokens

All costs displayed with "~" prefix to indicate estimation.

## HUD Integration

Real-time analytics in statusline:

- Session cost and tokens
- Cost per hour
- Cache efficiency
- Budget warnings (>$2 warning, >$5 critical)

Use `analytics` preset for detailed display.

## CLI Usage

```bash
# View everything (default dashboard)
omd

# View current session stats
omd stats

# Cost reports
omd cost daily
omd cost weekly
omd cost monthly

# Session history
omd sessions

# Agent breakdown
omd agents

# Export data
omd export cost csv ./costs.csv
```

## Performance

- **HUD Render**: <100ms total (including analytics)
- **Token Extraction**: <5ms per render
- **Summary Loading**: <10ms (mtime-cached)
- **CLI Startup**: <500ms

## Files

- `src/analytics/token-extractor.ts` - Token extraction
- `src/analytics/output-estimator.ts` - Output estimation & session ID
- `src/analytics/analytics-summary.ts` - Fast summary loading
- `src/hud/index.ts` - Auto-recording integration
- `.omd/state/token-tracking.jsonl` - Append-only token log
- `.omd/state/analytics-summary-{sessionId}.json` - Cached summaries

## Offline Transcript Analysis

### Overview

The analytics system can analyze historical Droid session transcripts from `~/.droid/projects/` to backfill token usage data.

### The `omd backfill` Command

Extracts actual token usage from Droid transcripts and adds them to the analytics database.

```bash
omd backfill [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--project <glob>` | Filter to specific project paths |
| `--from <date>` | Only process transcripts modified after date (ISO format) |
| `--to <date>` | Only process transcripts modified before date |
| `--dry-run` | Preview without writing to database |
| `--reset` | Clear deduplication index and re-process all |
| `--verbose` | Show detailed per-file progress |
| `--json` | Output as JSON |

#### Examples

```bash
# Preview all available transcripts
omd backfill --dry-run

# Backfill specific project
omd backfill --project "*VibeQuant*"

# Backfill recent transcripts only
omd backfill --from "2026-01-01"

# Re-process everything
omd backfill --reset
```

### Auto-Backfill

The `omd` CLI automatically runs a silent backfill on startup if more than 24 hours have passed since the last backfill. This ensures your analytics stay up-to-date without manual intervention.

### Data Sources

- **Transcript Location**: `~/.droid/projects/<encoded-path>/<uuid>.jsonl`
- **Token Data**: Actual `output_tokens` from API responses (not estimates)
- **Agent Detection**: Extracted from `tool_use` blocks with Task tool

### Deduplication

Entries are deduplicated using a hash of `sessionId + timestamp + model`. Safe to run multiple times.
