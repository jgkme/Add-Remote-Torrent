# Chrome Web Store copy (paste-ready)

## Item summary (≤132 chars, plain text)

Option A:
Add magnets & .torrent URLs to remote clients—multi-server, private-tracker friendly, local-only settings.

Option B:
Send magnet links and .torrent URLs to qBittorrent/Transmission/Deluge & more. Multiple servers. Local-only settings.

---

## Detailed description (plain text, no HTML)

Add Remote Torrent is a browser extension for power users who manage remote file-transfer clients. It streamlines adding new transfers (via magnet links or .torrent file URLs) to various client WebUIs. It supports multiple server profiles, giving you a centralized experience directly from your browser.

Privacy and security: all server configurations are stored locally on your device and are never transmitted to external servers. It also works with private trackers by fetching the .torrent file content in the browser (with your session cookies) before sending it to your client when needed.

Key features:
- Add via magnet links or .torrent URLs
- Multiple server profiles (different clients / different seedboxes)
- Right-click context menu “send to…” per server
- Optional on-page link catching / quick add
- Per-server defaults (tags/categories/directory/paused; varies by client)
- URL-based rules to auto-select a server by site

Reporting issues:
If you encounter a bug, please open an issue on GitHub:
https://github.com/jgkme/Add-Remote-Torrent/issues

Please include:
- Extension version
- Torrent client name + version
- Steps to reproduce (what you did / expected / what happened)
- Exact error text from the popup under “Last Action”

For deeper logs:
- Options page → Debug & Log Settings → enable content-script + background-script logs
- Reproduce the issue
- Options page → Inspect → Console → copy relevant lines
- Please remove sensitive info (passwords/tokens/IPs) before posting

Recent updates:
- v0.4.42 (2026-05-22): Quick-add-from-clipboard has no default shortcut (was Ctrl+Shift+V) so Chrome paste-without-formatting is not overridden. Assign at chrome://extensions/shortcuts if wanted; clear the old Ctrl+Shift+V binding there after update if needed.
- v0.4.41 (2026-05-13): Synology Download Station — restore SID-only API auth (matches v0.4.23); fixes setups that broke with SynoToken / error 105. Clearer Synology error hints; dashboard shows last connection error details.
- v0.4.40 (2026-05-12): qBittorrent 5.2+ — accept empty/204 `auth/login` responses (not only legacy `Ok.`) so username/password works after upgrade.
- v0.4.39 (2026-05-13): qBittorrent — separate cookie login per server profile (fixes wrong-server 401 / misleading API-key prompts with multiple servers); clearer auth error copy.
- v0.4.38 (2026-05-08): Deluge — apply custom label/category after adding (Label plugin); create missing label; retry for Deluge 2.x timing.
- v0.4.37 (2026-05-05): qBittorrent — Web API 2.14+ torrents/add JSON responses (incl. 202/409) with legacy “Ok.” fallback; optional Web API key (Bearer); clearer auth vs network errors; startup status checks; packaging/signing fixes.

Full changelog:
https://github.com/jgkme/Add-Remote-Torrent/releases

