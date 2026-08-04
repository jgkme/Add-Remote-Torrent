# Firefox compatibility & permissions audit (2026-08-04)

Deep review of the MV3 codebase for Firefox / AMO. Fixes from this audit are in the same change set.

## Verdict

Core add / options / popup / client flows are Firefox-ready with the **Firefox build** (`bun run build:firefox`). Shared JS uses `chrome.*` with feature detection. Remaining AMO risk is mainly **policy wording** (`data_collection_permissions: none` vs traffic to user-configured remotes), not missing API permissions.

## Critical fixes applied

| Issue | Fix |
|-------|-----|
| `background.service_worker` rejected | Firefox webpack → `background.scripts` |
| `offscreen` unsupported | Stripped in Firefox build; `Audio()` fallback |
| `notifications` `buttons` / `priority` TypeError | `createExtensionNotification()` strips Chromium-only fields on Firefox |
| Clipboard on FF 140–146 | Firefox build adds `clipboardRead` |
| Dynamic content script matches | `http://*/*`, `https://*/*` (aligned with optional hosts) |
| CWS-only review URLs | `getStoreReviewsUrl()` → GitHub on Firefox until AMO live |
| `OnInstalledReason` enum | String compare `"update"`; skip Chrome shortcut nudge on Firefox |

## Permissions matrix

| Permission | Chrome | Firefox | Purpose |
|------------|--------|---------|---------|
| `storage` | yes | yes | Local settings |
| `contextMenus` | yes | yes | Send-to menu |
| `notifications` | yes | yes | Status / review (safe fields only on FF) |
| `offscreen` | yes | **no** | Chrome MV3 audio |
| `alarms` | yes | yes | Status / RSS polling |
| `scripting` | yes | yes | Link catching + clipboard inject |
| `activeTab` | yes | yes | Shortcut-driven tab access |
| `clipboardRead` | no | **yes** | Reliable clipboard on Firefox |
| `optional_host_permissions` `http(s)://*/*` | yes | yes | User clients + catching (prompted) |

No install-time `host_permissions` (good for AMO install UX).

## AMO `data_collection_permissions`

Declared `required: ["none"]` matches product intent (no developer telemetry). The extension **does** send credentials / torrents / optional search & RSS to **user-configured** hosts. Reviewer notes should explain that; if AMO rejects `none`, add taxonomy types (e.g. `authenticationInfo`, `websiteContent`) in a follow-up.

## Release workflow

Yes — before each store release, run **both**:

```bash
bun test && bun run build && bun run build:firefox
```

## Residual / non-blocking

- `options_page` works; `options_ui` is optional polish
- `action.onClicked` unused while `default_popup` is set
- Link-catching host prompt from keyboard command may fail user-gesture rules; Options toggle is the reliable path
- HTTP to remote seedboxes may draw encryption questions — note HTTPS preference in reviewer notes
