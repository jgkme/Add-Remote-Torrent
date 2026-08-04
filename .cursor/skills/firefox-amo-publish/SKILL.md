---
name: firefox-amo-publish
description: >
  Package and publish this extension to Firefox / addons.mozilla.org (AMO). Use when
  building the Firefox zip, adjusting gecko manifest settings, preparing AMO listing
  copy, signing with web-ext, or answering Firefox vs Chrome packaging questions.
---

# Firefox AMO Publish (Add Remote Torrent)

Project conventions: **`.cursor/rules/`**. Never commit AMO JWT secrets or `.envrc`.

## When to use

- User asks to publish / update on Firefox or AMO
- `build:firefox`, gecko id, `data_collection_permissions`, or offscreen/Firefox audio
- Pre-AMO checklist or source-code submission for minified builds

## Separate builds

| Target | Command | Artifact |
|--------|---------|----------|
| Chrome | `bun run build` | `add-remote-torrent-v*.zip` (+ crx) |
| Firefox | `bun run build:firefox` | `add-remote-torrent-v*-firefox.zip` |

Firefox transform: strip `offscreen` (+ offscreen assets); map `background.service_worker` → `background.scripts`; keep gecko id / data collection / min version from `manifest.json`.

## Permanent Gecko ID

`add-remote-torrent@jgkme` — do not change after first AMO listing.

## Runtime notes

- Prefer `chrome.*` (Firefox shims). No need for `webextension-polyfill` unless adopting `browser.*`.
- Sounds: feature-detect `chrome.offscreen`; else `Audio()` in background (`background.js`).
- Link catching: `chrome.scripting.registerContentScripts` (supported on modern Firefox).

## Publish flow (listed)

1. `bun test` && `bun run build:firefox`
2. Verify `dist/manifest.json` (id, no offscreen, data collection)
3. Sideload smoke via `about:debugging` (see `docs/firefox.md`)
4. AMO Developer Hub → Submit → listed → upload `*-firefox.zip`
5. Provide **source** zip + build steps when AMO asks (webpack minify)
6. Privacy policy URL; categories; reviewer notes
7. Updates: bump version, same gecko id, re-upload

Optional: `npx web-ext sign --source-dir=dist --channel=listed` with env JWT (not in git).

## Checklists & docs

- `docs/firefox.md` — build + Hub/CLI steps
- `docs/superpowers/specs/2026-08-04-pre-amo-checklist.md`
- `docs/superpowers/specs/2026-08-04-firefox-amo-design.md`
- Related: `release-packaging-checklist`, `chrome-extensions`, `firefox-extension`

## Agent safety

- Do **not** publish or call AMO APIs unless the user supplies credentials in-session and explicitly asks to submit.
- Do **not** write API keys into tracked files.
