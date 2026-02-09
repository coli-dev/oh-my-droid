# Changelog

## [Unreleased]

### Changed

- Migrate user-facing terminology from "agent" to "droid" across commands, skills, droid prompts, templates, plugin metadata, and documentation surfaces.
- Keep technical internals stable (e.g. package identifiers) while updating wording and installer expectation to "Multi-Droid Orchestration".
- Migrate droid model routing and default assignments from legacy `haiku/sonnet/opus` tiers to explicit `custom:*` model IDs, including delegation enforcement and routing tier mappings.
- Update all `droids/*.md` frontmatter `model` fields from legacy tier labels to explicit `custom:*` model IDs.
- Rebalance `droids/*.md` model assignments by task profile and expand usage to all supported `custom:*` model IDs.
