# Performance Monitoring Guide

Comprehensive guide to monitoring, debugging, and optimizing Droid and oh-my-droid performance.

---

## Table of Contents

- [Overview](#overview)
- [Built-in Monitoring](#built-in-monitoring)
  - [Droid Observatory](#droid-observatory)
  - [Token & Cost Analytics](#token--cost-analytics)
  - [Session Replay](#session-replay)
- [HUD Integration](#hud-integration)
- [Debugging Techniques](#debugging-techniques)
- [External Resources](#external-resources)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

oh-my-droid provides comprehensive monitoring capabilities for tracking droid performance, token usage, costs, and identifying bottlenecks in multi-droid workflows. This guide covers both built-in tools and external resources for monitoring Droid's performance.

### What You Can Monitor

| Metric | Tool | Granularity |
|--------|------|-------------|
| Droid lifecycle | Droid Observatory | Per-droid |
| Tool timing | Session Replay | Per-tool call |
| Token usage | Analytics System | Per-session/droid |
| API costs | Analytics System | Per-session/daily/monthly |
| File ownership | Custom Droid Tracker | Per-file |
| Parallel efficiency | Observatory | Real-time |

---

## Built-in Monitoring

### Droid Observatory

The Droid Observatory provides real-time visibility into all running droids, their performance metrics, and potential issues.

#### Accessing the Observatory

The observatory is automatically displayed in the HUD when droids are running. You can also query it programmatically:

```typescript
import { getAgentObservatory } from 'oh-my-droid/hooks/custom droid-tracker';

const obs = getAgentObservatory(process.cwd());
console.log(obs.header);  // "Droid Observatory (3 active, 85% efficiency)"
obs.lines.forEach(line => console.log(line));
```

#### Observatory Output

```
Droid Observatory (3 active, 85% efficiency)
🟢 [a1b2c3d] executor 45s tools:12 tokens:8k $0.15 files:3
🟢 [e4f5g6h] researcher 30s tools:5 tokens:3k $0.08
🟡 [i7j8k9l] architect 120s tools:8 tokens:15k $0.42
   └─ bottleneck: Grep (2.3s avg)
⚠ architect: Cost $0.42 exceeds threshold
```

#### Status Indicators

| Icon | Meaning |
|------|---------|
| 🟢 | Healthy - droid running normally |
| 🟡 | Warning - intervention suggested |
| 🔴 | Critical - stale droid (>5 min) |

#### Key Metrics

| Metric | Description |
|--------|-------------|
| `tools:N` | Number of tool calls made |
| `tokens:Nk` | Approximate token usage (thousands) |
| `$X.XX` | Estimated cost in USD |
| `files:N` | Files being modified |
| `bottleneck` | Slowest repeated tool operation |

### Token & Cost Analytics

OMD automatically tracks token usage and costs across all sessions.

#### CLI Commands

```bash
# View current session stats
omd stats

# View daily/weekly/monthly cost reports
omd cost daily
omd cost weekly
omd cost monthly

# View session history
omd sessions

# View droid breakdown
omd droids

# Export data
omd export cost csv ./costs.csv
```

#### Real-time HUD Display

Enable the analytics preset for detailed cost tracking in your status line:

```json
{
  "omdHud": {
    "preset": "analytics"
  }
}
```

This shows:
- Session cost and tokens
- Cost per hour
- Cache efficiency (% of tokens from cache)
- Budget warnings (>$2 warning, >$5 critical)

#### Backfill Historical Data

Analyze historical Droid transcripts:

```bash
# Preview available transcripts
omd backfill --dry-run

# Backfill all transcripts
omd backfill

# Backfill specific project
omd backfill --project "*my-project*"

# Backfill recent only
omd backfill --from "2026-01-01"
```

### Session Replay

Session replay records droid lifecycle events as JSONL for post-session analysis and timeline visualization.

#### Event Types

| Event | Description |
|-------|-------------|
| `agent_start` | Droid spawned with task info |
| `agent_stop` | Droid completed/failed with duration |
| `tool_start` | Tool invocation begins |
| `tool_end` | Tool completes with timing |
| `file_touch` | File modified by droid |
| `intervention` | System intervention triggered |

#### Replay Files

Replay data is stored at: `.omd/state/droid-replay-{sessionId}.jsonl`

Each line is a JSON event:
```json
{"t":0.0,"droid":"a1b2c3d","agent_type":"executor","event":"agent_start","task":"Implement feature","parent_mode":"ultrawork"}
{"t":5.2,"droid":"a1b2c3d","event":"tool_start","tool":"Read"}
{"t":5.4,"droid":"a1b2c3d","event":"tool_end","tool":"Read","duration_ms":200,"success":true}
```

#### Analyzing Replay Data

```typescript
import { getReplaySummary } from 'oh-my-droid/hooks/custom droid-tracker/session-replay';

const summary = getReplaySummary(process.cwd(), sessionId);

console.log(`Duration: ${summary.duration_seconds}s`);
console.log(`Droids: ${summary.agents_spawned} spawned, ${summary.agents_completed} completed`);
console.log(`Bottlenecks:`, summary.bottlenecks);
console.log(`Files touched:`, summary.files_touched);
```

#### Bottleneck Detection

The replay system automatically identifies bottlenecks:
- Tools averaging >1s with 2+ calls
- Per-droid tool timing analysis
- Sorted by impact (highest avg time first)

---

## HUD Integration

### Presets

| Preset | Focus | Elements |
|--------|-------|----------|
| `minimal` | Clean status | Context bar only |
| `focused` | Task progress | Todos, droids, modes |
| `full` | Everything | All elements enabled |
| `analytics` | Cost tracking | Tokens, costs, efficiency |
| `dense` | Compact all | Compressed format |

### Configuration

Edit `~/.factory/settings.json`:

```json
{
  "omdHud": {
    "preset": "focused",
    "elements": {
      "droids": true,
      "todos": true,
      "contextBar": true,
      "analytics": true
    }
  }
}
```

### Custom Elements

| Element | Description |
|---------|-------------|
| `droids` | Active droid count and status |
| `todos` | Todo progress (completed/total) |
| `ralph` | Ralph loop iteration count |
| `autopilot` | Autopilot phase indicator |
| `contextBar` | Context window usage % |
| `analytics` | Token/cost summary |

---

## Debugging Techniques

### Identifying Slow Droids

1. **Check the Observatory** for droids running >2 minutes
2. **Look for bottleneck indicators** (tool averaging >1s)
3. **Review tool_usage** in droid state

```typescript
import { getAgentPerformance } from 'oh-my-droid/hooks/custom droid-tracker';

const perf = getAgentPerformance(process.cwd(), agentId);
console.log('Tool timings:', perf.tool_timings);
console.log('Bottleneck:', perf.bottleneck);
```

### Detecting File Conflicts

When multiple droids modify the same file:

```typescript
import { detectFileConflicts } from 'oh-my-droid/hooks/custom droid-tracker';

const conflicts = detectFileConflicts(process.cwd());
conflicts.forEach(c => {
  console.log(`File ${c.file} touched by: ${c.droids.join(', ')}`);
});
```

### Intervention System

OMD automatically detects problematic droids:

| Intervention | Trigger | Action |
|--------------|---------|--------|
| `timeout` | Droid running >5 min | Kill suggested |
| `excessive_cost` | Cost >$1.00 | Warning |
| `file_conflict` | Multiple droids on file | Warning |

```typescript
import { suggestInterventions } from 'oh-my-droid/hooks/custom droid-tracker';

const interventions = suggestInterventions(process.cwd());
interventions.forEach(i => {
  console.log(`${i.type}: ${i.reason} → ${i.suggested_action}`);
});
```

### Parallel Efficiency Score

Track how well your parallel droids are performing:

```typescript
import { calculateParallelEfficiency } from 'oh-my-droid/hooks/custom droid-tracker';

const eff = calculateParallelEfficiency(process.cwd());
console.log(`Efficiency: ${eff.score}%`);
console.log(`Active: ${eff.active}, Stale: ${eff.stale}, Total: ${eff.total}`);
```

- **100%**: All droids actively working
- **<80%**: Some droids stale or waiting
- **<50%**: Significant parallelization issues

### Stale Droid Cleanup

Clean up droids that exceed the timeout threshold:

```typescript
import { cleanupStaleAgents } from 'oh-my-droid/hooks/custom droid-tracker';

const cleaned = cleanupStaleAgents(process.cwd());
console.log(`Cleaned ${cleaned} stale droids`);
```

---

## External Resources

### Droid Performance Tracking Platforms

#### MarginLab.ai

[MarginLab.ai](https://marginlab.ai) provides external performance tracking for Droid models:

- **SWE-Bench-Pro daily tracking**: Monitor Droid's performance on software engineering benchmarks
- **Statistical significance testing**: Detect performance degradation with confidence intervals
- **Historical trends**: Track Droid's capabilities over time
- **Model comparison**: Compare performance across Droid model versions

#### Usage

Visit the platform to:
1. View current Droid model benchmark scores
2. Check historical performance trends
3. Set up alerts for significant performance changes
4. Compare across model versions (Opus, Sonnet, Haiku)

### Community Resources

| Resource | Description | Link |
|----------|-------------|------|
| Droid Discord | Community support and tips | [discord.gg/anthropic](https://discord.gg/anthropic) |
| OMD GitHub Issues | Bug reports and feature requests | [GitHub Issues](https://github.com/coli-dev/oh-my-droid/issues) |
| Anthropic Documentation | Official Droid documentation | [docs.anthropic.com](https://docs.anthropic.com) |

### Model Performance Benchmarks

Track Droid's performance across standard benchmarks:

| Benchmark | What It Measures | Where to Track |
|-----------|-----------------|----------------|
| SWE-Bench | Software engineering tasks | MarginLab.ai |
| HumanEval | Code generation accuracy | Public leaderboards |
| MMLU | General knowledge | Anthropic blog |

---

## Best Practices

### 1. Monitor Token Usage Proactively

```bash
# Set up budget warnings in HUD
/oh-my-droid:hud
# Select "analytics" preset
```

### 2. Use Appropriate Model Tiers

| Task Type | Recommended Model | Cost Impact |
|-----------|------------------|-------------|
| File lookup | Haiku | Lowest |
| Feature implementation | Sonnet | Medium |
| Architecture decisions | Opus | Highest |

### 3. Enable Session Replay for Complex Tasks

Session replay is automatically enabled. Review replays after complex workflows:

```bash
# Find replay files
ls .omd/state/droid-replay-*.jsonl

# View recent events
tail -20 .omd/state/droid-replay-*.jsonl
```

### 4. Set Cost Limits

The default cost limit per droid is $1.00 USD. Droids exceeding this trigger warnings.

### 5. Review Bottlenecks Regularly

After completing complex tasks, check the replay summary:

```typescript
const summary = getReplaySummary(cwd, sessionId);
if (summary.bottlenecks.length > 0) {
  console.log('Consider optimizing:', summary.bottlenecks[0]);
}
```

### 6. Clean Up Stale State

Periodically clean up old replay files and stale droid state:

```typescript
import { cleanupReplayFiles } from 'oh-my-droid/hooks/custom droid-tracker/session-replay';

cleanupReplayFiles(process.cwd()); // Keeps last 10 sessions
```

---

## Troubleshooting

### High Token Usage

**Symptoms**: Costs higher than expected, context window filling quickly

**Solutions**:
1. Use `eco` mode for token-efficient execution: `eco fix all errors`
2. Check for unnecessary file reads in droid prompts
3. Review `omd droids` for droid-level breakdown
4. Enable cache - check cache efficiency in analytics

### Slow Droid Execution

**Symptoms**: Droids running >5 minutes, low parallel efficiency

**Solutions**:
1. Check Observatory for bottleneck indicators
2. Review tool_usage for slow operations
3. Consider splitting large tasks into smaller droids
4. Use `architect-low` instead of `architect` for simple verifications

### File Conflicts

**Symptoms**: Merge conflicts, unexpected file changes

**Solutions**:
1. Use `ultrapilot` mode for automatic file ownership
2. Check `detectFileConflicts()` before parallel execution
3. Review file_ownership in droid state
4. Use `swarm` mode with explicit task isolation

### Missing Analytics Data

**Symptoms**: Empty cost reports, no session history

**Solutions**:
1. Run `omd backfill` to import historical transcripts
2. Verify HUD is running: `/oh-my-droid:hud setup`
3. Check `.omd/state/` directory exists
4. Review `token-tracking.jsonl` for raw data

### Stale Droid State

**Symptoms**: Observatory showing droids that aren't running

**Solutions**:
1. Run `cleanupStaleAgents(cwd)` programmatically
2. Delete `.omd/state/custom droid-tracking.json` to reset
3. Check for orphaned lock files: `.omd/state/custom droid-tracker.lock`

---

## State Files Reference

| File | Purpose | Format |
|------|---------|--------|
| `.omd/state/custom droid-tracking.json` | Current droid states | JSON |
| `.omd/state/droid-replay-{id}.jsonl` | Session event timeline | JSONL |
| `.omd/state/token-tracking.jsonl` | Token usage log | JSONL |
| `.omd/state/analytics-summary-{id}.json` | Cached session summaries | JSON |
| `.omd/state/custom droid-tracker.lock` | Concurrent access lock | Text |

---

## API Reference

### Custom Droid Tracker

```typescript
// Core tracking
getActiveAgentCount(directory: string): number
getRunningAgents(directory: string): SubagentInfo[]
getTrackingStats(directory: string): { running, completed, failed, total }

// Performance
getAgentPerformance(directory: string, agentId: string): AgentPerformance
getAllAgentPerformance(directory: string): AgentPerformance[]
calculateParallelEfficiency(directory: string): { score, active, stale, total }

// File ownership
recordFileOwnership(directory: string, agentId: string, filePath: string): void
detectFileConflicts(directory: string): Array<{ file, droids }>
getFileOwnershipMap(directory: string): Map<string, string>

// Interventions
suggestInterventions(directory: string): AgentIntervention[]
cleanupStaleAgents(directory: string): number

// Display
getAgentDashboard(directory: string): string
getAgentObservatory(directory: string): { header, lines, summary }
```

### Session Replay

```typescript
// Recording
recordAgentStart(directory, sessionId, agentId, agentType, task?, parentMode?, model?): void
recordAgentStop(directory, sessionId, agentId, agentType, success, durationMs?): void
recordToolEvent(directory, sessionId, agentId, toolName, eventType, durationMs?, success?): void
recordFileTouch(directory, sessionId, agentId, filePath): void

// Analysis
readReplayEvents(directory: string, sessionId: string): ReplayEvent[]
getReplaySummary(directory: string, sessionId: string): ReplaySummary

// Cleanup
cleanupReplayFiles(directory: string): number
```

---

## See Also

- [Analytics System](./ANALYTICS-SYSTEM.md) - Detailed token tracking documentation
- [Reference](./REFERENCE.md) - Complete feature reference
- [Architecture](./ARCHITECTURE.md) - System architecture overview
