---
name: chrome-extension-mv3-workflow
description: Build, debug, and validate Chrome Extension Manifest V3 changes in this repository. Use when editing background service worker logic, content scripts, popup/options pages, permissions, or extension messaging.
---

# Chrome Extension MV3 Workflow

## Quick Start

When asked to implement or fix extension behavior:

1. Identify the target surface: `background.js`, `content_script.js`, `popup/*`, `options/*`, or `manifest.json`.
2. Verify permission and host requirement changes in `manifest.json`.
3. Build with `bun run build`.
4. Validate console/runtime errors in extension pages and service worker logs.

## Editing Checklist

- Keep Manifest V3 constraints in mind (service worker lifecycle, no persistent background page).
- Use explicit message contracts between content script and background.
- Fail safely for network/client API errors and include actionable error text.
- Avoid DOM injection risks; sanitize any user-derived strings before rendering.
- Preserve existing user settings compatibility in `chrome.storage`.

## Validation Commands

Run from repo root:

```bash
bun install
bun run build
```

## Done Criteria

- Build succeeds with no webpack errors.
- Required permissions are minimal and intentional.
- Affected user flows still work: add torrent, server selection, and options save.
