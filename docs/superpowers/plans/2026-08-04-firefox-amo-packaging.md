# Firefox AMO Packaging Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Produce a Firefox-ready zip and AMO submit docs for Add Remote Torrent.

**Architecture:** Shared webpack JS; Firefox manifest transform strips `offscreen`, sets permanent gecko id / data collection / min version; runtime feature-detects offscreen vs `Audio()`.

**Tech Stack:** webpack, Manifest V3, web-ext/AMO Developer Hub

---

### Task 1: Manifest + offscreen fallback
- [ ] Update `manifest.json` gecko block
- [ ] `playSound` Firefox `Audio()` path in `background.js`
- [ ] Soften Chromium-only warning in `content_script_registration.js`

### Task 2: `build:firefox`
- [ ] Webpack `env.browser=firefox` transform
- [ ] Zip script / npm script for `*-firefox.zip`
- [ ] Expand `docs/firefox.md` + pre-AMO checklist

### Task 3: Skills + verify
- [ ] `.cursor/skills/firefox-amo-publish/SKILL.md`
- [ ] `bun run build:firefox` + inspect dist manifest
- [ ] Publish guide for the user (AMO Hub steps)
