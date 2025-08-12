# Add Remote Torrent

A browser extension for power users who manage remote file-transfer clients. This tool streamlines the process of adding new transfers (via magnet links or file URLs) to various client WebUIs. It supports managing multiple server profiles, offering a centralized experience for transfer management directly from your browser.

The extension is designed with privacy and security in mind. All server configurations are stored locally on your device and are never transmitted to external servers. It also works seamlessly with private trackers by fetching the file content before adding it to your client's WebUI.

This project was developed using advanced AI coding assistants and is loosely based on the now-discontinued `remote-torrent-adder` by bogenpirat, with many new features and a modern architecture.

**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/add-remote-torrent/holiffefjdehbfhliggafhhlecphpdof?hl=en-US&utm_source=ext_sidebar)**

Please give it a try and create some feedbacks or issues at the [GitHub page](https://github.com/jgkme/Add-Remote-Torrent).

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
*   **Flexible Transfer Addition:**
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

## Troubleshooting & FAQ

**Q: Why does Chrome show a warning about "Enhanced Protection" when I install the extension?**
A: Chrome's Enhanced Safe Browsing shows this warning for new extensions or extensions from new developers. To become "trusted," a developer must follow the Chrome Web Store Developer Program Policies for a few months. Our extension is fully compliant with these policies, including a strict privacy policy and the use of minimal permissions. Your security is a top priority.

**Q: I'm having trouble connecting to my client, especially with qBittorrent v4.3.0+ or ruTorrent.**
A:
*   **qBittorrent:** For versions 4.3.0 and newer (especially v5.1.0+), you may need to disable "CSRF Protection" in the WebUI options under the "Web UI" tab. Our extension needs to interact with the API in a way that can be blocked by this feature.
*   **ruTorrent:** Ensure the "ruTorrent Relative Path" in the server settings is correct. It should point to the directory where ruTorrent is installed on your server (e.g., `/rutorrent`). Also, ensure your connection uses SSL (https) if your server requires it.

**Q: A torrent link didn't get added correctly.**
A: Some websites use intermediate links or redirects. The extension tries to follow these, but it may not always succeed. If a link fails, try right-clicking and using the "Add Torrent to Remote WebUI" context menu option. If the problem persists, please open an issue on GitHub with the details.

## Changelog
*   **v0.3.4 (2025-08-13):**
    *   **Added:**
        *   **New Clients:** Added support for Tribler and BiglyBT.
        *   **WebUI Link:** The "Active Server Details" section in the popup is now a clickable link that opens the server's WebUI.
    *   **Fixed:**
        *   **ruTorrent:** Corrected the handler to properly add torrents, addressing issues with URL construction, magnet link handling, and parameter submission.
    *   **Improved:**
        *   **Client Handlers:** Reviewed and updated the handlers for Hadouken, Tixati, Torrentflux, Vuze, and Flood to align with their official documentation and improve reliability.
        *   **Documentation:** Updated the README with a more compliant overview, a link to the Chrome Web Store, and a new Troubleshooting/FAQ section.
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
2.  **Manual/Developer:**
    *   Clone the repository.
    *   Run `pnpm install` to install dependencies.
    *   Run `pnpm build` to build the extension into the `dist/` folder.
    *   Load the `dist/` folder as an unpacked extension in Chrome's Developer Mode.
3.  Configure your servers in the extension's options page.
