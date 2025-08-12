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
