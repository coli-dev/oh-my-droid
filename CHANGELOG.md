# Changelog

## [Unreleased]

### Changed

- Migrate user-facing terminology from "agent" to "droid" across commands, skills, droid prompts, templates, plugin metadata, and documentation surfaces.
- Keep technical internals stable (e.g. package identifiers) while updating wording and installer expectation to "Multi-Droid Orchestration".
- Migrate droid model routing and default assignments from legacy `haiku/sonnet/opus` tiers to explicit `custom:*` model IDs, including delegation enforcement and routing tier mappings.
- Update all `droids/*.md` frontmatter `model` fields from legacy tier labels to explicit `custom:*` model IDs.
- Rebalance `droids/*.md` model assignments by task profile and expand usage to all supported `custom:*` model IDs.
- Reduce `custom:claude-opus-4.5-6` usage in `droids/*.md` by migrating high-reasoning droids to `custom:gpt-5.3-codex-3`.
- Synchronize full source model mapping so only `planner` and `architect` keep `custom:claude-opus-4.5-6`, with other former Opus assignments migrated to `custom:gpt-5.3-codex-3`.
- Add root `README.md` with quick start, development commands, and high-level project structure.
- Expand `README.md` into a full guide with setup flow, configuration examples, supported model IDs, and oh-my-droid specific usage sections.
- Add full `~/.factory/.omd-config.json` example to `README.md`, including droid model overrides, feature flags, permissions, and keyword customization.
