# Add Remote Torrent

A Chrome browser extension that allows users to easily add torrents (via magnet links or .torrent file URLs) to various remote torrent client WebUIs. It supports managing multiple server profiles for different client types like qBittorrent, Transmission, Deluge, and more, offering a streamlined experience for torrent management directly from your browser.

I used Cline + Google Gemini Pro to code this from scratch losely based on now discontinued @bogenpirat/remote-torrent-adder with my own added features.
Please give it a try and create some feedbacks or issues here.

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/add-remote-torrent/holiffefjdehbfhliggafhhlecphpdof?hl=en-US&utm_source=ext_sidebar)**

## Supported Clients
- qBittorrent
- Transmission
- Deluge
- uTorrent / BitTorrent
- rTorrent (XML-RPC)
- ruTorrent (WebUI)
- Synology Download Station
- QNAP Download Station
- Hadouken
- Tixati
- Torrentflux
- Vuze (HTML WebUI)
- Flood
- Tribler
- BiglyBT
- Kodi Elementum
- Buffalo Torrent Client
- Porla

## Core Features

*   **Multi-Client Support:** Configure and manage connections to a wide variety of file-transfer clients.
*   **Flexible Torrent Addition:**
    *   Clicking a magnet or file link automatically adds it to your default server.
    *   Right-click context menu to choose a specific server.
    *   Manual URL input via the extension popup.
    *   On-page link catching with an optional quick-add modal for setting directories/labels.
*   **Advanced Management:**
    *   Define per-server default parameters (tags, category, download directory, initial paused state).
    *   Optional "Advanced Add Dialog" to customize parameters and select specific files before adding.
*   **Server & Rule Management:**
    -   Manage multiple server profiles with client-specific settings.
    -   Test server connections.
    -   Open a server's WebUI directly from the extension.
    -   Configure rules to automatically select a server based on the source website URL.
    -   Assign labels/directories based on tracker URLs found within the transfer file.
*   **Modern & Secure:**
    *   User-friendly interface built with Tailwind CSS, including dark mode.
    *   Manifest V3 compliant, adhering to the latest security standards.
    *   No data collection. All your settings are stored locally. See our [Privacy Policy](PRIVACY_POLICY.md).
*   **Customization:**
    *   Optional sound notifications for success/failure. (We've received feedback about providing shorter or custom sounds, which may be considered for a future release!)

### Adding Torrents with a Single Click (On-Page Catching)

The extension can automatically detect torrent links on any webpage and allow you to add them with a single left-click, without needing to use the right-click context menu.

**How to Enable:**

1.  Open the extension's **Options** page.
2.  Go to the **"Other Global Settings"** section.
3.  Check the box next to **"Enable on-page link/form catching"**.

Once enabled, the extension will monitor pages for torrent links (like `magnet:` or links ending in `.torrent`). When you click one of these links, it will be automatically sent to your configured torrent client.

#### **Catching links that don't end in `.torrent`**
Some websites provide download links for `.torrent` files that don't have the `.torrent` file extension in the URL (e.g., `https://example.com/download.php?id=123`). By default, the extension won't catch these.

To catch these links, you need to add a custom URL pattern:
1.  Go to the extension's **Options** page -> **Other Global Settings**.
2.  Find the **"Custom URL patterns for on-page link catching"** text box.
3.  Enter a unique part of the URL for that website's torrent links. You can separate multiple patterns with a tilde (`~`).

**Example:** If a site's download links look like `https://www.example-tracker.com/torrent.php/12345/my-file.torrent`, a good pattern to add would be `example-tracker.com/torrent.php/`.

## Troubleshooting & FAQ

**Q: Why does Chrome show a warning about "Enhanced Protection" when I install the extension?**
A: Chrome's Enhanced Safe Browsing shows this warning for new extensions or extensions from new developers. To become "trusted," a developer must follow the Chrome Web Store Developer Program Policies for a few months. Our extension is fully compliant with these policies, including a strict privacy policy and the use of minimal permissions. Your security is a top priority.

**Q: I'm having trouble connecting to my client, especially with qBittorrent v4.3.0+ or ruTorrent.**
A:
*   **qBittorrent:** For versions 4.3.0 and newer (especially v5.1.0+), you may need to disable "CSRF Protection" in the WebUI options under the "Web UI" tab. Our extension needs to interact with the API in a way that can be blocked by this feature.
*   **ruTorrent:** For the best results, enter the full URL to your ruTorrent installation in the **"Server URL"** field (e.g., `https://your-server.com/rutorrent`) and leave the **"ruTorrent Relative Path"** field blank. Alternatively, you can enter the base URL (e.g., `https://your-server.com`) and the path (e.g., `/rutorrent`) in their respective fields.

**Q: A torrent link didn't get added correctly.**
A: Some websites use intermediate links or redirects. The extension tries to follow these, but it may not always succeed. If a link fails, try right-clicking and using the "Add Torrent to Remote WebUI" context menu option. If the problem persists, please open an issue on GitHub with the details.

**Q: I'm using an old version of uTorrent (like v2.0.4) and getting a "Failed to obtain uTorrent CSRF token" error.**
A: Very old versions of the uTorrent WebUI have a different API. When you configure your server in the extension's options, make sure you select **"uTorrent (Old)"** as the "Client Type". This uses a legacy API handler that is compatible with older clients. If you have selected the standard "uTorrent" client type, it will fail with a token error.

**Q: On macOS, clicking torrent links doesn't do anything.**
A: Please ensure that the "Enable on-page link/form catching" option is enabled in the extension's settings. You can find this under "Other Global Settings" on the options page. If it is enabled and still not working, please open an issue on GitHub and provide as much detail as possible, including your macOS and Chrome versions.

**Q: I'm having trouble connecting to rTorrent on seedbox.io.**
A: For older `seedbox.io` accounts, you may need a specific URL format. When configuring the `rTorrent (XML-RPC)` client, try the following:
*   **rTorrent Web UI URL:** `https://<full_username>.seedbox.io/`
*   **SCGI/HTTPRPC URL (for rTorrent):** `https://<full_username>.seedbox.io/RPC/<username_numbers_only>/`

**Q: As a developer, I see a lot of console messages from this extension. Can it be disabled?**
A: Yes. The extension uses a `MutationObserver` to detect dynamically added links, which can be verbose. You can disable this logging without losing functionality.
*   Go to the extension's **Options** page.
*   At the bottom, find the **"Debug & Log Settings"** section.
*   Uncheck the boxes for "content-script" to disable the on-page console messages.

## Reporting Issues

If you encounter a bug, please [open an issue on our GitHub page](https://github.com/jgkme/Add-Remote-Torrent/issues). To help us resolve the issue quickly, please include the following information:

1.  **The version of the extension** you are using.
2.  **The name and version of your torrent client** (e.g., qBittorrent v4.4.2).
3.  **A clear description of the problem.** What did you do? What did you expect to happen? What actually happened?
4.  **The exact error message** you received. You can find this in the extension's popup under "Last Action".
5.  **Enable debugging** to get more detailed error logs:
    *   Go to the extension's **Options** page.
    *   At the bottom, find the **"Debug & Log Settings"** section.
    *   Enable all checkboxes for both "content-script" and "background-script".
    *   Reproduce the error.
    *   Open the browser's developer console (Right-click anywhere on the options page -> Inspect -> Console tab).
    *   Copy and paste any relevant error messages from the console into your GitHub issue. **Please review the logs and remove any sensitive information like passwords or IP addresses before posting.**

We are working on a feature to make this process easier by allowing you to report issues directly from the extension.

## Changelog
*   **v0.4.5 (2025-09-10):**
    *   **Enhancement:** Completed a comprehensive review of all major API handlers to provide advanced information on the Dashboard. The following clients now report extended details:
        *   **qBittorrent:** Version & Free Space
        *   **Transmission:** Version & Free Space
        *   **Deluge:** Version & Free Space
        *   **rTorrent:** Version & Free Space
        *   **Synology Download Station:** Version & Free Space
        *   **QNAP Download Station:** Version
        *   **uTorrent:** Version
        *   **BiglyBT:** Version & Free Space
    *   **Fix:** Corrected a critical bug where the "context invalidated" error would spam the console on pages with dynamic content. The content script now handles this error gracefully.
    *   **Fix:** Improved the `LinkMonitor` to more reliably detect torrent links on dynamic web pages (e.g., Telegram, Facebook) by re-scanning sections of the page when significant changes are detected.
    *   **Fix:** Added the `dashboard` directory to the build process, resolving an `ERR_FILE_NOT_FOUND` error when trying to access the new Dashboard page.
*   **v0.4.3 (2025-09-10):**
    *   **Fix:** Added the missing "alarms" permission to the manifest file, which was causing the service worker to fail and preventing the periodic server status check from running.
    *   **Fix:** Corrected a data-loss bug where editing and saving an existing server profile would unintentionally erase its stored status information (version, free space, online status).
*   **v0.4.0 (2025-09-10):**
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
*   **v0.3.21 (2025-09-06):**
    *   **Fix:** Resolved a critical "Extension context invalidated" error that occurred during extension reloads. The content script now handles this expected error gracefully, preventing console errors on every page load and improving overall stability.
*   **v0.3.20 (2025-09-06):**
    *   **Fix:** Corrected a regression where the "URL-to-Server Mappings" feature was being ignored. The server selection logic now correctly prioritizes URL-based rules over context menu selections, restoring the expected automatic routing behavior.
*   **v0.3.19 (2025-09-05):**
    *   **Feature:** Overhauled the "Custom Link Catching Patterns" setting. It now features a user-friendly UI for adding, editing, and deleting individual regex patterns, replacing the old, single-string input.
    *   **Feature:** Added two default patterns to catch common `.torrent` file links and `torrents.php` download links, improving out-of-the-box functionality.
    *   **Migration:** Implemented a seamless, one-time migration for existing users. The old `linkmatches` tilde-separated string is automatically converted into the new array-based format, preserving all user-defined patterns.
*   **v0.3.18 (2025-09-05):**
    *   **Feature:** Added support for four new clients: BiglyBT, Flood, Porla, and an updated Elementum handler.
    *   **Feature:** Added a new option to show download directories in the context menu. This allows for adding torrents to specific directories in one click.
    *   **Fix:** Corrected a bug where the context menu would fail to update if a server had no download directories defined.
    *   **Fix:** Added error handling to the content script to prevent "context invalidated" errors on dynamic pages.
*   **v0.3.17 (2025-08-29):**
    *   **Fix:** Implemented a comprehensive fix for uTorrent connectivity. The handler now correctly uses a user-configurable "Relative Path" for all API requests (including token fetching and connection testing), resolving errors for non-standard WebUI paths. The connection test now uses a more reliable `getsettings` check.
    *   **UX:** The options page now auto-detects and separates the relative path if it's included in the main server URL for uTorrent clients, and the "Open WebUI" button in both the options page and the popup correctly constructs the URL using this path.
*   **v0.3.11 (2025-08-19):**
    *   **Feature:** Added an accessibility option to enable/disable text-based (visual) notifications for success or failure, providing an alternative to sound-based feedback.
*   **v0.3.10 (2025-08-18):**
    *   **Security:** Fixed multiple cross-site scripting (XSS) vulnerabilities in the options page where user-provided data was not properly sanitized before being rendered. This hardens the extension against malicious data injection in the URL mapping and tracker rules lists.
*   **v0.3.9 (2025-08-18):**
    *   **Fixed:** Resolved an issue where torrent links on a page were not being detected or intercepted due to a `ReferenceError` in the content script. On-page link catching should now work correctly again.
*   **v0.3.8 (2025-08-16):**
    *   **Feature:** Added the ability to specify a list of download directories per server and select one from a dropdown in the "Add Torrent" dialog.
*   **v0.3.7 (2025-08-15):**
    *   **Fixed:**
        *   **ruTorrent:** Improved torrent file handling by always attempting to download the `.torrent` file content, even with incorrect `Content-Type` headers. This resolves upload issues with clients like ruTorrent that cannot access torrent URLs directly.
        *   **Notifications:** Corrected all error notification titles to `Add Remote Torrent Error`.
*   **v0.3.6 (2025-08-14):**
    *   **Feature:** Added a "Report Issue" button in the popup to streamline bug reporting.
    *   **Fixed:**
        *   **ruTorrent:** Corrected URL construction logic to prevent 404 errors.
        *   **uTorrent (Old):** Modified the API handler to support very old, token-less clients.
    *   **Docs:**
        *   Added a "Reporting Issues" section to the README with instructions for debugging.
        *   Updated troubleshooting guide for ruTorrent and old uTorrent versions.
*   **v0.3.5 (2025-08-13):**
    *   **Fixed:**
        *   **ruTorrent:** Corrected an issue where the server URL was not being constructed properly, causing connection failures.
        *   **uTorrent:** Added a new "uTorrent (Old)" client type to support older versions of the uTorrent WebUI (e.g., v2.0.4) that do not support modern API features like setting labels or download directories.
*   **v0.3.4 (2025-08-13):**
    *   **Added:**
        *   **WebUI Link:** The "Active Server Details" section in the popup is now a clickable link that opens the server's WebUI.
    *   **Improved:**
        *   **Dependencies:** Updated all project dependencies to their latest versions.
        *   **Documentation:** Updated the README with a more compliant overview, a link to the Chrome Web Store, and a new Troubleshooting/FAQ section.
*   **v0.3.3 (2025-08-13):**
    *   **Added:**
        *   **New Clients:** Added support for Hadouken, Tixati, Torrentflux, Vuze (HTML WebUI), Flood, Tribler, and BiglyBT.
    *   **Fixed:**
        *   **ruTorrent:** Corrected the handler to properly add torrents, addressing issues with URL construction, magnet link handling, and parameter submission based on official documentation and community implementations.
*   **v0.3.2 (2025-08-12):**
    *   **Added:** Client-Specific Feature Enhancements. This update introduces a wide range of new, client-specific options, giving users more granular control over how torrents are added to their servers.
*   **v0.3.1 (2025-08-12):**
    *   **Fixed:** qBittorrent paused state bug, Deluge response format, rTorrent reliability, CSS leaking, and link handling.
    *   **Added:** ruTorrent support, add by icon click, open WebUI button, configurable download locations for Transmission.
*   **v0.2.9 (2025-06-11):**
    *   **Added:** Dynamic link monitoring, server-specific context menus, and debug settings.
    *   **Fixed:** Click handling, sound notifications, JSON syntax, and XML escaping.

## Technologies Used

*   JavaScript (ES6+ Modules)
*   HTML5 & CSS3 (Tailwind CSS)
*   Chrome Extension APIs (Manifest V3)
*   Webpack

## Installation & Usage 

1.  **Recommended:** [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/add-remote-torrent/holiffefjdehbfhliggafhhlecphpdof?hl=en-US&utm_source=ext_sidebar).
    *   Please note that new versions may take some time to be reviewed and published on the Chrome Web Store.
2.  **Manual/Developer (for the latest version):**
    *   Go to the [Releases page](https://github.com/jgkme/Add-Remote-Torrent/releases) on GitHub and download the `add-remote-torrent-vX.X.X.zip` file from the latest release.
    *   Unzip the file.
    *   In Chrome, go to `chrome://extensions`, enable "Developer mode", and click "Load unpacked".
    *   Select the `dist` folder from the unzipped files.
3.  Configure your servers in the extension's options page.

## Verifying Releases

Ensuring the extension you install is secure and untampered with is crucial. We provide methods to verify both the manual GitHub releases and the official version from the Chrome Web Store.

### Verifying GitHub Releases (for Manual Installation)

For users who download the extension directly from the [Releases page](https://github.com/jgkme/Add-Remote-Torrent/releases), we provide a SHA-256 checksum file with each release.

1.  Download both the `add-remote-torrent-vX.X.X.zip` file and the corresponding `add-remote-torrent-vX.X.X.zip.sha256` file.
2.  Open a terminal or command prompt in your downloads folder.
3.  Use the appropriate command for your operating system to generate a hash of the `.zip` file:

    **On macOS or Linux:**
    ```sh
    shasum -a 256 add-remote-torrent-vX.X.X.zip
    ```

    **On Windows (Command Prompt or PowerShell):**
    ```powershell
    certutil -hashfile add-remote-torrent-vX.X.X.zip SHA256
    ```
4.  Compare the generated hash with the contents of the `.sha256` file. They must match exactly.

### Verifying the Chrome Web Store Version

When you install from the Chrome Web Store, the extension is signed by Google. You can verify this signature to be certain you have the official version.

1.  **Find the Extension ID:**
    *   Go to `chrome://extensions` in your browser.
    *   Find "Add Remote Torrent" and click on "Details".
    *   The Extension ID (a long string of letters) will be visible in the address bar or on the page. The official ID is `holiffefjdehbfhliggafhhlecphpdof`.

2.  **Download the Official `.crx` file:**
    *   You can use an online tool like [CRX Viewer](https://robwu.nl/crxviewer/) by entering the extension ID to view the contents and download the official `.crx` file signed by the Chrome Web Store.

3.  **Inspect the Package:**
    *   Once downloaded, you can inspect the `.crx` file's manifest and signatures using various third-party tools to confirm its authenticity. This confirms that the package was signed and verified by Google and has not been altered.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for more details.

## Support the Project

If you find this extension useful, please consider supporting its development.

[<img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" >](https://www.buymeacoffee.com/jgkme)
