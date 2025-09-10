### v0.4.5 (2025-09-10)

*   **Enhancement:** Completed a comprehensive review of all API handlers to provide advanced information on the Dashboard. The following clients now report extended details:
    *   **qBittorrent:** Version & Free Space
    *   **Transmission:** Version & Free Space
    *   **Deluge:** Version & Free Space
    *   **rTorrent:** Version & Free Space
    *   **Synology Download Station:** Version & Free Space
    *   **QNAP Download Station:** Version
    *   **uTorrent:** Version
    *   **BiglyBT:** Version & Free Space
    *   **Vuze (XML WebUI):** Version & Free Space
    *   **Porla:** Version
    *   **Hadouken:** Version
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
