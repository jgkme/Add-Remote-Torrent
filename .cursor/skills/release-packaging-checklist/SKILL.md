---
name: release-packaging-checklist
description: Create and verify release artifacts for this extension using the existing build pipeline. Use when bumping versions, generating zip/crx files, computing checksums, and checking release consistency.
---

# Release Packaging Checklist

**Private setup (tokens, push, `gh release`):** read `.cursor/MAINTAINERS.md` (gitignored). Never put `GH_TOKEN` or `.envrc` in README or commits.

**New skills:** install only under `.cursor/skills/` — never `.agents/skills/` (see `.cursor/rules/project-conventions.mdc`).

## Release Flow

1. Ensure version is correct in `package.json` and extension metadata.
2. Run build pipeline: `bun run build`.
3. Confirm generated files exist for the target version:
   - `add-remote-torrent-vX.Y.Z.zip`
   - `add-remote-torrent-vX.Y.Z.zip.sha256`
   - `add-remote-torrent-vX.Y.Z.crx`
4. Verify checksum file matches generated zip.

## Safety Rules

- Do not delete prior release artifacts unless explicitly requested.
- Do not overwrite or revert unrelated working tree changes.
- Keep release notes/changelog updates aligned with version changes.

## Verification Commands

```bash
bun run build
git status --short
```

## Done Criteria

- Build exits successfully.
- New artifact names match the intended version.
- Working tree changes are intentional and clearly explained.
