# Droid Prompt Templates

This directory contains reusable templates for creating droid prompts, reducing duplication across tiers.

## Files

- **base-droid.md**: Core template structure with injection points
- **tier-instructions.md**: Tier-specific behavioral instructions (LOW/MEDIUM/HIGH)
- **README.md**: This file - usage guide

## Template System

### Injection Points

The template uses the following placeholders:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{AGENT_NAME}}` | Droid identifier | `executor-low`, `architect-medium` |
| `{{ROLE_DESCRIPTION}}` | What this droid does | "You execute simple code changes..." |
| `{{TIER_INSTRUCTIONS}}` | Tier-specific behavior | LOW/MEDIUM/HIGH instructions |
| `{{TASK_SPECIFIC_INSTRUCTIONS}}` | Droid-specific protocols | "When fixing bugs, always add tests" |
| `{{EXPECTED_DELIVERABLES}}` | What to output | "Modified files + test results" |

### Usage

1. **Copy the base template**:
   ```bash
   cp droids/templates/base-droid.md droids/my-new-droid.md
   ```

2. **Replace placeholders**:
   - Set `{{AGENT_NAME}}` to your droid name
   - Write `{{ROLE_DESCRIPTION}}` specific to your droid
   - Copy appropriate tier instructions from `tier-instructions.md`
   - Add any `{{TASK_SPECIFIC_INSTRUCTIONS}}` unique to this droid
   - Define `{{EXPECTED_DELIVERABLES}}`

3. **Review common protocol**:
   - The base template includes shared verification and tool usage protocols
   - These apply to ALL droids and don't need modification
   - Only extend if your droid needs additional protocols

### Example: Creating executor-low

```markdown
# executor-low

## Role
You execute simple, well-defined code changes quickly and efficiently. Handle single-file modifications, small bug fixes, and straightforward feature additions.

## Tier-Specific Instructions
**Tier: LOW (Haiku) - Speed-Focused Execution**

- Focus on speed and direct execution
- Handle simple, well-defined tasks only
- Limit exploration to 5 files maximum
- Escalate to executor (MEDIUM) if:
  - Task requires analyzing more than 5 files
  - Complexity is higher than expected
  - Architectural decisions needed
- Prefer straightforward solutions over clever ones
- Skip deep investigation - implement what's asked

## Common Protocol
[... standard protocol from base-droid.md ...]

## Task Execution
- Read the target file first
- Make the requested changes
- Run lsp_diagnostics on changed files
- Verify changes compile/pass basic checks

## Deliverables
- Modified file(s)
- lsp_diagnostics output showing no new errors
- Brief summary of changes made
```

## Benefits

1. **Consistency**: All droids follow the same verification protocol
2. **Maintainability**: Update common protocols in one place
3. **Clarity**: Clear separation of tier vs. role-specific instructions
4. **Scalability**: Easy to add new droids or tiers

## Best Practices

- **Don't override common protocol** unless absolutely necessary
- **Be specific in role descriptions** - avoid vague terms like "handle tasks"
- **Document escalation paths** - when should this droid call another?
- **Include examples** in task-specific instructions when helpful
- **Keep tier instructions pure** - only capability/scope guidance, not role-specific behavior

## Tier Selection Guide

| Tier | Model | Token Cost | Use When |
|------|-------|------------|----------|
| LOW | Haiku | $ | Task is simple, well-defined, <5 files |
| MEDIUM | Sonnet | $$ | Task needs investigation, <20 files |
| HIGH | Opus | $$$ | Task is complex, architectural, unlimited files |

## Future Enhancements

Potential additions to the template system:

- Domain-specific templates (frontend, backend, data, etc.)
- Composition templates for specialized droids
- Automated template validation
- Template generation CLI tool
