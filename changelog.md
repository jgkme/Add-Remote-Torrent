# Add Remote Torrent

A Chrome browser extension that allows users to easily add torrents (via magnet links or .torrent file URLs) to various remote torrent client WebUIs. It supports managing multiple server profiles for different client types like qBittorrent, Transmission, Deluge, and more, offering a streamlined experience for torrent management directly from your browser.

I used Cline + Google Gemini Pro to code this from scratch losely based on now discontinued @bogenpirat/remote-torrent-adder with my own added features.
Please give it a try and create some feedbacks or issues here.

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/add-remote-torrent/holiffefjdehbfhliggafhhlecphpdof?hl=en-US&utm_source=ext_sidebar)**

## Version history

### 0.4.42 (2026-05-22)

- **Fix (Shortcuts):** Quick-add-from-clipboard has no default shortcut (was **Ctrl+Shift+V** / **⌘⇧V**, which blocked Chrome paste-without-formatting ([#59](https://github.com/jgkme/Add-Remote-Torrent/issues/59))). Assign at `chrome://extensions/shortcuts` if desired. Updates do not clear old bindings; clear **Ctrl+Shift+V** there if needed—a one-time notification appears when the conflict is still detected.

### 0.4.41 (2026-05-13)

- **Fix (Synology Download Station):** SID-only session (`_sid`) without SynoToken/login flag changes introduced after **v0.4.23**—fixes regression where some NAS setups returned API **105** or broke adds.
- **UX (Synology):** Friendlier copy for common Synology API error codes.
- **Diagnostics:** Store **lastError** on failed server status checks; dashboard details; richer add-failure messages when handlers expose **technicalDetail**.

### 0.4.40 (2026-05-12)

- **Fix (qBittorrent):** Treat `auth/login` success when the response body is empty or status is **204** (qBittorrent 5.2+), in addition to legacy `Ok.` responses.

### 0.4.39 (2026-05-13)

- **Fix (qBittorrent):** Per-server cookie login sessions so multiple profiles no longer share one global “logged in” flag (fixes spurious 401 / wrong-server auth after using another profile).
- **Fix (qBittorrent):** User-facing unauthorized and connection-test messages emphasize username/password and CSRF; Web API key documented as optional fallback only.

### 0.4.38 (2026-05-08)

- **Feat / Fix (qBittorrent):** Web API 2.14+ `torrents/add` JSON responses (including 202/409); legacy `Ok.` unchanged.
- **Feat:** Optional qBittorrent Web API key (Bearer auth, v5.2+).
- **Fix:** Auth vs network error messages on add; HTTP 401 hints on connection test.
- **Feat:** Immediate server status check on startup; persist **Web API** version for qBittorrent.
- **Fix:** Restore `.crx` signing by patching `crx3` for CommonJS `pbf` and pinning `pbf@3`.
- **Fix (Deluge):** Apply custom label/category via `label.set_torrent` after adding.
- **Chore:** Dev dependency updates (webpack, tailwind, postcss, terser, etc.).

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
*   **v0.4.35 (2026-04-13):**
    *   **Fix (UI):** Fixed options/popup/confirm dialog scripts failing to run by loading them as ES modules (`type="module"`), so settings persist correctly and related UI flows work as expected.
*   **v0.4.34 (2026-04-03):**
    *   **Fix (Private Trackers):** Improved handling of on-page and context-menu torrent adds by downloading `.torrent` files in the browser (with cookies) whenever the request originates from a real page, even if the URL does not obviously look like a torrent link.
    *   **Fix (Diagnostics):** Added clearer history entries and notifications when the extension cannot download a `.torrent` file and falls back to sending only the URL, making private-tracker failures easier to understand and debug.
    *   **Docs:** Clarified options/help text for the "Always download .torrent files before sending to client" setting and recommended usage for private trackers without magnet links.
    *   **Build:** Generated release artifacts for `v0.4.34`.
*   **v0.3.12 (2025-08-21):**
    *    *   **qBittorrent:** Fixed an issue where Automatic Torrent Management (ATM) was not being triggered when adding a torrent with a category. The `autoTMM` parameter is now correctly sent to the API.
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

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for more details.

## Support the Project

If you find this extension useful, please consider supporting its development.

[<img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" >](https://www.buymeacoffee.com/jgkme)