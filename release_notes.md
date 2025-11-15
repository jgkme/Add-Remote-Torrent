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
