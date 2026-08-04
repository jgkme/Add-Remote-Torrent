# Firefox / AMO packaging design (2026-08-04)

**Status:** Approved (Gecko ID option 1).

## Goal

Ship Add Remote Torrent on addons.mozilla.org (listed) from the existing MV3 codebase, with a dedicated Firefox build artifact.

## Decisions

- **Gecko ID:** `add-remote-torrent@jgkme` (permanent after first AMO submit)
- **Min Firefox:** `140.0` (supports `data_collection_permissions`)
- **Data collection:** `required: ["none"]` — no developer/third-party collection; traffic only to user-configured clients (matches `PRIVACY_POLICY.md`)
- **Sounds:** Feature-detect `chrome.offscreen`; Firefox plays via `Audio()` in the background context
- **Builds:** Separate `build:firefox` — same JS bundle, Firefox-adjusted manifest (strip `offscreen` permission), zip as `*-firefox.zip`

## Out of scope

- Migrating to WXT / rewriting to `browser.*`
- Android (`gecko_android`) listing
- Auto-publishing with stored AMO secrets in the repo
