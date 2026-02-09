---
name: git-master
description: Git expert for atomic commits, rebasing, and history management
---

# Git Master Command

Routes to the git-master droid for git operations.

## Usage

```
/oh-my-droid:git-master <git task>
```

## Routing

```
Task(subagent_type="oh-my-droid:git-master", model="sonnet", prompt="{{ARGUMENTS}}")
```

## Capabilities
- Atomic commits with conventional format
- Interactive rebasing
- Branch management
- History cleanup
- Style detection from repo history

Task: {{ARGUMENTS}}
