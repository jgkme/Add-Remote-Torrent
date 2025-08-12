# Add Remote Torrent

A Chrome browser extension that allows users to easily add torrents (via magnet links or .torrent file URLs) to various remote torrent client WebUIs. It supports managing multiple server profiles for different client types like qBittorrent, Transmission, Deluge, and more, offering a streamlined experience for torrent management directly from your browser.

I used Cline + Google Gemini Pro to code this from scratch losely based on now discontinued @bogenpirat/remote-torrent-adder with my own added features.
Please give it a try and create some feedbacks or issues here.

## Supported Clients
- qBittorrent (Fully Tested)
- Transmission
- Deluge
- uTorrent
- rTorrent (XML-RPC)
- ruTorrent (WebUI)
- Synology Download Station
- Hadouken
- Tixati
- Torrentflux
- Vuze (HTML WebUI)
- Flood
- Tribler
- BiglyBT

## Core Features

*   **Multi-Client Support:** Configure and manage connections to various torrent clients.
*   **Flexible Torrent Addition:**
    *   Clicking on a torrent or magnet link will automatically add it to your default server.
    *   Right-clicking on a link allows you to choose which server to send the torrent to.
    *   Manual URL input via the extension popup.
    *   Add torrent by clicking the extension icon.
    *   On-page link catching with an optional quick-add modal for setting directory/labels.
*   **Advanced Torrent Management:**
    *   Define per-server default parameters (tags/labels, category, download directory, initial paused state).
    *   Optional "Advanced Add Dialog" to customize parameters and select specific files within a torrent before adding.
*   **Server Management:**
    -   Manage multiple server profiles with client-specific settings.
    -   Test connection to servers.
    -   Open server's WebUI in a new tab.
    -   Export and import server configurations.
*   **Automatic Server Selection (Optional):** Configure rules to automatically select a target server based on the source website URL.
*   **Modern Interface:** User-friendly interface built with Tailwind CSS, including dark mode support.
*   **Manifest V3 Compliant:** Built according to the latest Chrome extension standards.
*   **Build Process:** Uses Webpack for optimized builds.

## Changelog
*   **v0.3.3 (2025-08-13):**
    *   **Added:**
        *   **New Clients:** Added support for Tribler and BiglyBT.
        *   **WebUI Link:** The "Active Server Details" section in the popup is now a clickable link that opens the server's WebUI.
    *   **Fixed:**
        *   **ruTorrent:** Corrected the handler to properly add torrents, addressing issues with URL construction, magnet link handling, and parameter submission.
    *   **Improved:**
        *   **Client Handlers:** Reviewed and updated the handlers for Hadouken, Tixati, Torrentflux, Vuze, and Flood to align with their official documentation and improve reliability.
*   **v0.3.2 (2025-08-12):**
    *   **Added:** Client-Specific Feature Enhancements. This update introduces a wide range of new, client-specific options, giving users more granular control over how torrents are added to their servers.
        *   **qBittorrent:** Added a "Save Path" option.
        *   **Transmission:** Added options for speed limits, seeding limits, peer limits, sequential downloading, and bandwidth priority.
        *   **Deluge:** Added options for speed limits, connection limits, seeding options, and miscellaneous settings like sequential downloading.
        *   **rTorrent:** Added options for priority, throttle, and peer settings. Improved label support to use `d.custom.set` instead of `d.custom1.set`.
        *   **ruTorrent:** The handler now supports sending multiple labels when adding a torrent, improving integration with plugins like `tracklabels`.
        *   **uTorrent / BitTorrent:** When adding a `.torrent` file, the handler now correctly sends the download directory (`path`) and label as part of the request. The handler will now attempt to set the label on a torrent immediately after it has been added via file upload, if the torrent's hash can be determined.
*   **v0.3.1 (2025-08-12):**
    *   **Fixed:** qBittorrent paused state bug, Deluge response format, rTorrent reliability, CSS leaking, and link handling.
    *   **Added:** ruTorrent support, add by icon click, open WebUI button, configurable download locations for Transmission.
*   **v0.3.0 (2025-08-08):**
    *   **Added:** ruTorrent support, add by icon click, open WebUI button, configurable download locations for Transmission.
    *   **Fixed:** qBittorrent paused state bug, Deluge response format, rTorrent reliability, CSS leaking, and link handling.
*   **v0.2.9 (2025-06-11):**
    *   **Added:** Dynamic link monitoring, server-specific context menus, and debug settings.
    *   **Fixed:** Click handling, sound notifications, JSON syntax, and XML escaping.
*   **2025/06/06:** Added Audio Notification Option, fixed export filename, added tracker URL-based assignment.
*   **2025/06/05:** Added Fix for qbitorrent Webui 5.1 (untick CSRF under Security)

## Technologies Used

*   JavaScript (ES6+ Modules)
*   HTML5 & CSS3 (Tailwind CSS)
*   Chrome Extension APIs (Manifest V3)
*   Webpack

## Installation & Usage 

*(Details on how to load the extension in developer mode or install from a store would go here.)*

1.  Clone the repository (once published).
2.  Run `pnpm install` to install dependencies.
3.  Run `pnpm build` to build the extension into the `dist/` folder.
4.  Load the `dist/` folder as an unpacked extension in Chrome's Developer Mode.
5.  Configure your torrent servers in the extension's options page.
