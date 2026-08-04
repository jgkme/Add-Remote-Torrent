# Pre–Firefox AMO checklist

**Maintainer-only.** Do not submit until smoke passes. Agent must not publish with secrets in the repo.

## Automated

- [ ] `bun test` — green
- [ ] `bun run build:firefox` — `verify-dist-background: OK`, `*-firefox.zip` produced
- [ ] `dist/manifest.json`: gecko id `add-remote-torrent@jgkme`, `background.scripts`, no `offscreen`, has `data_collection_permissions`

## Smoke (temporary add-on)

- [ ] Options: add a server, test connection
- [ ] Context-menu add magnet / `.torrent` URL
- [ ] Optional: on-page link catching + site access grant
- [ ] Optional: sound notifications (no offscreen errors in background console)
- [ ] Popup / dashboard load without console errors

## AMO listing

- [ ] Privacy policy URL ready (GitHub `PRIVACY_POLICY.md`)
- [ ] Screenshots / description prepared
- [ ] Source package ready (minified build → AMO asks for sources)
- [ ] Reviewer notes: how to configure a local client (optional demo credentials if needed)

## After submit

- [ ] Note AMO slug / listing URL
- [ ] Confirm Gecko ID unchanged for future updates
