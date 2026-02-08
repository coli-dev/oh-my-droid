# Rules Templates

This directory contains rule templates that you can copy to your project's `.droid/rules/` directory.

## How to Use

1. Create a `.droid/rules/` directory in your project root
2. Copy the templates you want to use
3. Customize them for your project
4. Rules in `.droid/rules/*.md` will be auto-discovered and injected into context

## Available Templates

| Template | Purpose |
|----------|---------|
| `coding-style.md` | Code style and formatting guidelines |
| `testing.md` | Testing requirements and coverage targets |
| `security.md` | Security checklist and best practices |
| `performance.md` | Performance guidelines and model selection |
| `git-workflow.md` | Git commit and PR workflow |

## Auto-Discovery

When you place rules in `.droid/rules/`, they are automatically discovered by oh-my-droid and injected into the context for all agents working in your project.

## Example

```bash
# Copy templates to your project
mkdir -p .droid/rules
cp templates/rules/security.md .droid/rules/
cp templates/rules/testing.md .droid/rules/

# Customize for your project
# Edit .droid/rules/security.md to add project-specific checks
```

## Customization

Each template has `[CUSTOMIZE]` markers where you should add project-specific guidelines.
