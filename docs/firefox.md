## Firefox build & AMO notes

### Do we need a separate Firefox build?

**Yes.** Same JS mostly, but the Firefox zip must:

- Use permanent Gecko ID `add-remote-torrent@jgkme`
- Declare `data_collection_permissions` + `strict_min_version` (≥ 140)
- **Omit** the Chromium-only `offscreen` permission (sounds use `Audio()` on Firefox)
- Use `background.scripts` (event page), not `background.service_worker` — Firefox often rejects SW for temporary/AMO installs
- Add `clipboardRead` for reliable clipboard quick-add on Firefox 140+
- Notifications omit Chromium-only fields (`buttons`, `priority`) at runtime on Firefox

**Permissions note:** `data_collection_permissions.required: ["none"]` means no developer/analytics collection. Traffic still goes to **user-configured** clients after optional host grants — explain that in AMO reviewer notes (see `docs/superpowers/specs/2026-08-04-firefox-compat-audit.md`).

Chrome: `bun run build` → `add-remote-torrent-vX.Y.Z.zip` (+ `.crx`)  
Firefox: `bun run build:firefox` → `add-remote-torrent-vX.Y.Z-firefox.zip`

### Sideload (dev)

1. `bun run build:firefox`
2. Firefox → `about:debugging` → This Firefox → Load Temporary Add-on → pick `dist/manifest.json`
3. Smoke-test: add server, context-menu add, optional link catching, optional sounds

Temporary add-ons reset on browser restart.

### AMO (listed) publish — maintainer steps

Official: [Submitting an add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)

1. Create/sign in at [addons.mozilla.org Developer Hub](https://addons.mozilla.org/developers/)
2. Build: `bun run build:firefox`
3. **Submit a New Add-on** → **On this site** (listed)
4. Upload `add-remote-torrent-vX.Y.Z-firefox.zip`
5. Because the build is webpack-minified, upload a **source code** zip when prompted (repo tarball or clean source tree + build instructions: `bun install && bun run build:firefox`)
6. Fill listing: name, summary, description, categories, support/homepage (GitHub), privacy policy URL (`PRIVACY_POLICY.md` on GitHub raw or site)
7. Declare data collection consistent with manifest (`none` to developer; host access is optional permissions)
8. Submit for review

#### Optional CLI (`web-ext`)

```bash
# API key: Developer Hub → API Keys (JWT issuer + secret). Never commit.
npx web-ext sign --source-dir=dist --channel=listed \
  --api-key="$AMO_JWT_ISSUER" --api-secret="$AMO_JWT_SECRET"
```

First listed submit often needs metadata via Hub UI or `--amo-metadata=...`.

### What not to change after first submit

Keep **`browser_specific_settings.gecko.id`** = `add-remote-torrent@jgkme` forever for updates.
