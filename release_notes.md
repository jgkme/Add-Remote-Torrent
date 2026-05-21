### v0.4.43 (2026-05-22)

*   **Perf:** Torrent client handlers are lazy-loaded per server type, shrinking the background service worker bundle.
*   **Perf / Privacy:** The link-catching content script is registered only when **Enable on-page link/form catching** is turned on in Options—not on every webpage by default. If you already had link catching enabled, your setting is unchanged; after updating, the extension restores registration automatically. Tabs in the focused window are activated immediately; refresh other open tabs if needed.
*   **Fix:** Clipboard quick-add uses `activeTab` with a one-shot script on the active `http://`/`https://` tab. Advanced add dialog window handling is more reliable after a service worker restart.
*   **Docs:** Privacy policy and Chrome Web Store permission notes updated.
*   **Chore:** Dev dependency updates.
*   **Build:** Generated release artifacts for `v0.4.43`.

### v0.4.42 (2026-05-22)

*   **Fix (Shortcuts):** “Quick add from clipboard” has **no default keyboard shortcut** (was **Ctrl+Shift+V** / **⌘⇧V**, which blocked Chrome paste-without-formatting ([#59](https://github.com/jgkme/Add-Remote-Torrent/issues/59))). Assign one at `chrome://extensions/shortcuts` if you want it. Updating does not remove an old binding automatically—clear **Ctrl+Shift+V** there if paste-without-formatting still fails; a one-time notification is shown when the extension detects the conflict.
*   **Build:** Generated release artifacts for `v0.4.42`.

### v0.4.41 (2026-05-13)

*   **Fix (Synology Download Station):** Restores **v0.4.23**-style authentication: session **`_sid` only**, without requesting **`enable_syno_token`** or sending **`SynoToken`** on Download Station / Web API calls. Builds after **v0.4.23** had added SynoToken support; on several DSM setups this caused **API error 105** or failed adds while **v0.4.23** still worked—this release aligns with that proven behaviour while keeping per-server SID caching, POST **Basic Auth** for reverse proxies, and proper **119** session retry.
*   **UX (Synology):** More helpful messages for common Synology API error codes (including **105**).
*   **Diagnostics:** Failed periodic connection checks now save **`lastError`** on each server; the **Dashboard → Show Details** panel shows the latest failure; torrent-add errors surface a short **technical detail** when the handler provides one.
*   **Build:** Generated release artifacts for `v0.4.41`.

### v0.4.40 (2026-05-12)

*   **Fix (qBittorrent):** Successful Web UI login on **qBittorrent 5.2+** can return **HTTP 204** or an **empty** body instead of the legacy `Ok.` string. The extension now accepts those responses so username/password connection tests and adds work without a false CSRF or “check URL” failure.
*   **Build:** Generated release artifacts for `v0.4.40`.

### v0.4.39 (2026-05-13)

*   **Fix (qBittorrent):** Cookie-based Web UI login is now tracked **per server profile** instead of one global session. After logging into one qBittorrent server, calls to another profile no longer skipped `auth/login`, which previously caused HTTP 401 on the API and confusing messages about needing a Web API key (common with multiple seedboxes and qBittorrent 5.2+).
*   **Fix (qBittorrent):** Refined unauthorized and connection-test wording so users check username/password and CSRF first; the optional Web API key (5.2+) is described only as a fallback when cookie access still cannot reach the API.
*   **Build:** Generated release artifacts for `v0.4.39`.

### v0.4.34 (2026-04-03)

*   **Fix (Private Trackers):** When adding torrents from on-page link catching or the context menu, the extension now more aggressively downloads `.torrent` files in the browser (using your logged-in session) before sending them to the client, even if the URL does not obviously look like a `.torrent` link.
*   **Fix (Diagnostics):** If the extension cannot obtain a usable `.torrent` file and must fall back to sending only the URL, it now records a clear entry in the action history and can surface a concise notification to explain what happened.
*   **Docs:** Updated options help text so users of private trackers without magnet links know when to enable **Always download .torrent files before sending to client** and to grant site access for their tracker domain.
*   **Build:** Generated release artifacts for `v0.4.34`.

### v0.4.33 (2026-03-15)

*   **Chore (Release):** Onboarding and delight polish pass with lazy-loaded bencode.
*   **Build:** Generated release artifacts for `v0.4.33`.

### v0.4.32 (2026-03-14)

*   **Chore (Release):** Minor release: optimize and polish pass with popup interaction performance improvements and dashboard rendering cleanup..
*   **Build:** Generated release artifacts for `v0.4.32`.

### v0.4.31 (2026-03-14)

*   **Chore (Release):** Minor release: roadmap hardening completion, multi-client torrent control support, UI/UX/accessibility improvements, and robustness fixes..
*   **Build:** Generated release artifacts for `v0.4.31`.

### v0.4.3 (2026-03-14)

*   **Feature (Shortcuts):** Added extension keyboard commands for quick add from clipboard, toggle on-page link catching, and open popup action.
*   **Feature (Popup UX):** Added live active-server DL/UL speed display, active torrents list, and quick refresh.
*   **Feature (Popup Actions):** Added per-torrent pause/resume/delete controls (currently implemented for qBittorrent action endpoints).
*   **Feature (Progress):** Added transfer progress bars in popup and dashboard.
*   **Feature (Badge):** Added configurable badge modes (`links`, `speed`, `active_count`, `off`) and active-server health color indicator.
*   **Feature (Add Flows):** Added batch add from multiline input and local `.torrent` upload via drag-and-drop/file picker.
*   **Feature (Clipboard):** Added clipboard inspection with optional auto-add on popup open.
*   **Feature (qBittorrent):** Added `Force Start` support in confirm dialog and per-server defaults.
*   **Feature (Rules):** Added label-to-directory mapping (`label=/path`) with confirm-dialog auto-fill and background fallback mapping.
*   **Feature (Search):** Added Jackett/Prowlarr search integration in popup with one-click add.
*   **Feature (RSS):** Added RSS feed polling with regex filtering and auto-add support.
*   **Feature (Profiles):** Added per-server profile export/import actions in options.
*   **Compatibility:** Added Firefox build notes and Gecko manifest settings for cross-browser packaging.
*   **Build:** Regenerated release artifacts for version `0.4.3`.

### v0.4.26 (2026-03-14)

*   **Chore (Release):** Bumped extension versions to `0.4.26` in `manifest.json` and `package.json`, and regenerated signed release artifacts.
*   **DevEx:** Added project Cursor skills for extension workflow, client handler patterns, issue triage, release packaging, and version/changelog tasks.
*   **DevContainer:** Improved Bun setup reliability by exporting Bun paths in container env and hardening post-create validation.

### v0.4.23 (2025-12-04)

*   **Fix (Critical, rTorrent):** Fully resolved XML-RPC fault -506 ("Method 'get_free_disk_space' not defined") during server status checks and "Test Connection". Removed faulty call entirely.
*   **Feat (rTorrent):** Implemented complete `testConnection` stats compatibility: client version, torrent count (`download_list`), global download/upload speeds (`get_down_rate`/`get_up_rate`), `torrentsInfo` object for dashboard/popup display.
*   **Feat (rTorrent):** Added `getTorrentsInfo(serverConfig, hashes)` using per-hash `d.complete` RPC calls, enabling targeted download completion notifications.
*   **Refactor (rTorrent):** Added `parseNumberFromXmlRpcResponse` helper with robust DOMParser-based XML parsing for `<i4>`/`int` values.

### v0.4.22 (2025-12-04)

*   **Fix (rTorrent):** Suppressed 'get_free_disk_space' XML fault (-506) in testConnection; now optional with try-catch, logs warning, sets freeSpace=-1.


### v0.4.21 (2025-12-04)

*   **Feat (Options):** Added credential validation warning for ruTorrent on save. Warns if username/password empty (common cause of Unauthorized errors).

### v0.4.20 (2025-12-03)

*   **Fix (rTorrent):** Improved XML-RPC hash list parsing in `getLatestTorrentHash`, fixing the bug where labels were not applied after adding torrents. Labels from server defaults or Confirm Add dialog are now reliably set via `d.custom1.set`.

### v0.4.18 (2025-11-16)

*   **Fix:** Corrected Options page client version display where some clients appeared as `vv5.1.2`.
*   **Docs:** Updated README to reflect the new Custom Link Catching Patterns UI and clarified sound notification behavior.

### v0.4.15 (2025-11-14)

*   **Chore:** Replaced deprecated `crx` package with `crx3` for CRX file generation, ensuring continued compatibility with Chrome Web Store requirements.
*   **Security:** Updated all dependencies to address security vulnerabilities, including the moderate severity issue in the `tar` package.

### v0.4.14 (2025-09-20)

*   **Feature:** Added sound notifications for success/failure, controlled from the Options page.
*   **Enhancement:** Improved sound system with programmatic beep generation and automatic detection of available sound files.

### v0.4.13 (2025-09-20)

*   **Fix (Critical):** Overhauled session management for qBittorrent and Deluge clients to be per-server, fixing major stability issues and race conditions in multi-server environments.
*   **Fix (Critical):** Corrected a bug in the Options page that prevented URL-to-server mapping rules from being edited.
*   **Fix (Security):** Patched a cross-site scripting (XSS) vulnerability on the dashboard page by implementing secure HTML escaping.
*   **Fix (Performance):** Improved the background server status check to use a concurrent queue, preventing performance issues when many servers are configured.
*   **Fix:** Hardened error handling for context menu creation.
*   **Refactor:** Improved the consistency and reliability of dynamic link detection.

### v0.4.12 (2025-09-11)

*   **Fix (Critical):** Resolved qBittorrent authentication issues that were causing "Failed to resume torrent" errors and dashboard "N/A" values. The `getBuildInfo` function now performs proper authentication before making API calls to `/api/v2/sync/maindata`, ensuring valid session data is returned for download/upload speeds and torrent counts.
*   **Fix:** Fixed dashboard display showing "N/A" for download speeds, upload speeds, and torrent counts on qBittorrent v5.0+ installations.
*   **Fix:** Added proper Referer and Origin headers for all qBittorrent API requests to ensure compatibility with reverse proxy setups.
*   **Enhancement:** Added debug logging to help diagnose API response data and authentication issues.

### v0.4.11 (2025-09-11)

*   **Fix (Critical):** Corrected a regression in the qBittorrent handler that caused a "404 Not Found" error when attempting to resume a torrent after adding it.

### v0.4.10 (2025-09-11)

*   **Fix (Critical):** Implemented a more robust `safeSendMessage` wrapper in the content script to finally resolve the "Extension context invalidated" errors that occurred on dynamic pages.
*   **Fix:** Corrected a `ReferenceError: onAlarm is not defined` in the background script, ensuring periodic tasks (like server status checks and completion notifications) now run correctly.
*   **Fix:** Hardened the server statistics handling logic to prevent "N/A" values from appearing for qBittorrent and other clients.

### v0.4.9 (2025-09-11)

*   **Internal:** This version was part of the iterative process to fix the critical bugs below and was superseded by v0.4.10.

### v0.4.8 (2025-09-11)

*   **Fix (Critical):** Overhauled the "Download Complete" notification system to fix a major bug that caused notification spam. The system now intelligently tracks only torrents added *by the extension* and sends a single notification upon completion, ignoring all other torrents in the client.
*   **Fix:** Resolved an issue where qBittorrent servers would incorrectly display "N/A" for Torrents, DL Speed, and UL Speed in the popup and dashboard.
*   **Feature:** Added a new setting on the Options page to allow users to enable or disable the "Download Complete" notifications, providing full control over this feature.

### v0.4.7 (2025-09-10)

*   **Feat(Notifications):** Added support for "Download Complete" notifications for qBittorrent, Transmission, Deluge, and rTorrent clients. The extension will now check for completed torrents every minute and display a desktop notification.

### v0.4.6 (2025-09-10)

*   **Fix(Dashboard):** The dashboard now correctly displays advanced server information (Free Space, Total Torrents, Speeds) for all supported clients. It will display "N/A" if a specific data point is not available.
*   **Feat(Dashboard):** Added a "Show More" button to each server card on the dashboard. Clicking this will reveal the raw JSON data for the server, which will help in debugging cases where data is not appearing as expected.

### v0.4.5 (2025-09-10)

*   **Enhancement: Pro Dashboard:** The dashboard is now significantly more powerful. After a comprehensive review of all client APIs, the following clients now report extended details:
    *   **qBittorrent:** Version & Free Space, Global Speeds, Total Torrents
    *   **Transmission:** Version & Free Space, Global Speeds, Total Torrents
    *   **Deluge:** Version & Free Space, Global Speeds, Total Torrents
    *   **rTorrent:** Version & Free Space
    *   **Synology Download Station:** Version & Free Space
    *   **QNAP Download Station:** Version
    *   **uTorrent:** Version
    *   **BiglyBT:** Version & Free Space
    -   **Vuze (XML WebUI):** Version & Free Space
    -   **Porla:** Version
    -   **Hadouken:** Version
*   **Feature:** Added a new "Vuze (XML WebUI)" client type to support the modern, Transmission-compatible API.
*   **Fix:** Corrected a critical bug where the "context invalidated" error would spam the console on pages with dynamic content. The content script now handles this error gracefully.
*   **Fix:** Improved the `LinkMonitor` to more reliably detect torrent links on dynamic web pages (e.g., Telegram, Facebook) by re-scanning sections of the page when significant changes are detected.
*   **Fix:** Added the `dashboard` directory to the build process, resolving an `ERR_FILE_NOT_FOUND` error when trying to access the new Dashboard page.

### v0.4.3 (2025-09-10)

*   **Fix:** Added the missing "alarms" permission to the manifest file, which was causing the service worker to fail and preventing the periodic server status check from running.
*   **Fix:** Corrected a data-loss bug where editing and saving an existing server profile would unintentionally erase its stored status information (version, free space, online status).

### v0.4.0 (2025-09-10)

*   **Feature: Dashboard Page:** Added a new Dashboard page accessible from the popup, which displays the online/offline status of all servers, advanced client information (version, free space), and a log of the last 10 actions.
*   **Feature: Advanced Connection Testing:** The "Test Connection" feature now fetches and displays the client version and free disk space for qBittorrent, Transmission, and Deluge servers.
*   **Feature: Client-Specific Advanced Options:** Added a "Content Layout" dropdown in the "Confirm Add" dialog for qBittorrent, a "Bandwidth Priority" option for Transmission, and a "Move when Completed" option for Deluge, which appear contextually based on the target client.
*   **Feature: UI/UX Enhancements:**
    *   Added client-specific setup hints to the options page.
    *   Added instructional text for Tags, Categories, and Directories to guide users.
    *   Added a Regex Helper section with examples to assist in creating custom link-catching patterns.
*   **Feature: Action History:** The extension now logs the last 10 success or failure messages for display in the dashboard.
*   **Feature: Periodic Server Status Check:** A background task now runs every 15 minutes to check the online/offline status of all configured servers.
*   **Fix:** Resolved a UI bug where the "Confirm Add" dialog would sometimes show a scrollbar on different screen sizes or scaling settings.
*   **Chore:** Updated project dependencies to the latest versions.

### v0.3.21 (2025-09-06)

*   **Fix:** Resolved a critical "Extension context invalidated" error that occurred during extension reloads. The content script now handles this expected error gracefully, preventing console errors on every page load and improving overall stability.
