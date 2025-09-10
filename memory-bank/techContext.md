# Technical Context: Add Remote Torrent

## 1. Core Technologies
-   **Google Chrome Extension APIs (Manifest V3):**
    -   **Service Worker (`background.js`):** Central hub for message passing, state management, and orchestrating API calls. Manages `chrome.alarms`.
    -   **Content Script (`content_script.js`) & `LinkMonitor.js`:** Uses `MutationObserver` for dynamic link detection on pages.
    -   **API Handlers (`api_handlers/`):** Modular, client-specific logic.
    -   **API Client Factory (`api_handlers/api_client_factory.js`):** Selects the appropriate handler.
    -   **Pages:** Standard HTML/CSS/JS for Options, Popup, a new Dashboard (`dashboard/`), and various dialogs.
    -   **`chrome.storage.local`:** Primary data store for all user settings and operational state.
    -   **`chrome.contextMenus`:** For right-click functionality.
    -   **`chrome.notifications`:** For user feedback on actions and download completions.
    -   **`chrome.alarms`:** Used for two key periodic tasks: `serverStatusCheck` and `torrentStatusCheck`.
    -   **Permissions:** `storage`, `contextMenus`, `notifications`, `alarms`, `offscreen`, and `optional_host_permissions`.
-   **JavaScript (ES6+ Modules), HTML5, CSS (TailwindCSS).**
-   **`bencode` library:** For parsing `.torrent` file metadata to extract tracker URLs for rule application.
-   **`webpack`:** Used as the build tool to bundle assets for production.
-   **`crx`:** NPM package used in the build script for signing the extension.

## 2. Data Storage (`chrome.storage.local`) Structure

```json
{
  "servers": [
    {
      "id": "unique_server_id_1",
      "name": "User-Friendly Server Name 1",
      "clientType": "qbittorrent",
      "url": "http://localhost:8080",
      "username": "admin",
      "password": "password",
      "tags": "default, movies",
      "category": "films",
      "addPaused": false,
      "status": "online",
      "version": "v5.1.2",
      "freeSpace": 1746595758080,
      "torrents": 150,
      "uploadSpeed": 102400,
      "downloadSpeed": 512000
    }
  ],
  "activeServerId": "unique_server_id_1",
  "urlToServerMappings": [],
  "trackerUrlRules": [],
  "linkCatchingPatterns": [],
  "trackedTorrents": [
    {
      "hash": "a1b2c3d4...",
      "serverId": "unique_server_id_1",
      "added": "2025-09-11T00:00:00.000Z"
    }
  ],
  "enableCompletionNotifications": true,
  "enableSoundNotifications": true,
  "enableTextNotifications": true,
  "advancedAddDialog": "manual",
  "lastActionStatus": "Torrent X added successfully."
}
```
- **`servers` Array:** Now serves as a cache for live data (`status`, `version`, `freeSpace`, `torrents`, `uploadSpeed`, `downloadSpeed`), which is periodically updated by the `serverStatusCheck` alarm.
- **`trackedTorrents` Array:** The core of the new notification system. Only torrents added by the extension are placed here. They are removed after a completion notification is sent.

## 3. Key Technical Challenges & Considerations
-   **API Handler Contract:** The introduction of the dashboard and targeted notifications has created a stricter "contract" for API handlers. To be fully featured, a handler **must** implement:
    1.  `addTorrent(...)`: Must return a `hash` on success.
    2.  `testConnection(...)`: Must return detailed server stats (`version`, `freeSpace`, `torrentsInfo`).
    3.  `getTorrentsInfo(server, hashes)`: Must query specific torrents by hash and return their completion status.
-   **State Management in a Service Worker:**
    -   All operational state (server statuses, tracked torrents) must be persisted to `chrome.storage.local` because the service worker can be terminated at any time.
    -   Logic cannot rely on in-memory variables for anything other than short-lived operations.
-   **Offscreen Audio:** The `offscreen` document (`offscreen_audio.html`) is used to play notification sounds, as this capability is restricted in the main service worker.
-   **Data Synchronization:** The dashboard, popup, and options page are all independent views of the same data in `chrome.storage.local`. They must listen for storage changes (`chrome.storage.onChanged`) or re-read from storage to display up-to-date information that may have been updated by a background alarm.

## 4. Deployment Process
-   **Versioning:** Version must be incremented in `manifest.json` and `package.json`.
-   **Changelog:** `README.md` and `release_notes.md` must be updated.
-   **Build Script (`scripts/zip.js`):**
    1.  Runs `webpack` to bundle assets.
    2.  Creates a `.zip` archive.
    3.  Generates a `.sha256` checksum.
    4.  Uses the `crx` npm package and `private.pem` to create the signed `.crx` file.
-   **GitHub Release (`gh` CLI):**
    -   The `gh release create` command is used to create a new tag and release.
    -   All three artifacts (`.zip`, `.crx`, `.sha256`) must be attached to the release.
    -   Authentication with GitHub for the `gh` tool is managed via a token stored in the `.envrc` file, which must be sourced (`source .envrc`) before running the command.
