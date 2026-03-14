---
name: torrent-client-handler-patterns
description: Implement and review torrent client API handlers consistently across this repository. Use when adding or fixing files in api_handlers, authentication flow, request formatting, or post-add operations like labels, categories, and directories.
---

# Torrent Client Handler Patterns

## Handler Design Rules

Use these conventions for `api_handlers/*` changes:

1. Keep auth/session flow explicit and isolated per server profile.
2. Normalize error handling into readable, user-facing messages.
3. Preserve compatibility with older client variants when supported.
4. Avoid assuming content-type correctness for torrent files; handle fallbacks.
5. Keep test-connection logic separate from add-torrent logic.

## Implementation Checklist

- Confirm URL construction for base URL + relative path edge cases.
- Add required headers (for example origin/referer/basic auth) when applicable.
- Treat optional capabilities defensively (missing RPC methods, partial stats).
- Keep parsing strict and predictable for JSON/XML responses.
- Maintain backward compatibility for stored server config fields.

## Regression Hotspots

- Multi-server session leakage.
- Client version specific endpoints.
- Label/category/tag not applied after add.
- Race conditions around "latest torrent hash" detection.
- Silent failures in connection tests.

## Validation

- Build with `bun run build`.
- Manually validate one happy path and one failure path for the edited client.
