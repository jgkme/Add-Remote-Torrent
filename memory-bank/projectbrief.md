# Project Brief: Add Remote Torrent

## 1. Project Overview

The project is to develop a Chrome browser extension named "Add Remote Torrent" that allows users to add Magnet URIs or torrent URLs via context menu to various torrent clients (e.g., qBittorrent, Transmission, Deluge, and others) directly via their WebUI connections. The extension will support managing multiple server profiles for different client types, offer various options for how torrents are added (including per-server defaults for tags, categories, paused state), and optionally allow automatic server selection based on the source website URL.

## 2. Core Requirements

-   **Manifest V3 Compliance:** The extension MUST adhere to Google's Manifest V3 requirements.
-   **Torrent Addition:**
    -   Support adding torrents via magnet URLs.
    -   Support adding torrents via direct URLs to .torrent files.
-   **Torrent Client Integration (Multi-Client):**
    -   Allow users to configure and manage multiple server profiles, specifying client type (e.g., qBittorrent, Transmission, Deluge), name, URL, credentials.
    -   Connect to the selected/active torrent server via its specific WebUI API.
    -   Support for an expanding list of torrent clients. Initial focus:
        -   qBittorrent (existing)
        -   Transmission
        -   Deluge
        -   (Future: uTorrent, rTorrent, Synology Download Station, QNAP Download Station, etc.)
    -   Allow manual selection of an "active" server for torrent additions via popup.
    -   Optionally (user-configurable setting), allow automatic server selection based on user-defined URL patterns of the source website.
-   **Torrent Parameters (Per-Server Defaults & Optional Override):**
    -   For each server profile, allow users to define client-appropriate defaults for:
        -   Tags/Labels (comma-separated or as supported by client).
        -   Category (if supported by client).
        -   Initial state (downloading or paused).
    -   Optionally (user-configurable setting), allow users to modify these parameters (tags, category, paused state) at the time of adding a specific torrent via an advanced dialog.
-   **User Interface:**
    -   **Options Page:** For managing server profiles, URL-to-server mappings, global settings (like enabling advanced add-time dialog or URL-based server selection), and export/import configurations.
    -   **Popup:** To manually select the active server, view its status/details, potentially clear last action status, and optionally offer manual URL input.
    -   **Context Menu:** Integration to easily send links to the appropriate torrent server.
-   **User Feedback:**
    -   Clear notifications for success/failure of operations, including the target server name, client type (and if a URL rule was applied).
    -   Status messages within the popup and options page.

## 3. Key Goals

-   Provide a seamless and flexible way for users to add torrents to their various torrent client servers directly from their browser.
-   Offer robust multi-client, multi-server management with manual and optional automatic server selection.
-   Allow fine-grained control over torrent parameters (tags, categories, paused state, etc., as supported by each client), both via defaults and optional add-time overrides.
-   Ensure the extension is lightweight, secure, and easy to use for both basic and advanced users.
-   Maintain compatibility with recent versions of supported torrent clients and Google Chrome.
-   Develop a modular and extensible architecture to facilitate adding support for new torrent clients in the future.

## 4. Scope

-   **Phase 0 (Completed):** Original qBittorrent-only extension with multi-server, advanced dialog, and URL-based selection features.
-   **Phase 1: Multi-Client Architecture Transformation (Current Focus)**
    -   [X] Rename project and update manifest/UI elements.
    -   [X] Research APIs for initial new clients (Deluge, Transmission).
    -   [X] Abstract server interaction: Design and implement API client factory and handlers for qBittorrent, Transmission, Deluge.
    -   [X] Update server configuration UI (`options.html`, `options.js`) to include "Client Type" and handle client-specific fields.
    -   [X] Update data structures (`chrome.storage.local`) to include `clientType` in server profiles.
    -   [X] Refactor torrent addition logic in `background.js` to use the new abstracted API handlers.
    -   [X] Update Memory Bank & `.clinerules` to reflect the new multi-client architecture.
-   **Phase 2: Adding More Client Support & Refinements**
    -   [ ] Implement API handlers for additional clients from the target list (e.g., uTorrent, rTorrent, Synology, QNAP).
    -   [ ] Refine UI for client-specific configuration fields in options page (e.g., dynamically show/hide fields based on client type).
    -   [ ] Enhance error handling and user feedback for different client APIs.
    -   [ ] Thoroughly test functionality across all supported clients.
-   **Phase 3: Advanced Features & Polish (Future)**
    -   [ ] Consider client-specific advanced options in the "Advanced Add Dialog".
    -   [ ] Further UI/UX improvements based on multi-client needs.
-   **Out of Scope (for now, unless specified later):**
    -   Advanced management features beyond adding torrents for any client.
    -   Highly complex UI designs beyond functional clarity.

## 5. Success Criteria

-   Users can configure and switch between multiple torrent servers of different client types (qBittorrent, Transmission, Deluge initially).
-   Users can optionally configure rules for automatic server selection based on website URLs, and these rules work across different client types.
-   Torrents are added to the selected/determined server using its client-specific API and defined default parameters (tags, category, paused state, etc.).
-   Users can optionally override default parameters at add-time if the advanced feature is enabled, with parameters relevant to the target client.
-   Existing features (export/import, URL-based selection, advanced dialog) function correctly within the new multi-client architecture.
-   The extension passes Chrome Web Store validation for Manifest V3.
-   Users find the extension intuitive for both simple and advanced use cases.
