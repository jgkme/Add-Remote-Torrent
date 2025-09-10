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
