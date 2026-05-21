---
name: version-bump-and-changelog
description: Perform safe extension version bumps and changelog updates for this repository. Use when preparing a release, synchronizing version metadata, updating changelog entries, and validating generated artifacts.
---

# Version Bump And Changelog

Project conventions: **`.cursor/rules/`**. Release auth / push: **`.cursor/MAINTAINERS.md`**.

## Versioning Workflow

1. Confirm target version and release intent (patch/minor/hotfix).
2. Update version metadata in project files that drive packaging.
3. Add a concise changelog/release note entry focused on user impact.
4. Build and verify artifact names match the target version.

## Changelog Rules

- Lead with highest-impact fixes/features first.
- Use consistent tags like `Fix`, `Feat`, `Security`, `Refactor`, `Docs`, `Chore`.
- Keep entries user-oriented and avoid internal-only noise.
- Mention client-specific scope when relevant (for example `rTorrent`, `qBittorrent`).

## Validation Commands

```bash
bun install
bun run build
git status --short
```

## Done Criteria

- Version metadata and release notes are aligned.
- Build succeeds and artifacts are generated for the target version.
- Working tree contains only intentional release changes.
