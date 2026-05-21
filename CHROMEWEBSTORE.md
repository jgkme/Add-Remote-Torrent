# Chrome Web Store Listing — Add Remote Torrent

> Last Updated: 2026-05-22  
> Manifest version: 0.4.43  
> Paste-ready marketing copy also lives in `WEBSTORE_COPY.md`. **Exclude this file from the published ZIP.**

## Store Listing

**Extension Name**  
Add Remote Torrent

**Short Description** (≤132 chars; matches `manifest.json` `description`)  
Add magnets and .torrent URLs to remote clients. Multi-server, local-only settings.

**Detailed Description**  
See `WEBSTORE_COPY.md` (detailed description section). Summary: send magnet links and `.torrent` URLs to qBittorrent, Transmission, Deluge, rTorrent, Synology/QNAP, and many other WebUIs; multiple server profiles; context menu; optional on-page link catching; per-server defaults; URL rules; private-tracker-friendly session fetch in the browser.

**Category**  
Productivity

**Single Purpose**  
Send magnet links and torrent URLs from the browser to remote torrent client WebUIs the user configures.

**Primary Language**  
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128x128.png` |
| Screenshot 1 | 1280×800 or 640×400 | 🟡 Update as needed | (maintain in CWS dashboard) |
| Screenshot 2+ | 1280×800 or 640×400 | 🟡 Optional | |

### Screenshot Notes

Show: popup with server selector, options with a LAN/VPS server URL example, context menu on a magnet link, optional link-catching indicator on a tracker page.

## Permissions Justification

Use these strings in the Chrome Web Store dashboard. **Do not narrow `optional_host_permissions` or content-script scope**—users rely on LAN IPs, custom ports, and remote VPS hostnames.

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Save server profiles (URL, credentials, labels), active server, URL-mapping rules, link-catching settings, RSS feeds, debug toggles, and recent action history locally on the device. |
| contextMenus | permissions | Provide "Add to [server]" and related right-click actions when the user right-clicks a link or page. |
| notifications | permissions | Show success/failure messages after adding a torrent, server health, RSS auto-add, and optional clipboard-shortcut hints. |
| offscreen | permissions | Play optional success/failure notification sounds using Chrome's offscreen document API (Manifest V3 requirement for audio playback). |
| alarms | permissions | Run periodic background checks for server online status, active torrent counts/speeds for the toolbar badge, and optional RSS feed polling. |
| activeTab | permissions | Grants temporary access to the current tab when the user invokes the extension (keyboard shortcut, context menu, action)—pairs with clipboard quick-add without a permanent `tabs` permission. |
| scripting | permissions | When the user runs the "Quick add torrent from clipboard" keyboard shortcut, inject a one-shot script into the **currently active** `http://`/`https://` tab only to read `navigator.clipboard` text. |
| http://*/* | optional_host_permissions | User-configured torrent WebUIs often use **plain HTTP on local networks** (NAS, Raspberry Pi, home server, Docker on LAN). Optional permission lets the user grant access per origin when they add a server. |
| https://*/* | optional_host_permissions | User-configured clients on **HTTPS** including remote VPS/seedboxes, reverse proxies, and TLS on LAN. Optional permission is granted by the user; the extension does not phone home. |
| Content script: `<all_urls>` (dynamic registration) | `scripting.registerContentScripts` when link catching is enabled | **Optional** on-page magnet/torrent link catching on indexers/trackers. Registered only when the user turns the feature on—not injected on every page by default. Does not affect `optional_host_permissions` for LAN/VPS/custom-port client URLs. |
| web_accessible_resources: `<all_urls>` | manifest | Expose extension UI assets (modal stylesheet, add/dashboard iframes, icons, audio) only so injected on-page UI can load when the user enables link catching or related features. |

### Host scope policy (internal)

- Keep **`optional_host_permissions`** (`http://*/*`, `https://*/*`)—not static `host_permissions`—so users opt in and can use any hostname/IP/port they configure.
- Do **not** replace with a fixed domain list; that would break home LAN, Docker, Tailscale, and VPS setups.

## Privacy & Data Use

**Does the extension collect user data?** No (developer does not collect).

| Data Type | Collected by developer? | Transmitted to developer? | Notes |
|-----------|-------------------------|---------------------------|--------|
| PII | No | No | |
| Authentication info | No (developer) | No | Credentials stored locally in `chrome.storage.local` for user's own clients |
| Web history | No | No | Extension does not upload browsing history |
| Website content | No (developer) | No | Page access only for user-initiated add/catch features |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**  
https://github.com/jgkme/Add-Remote-Torrent/blob/master/PRIVACY_POLICY.md

(Must match `PRIVACY_POLICY.md` in repo.)

## Distribution

**Visibility**: Public  
**Regions**: All regions  
**Pricing**: Free

## Developer Info

**Publisher Name**  
(jgkme — as on current listing)

**Contact Email**  
(use address on current Chrome Web Store listing)

**Support URL**  
https://github.com/jgkme/Add-Remote-Torrent/issues

**Homepage URL**  
https://github.com/jgkme/Add-Remote-Torrent/

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.4.43 | 2026-05-22 | Lazy API handlers; dynamic link-catching registration; activeTab clipboard; docs | Draft |
| 0.4.42 | 2026-05-22 | Clipboard shortcut default removed (avoid Ctrl+Shift+V conflict); docs/privacy alignment | Published |
| 0.4.41 | 2026-05-13 | Synology SID auth fix | Published |
| 0.4.40 | 2026-05-12 | qBittorrent 5.2+ login responses | Published |

(Full list: `WEBSTORE_COPY.md` / GitHub Releases.)

## Review Notes

### Known Issues / Limitations

- Client API handlers are lazy-loaded per server type (smaller service worker; first use of a client may have a brief load delay).
- When enabling link catching, refresh tabs that were already open in other windows if interception does not appear (focused window tabs are injected automatically).
- Enhanced Safe Browsing may warn on new/unlisted developers—see README FAQ.

### Rejection History

(none recorded)
