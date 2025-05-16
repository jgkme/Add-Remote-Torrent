# Remote Torrent WebUI Adder via Browser

A Chrome browser extension that allows users to easily add torrents (via magnet links or .torrent file URLs) to various remote torrent client WebUIs. It supports managing multiple server profiles for different client types like qBittorrent, Transmission, Deluge, and more, offering a streamlined experience for torrent management directly from your browser.


I coded this from scratch losely based on now discontinued /bogenpirat/remote-torrent-adder with my own added features.
Please give it a try and create some feedbacks or issues here. 

Supported Clients
qBittorrent (Fully Tested) 
Transmission
Deluge
uTorrent
rTorrent
Synology Download Station


## Core Features

*   **Multi-Client Support:** Configure and manage connections to various torrent clients (e.g., qBittorrent, Transmission, Deluge, uTorrent, rTorrent, Synology Download Station, etc.).
*   **Flexible Torrent Addition:**
    *   Add torrents via context menu for magnet links and direct .torrent file URLs.
    *   Manual URL input via the extension popup.
    *   On-page link catching with an optional quick-add modal for setting directory/labels.
*   **Advanced Torrent Management:**
    *   Define per-server default parameters (tags/labels, category, download directory, initial paused state).
    *   Optional "Advanced Add Dialog" to customize parameters and select specific files within a torrent before adding.
*   **Server Management:**
    *   Manage multiple server profiles with client-specific settings.
    *   Test connection to servers.
    *   Export and import server configurations.
*   **Automatic Server Selection (Optional):** Configure rules to automatically select a target server based on the source website URL.
*   **Modern Interface:** User-friendly interface built with Tailwind CSS, including dark mode support.
*   **Manifest V3 Compliant:** Built according to the latest Chrome extension standards.
*   **Build Process:** Uses Webpack for optimized builds.

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




