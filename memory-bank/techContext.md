# Technical Context: Add Remote Torrent

## 1. Core Technologies
-   **Google Chrome Extension APIs (Manifest V3):**
    -   `manifest.json` (updated for new name, description, and ES module background script)
    -   **Service Worker (`background.js` as ES Module):** Handles core logic, messaging, and delegates API calls via client factory.
    -   **Content Script (`content_script.js`):** Injects `LinkMonitor` and handles on-page user interactions.
    -   **Link Monitor (`LinkMonitor.js`):** Uses `MutationObserver` to dynamically detect torrent links.
    -   **API Handlers (`api_handlers/`):** Modules for specific client API interactions (e.g., `qbittorrent_handler.js`, `transmission_handler.js`, `deluge_handler.js`, `rutorrent_handler.js`).
    -   **API Client Factory (`api_handlers/api_client_factory.js`):** Dynamically provides client-specific API handlers.
    -   **Popup (`popup/`)**
    -   **Options Page (`options/`)** (updated for client type selection, includes "Open WebUI" button)
    -   **Advanced Add Dialog (`confirmAdd/`)**
    -   **`chrome.storage.local`:** For storing:
        -   `servers`: An array of server configuration objects. Each object now includes `clientType` (e.g., "qbittorrent", "transmission"), `url`, `username`, `password`, `tags`, `category`, `categories`, `addPaused`, and client-specific fields like `transmissionDownloadDir`.
        -   `activeServerId`: The ID of the currently manually selected active server.
        -   `urlToServerMappings`: An array of objects, each mapping a website URL pattern to a server ID.
        -   `enableUrlBasedServerSelection`: Boolean, global toggle for URL-based server selection.
        -   `advancedAddDialog`: String (`never`, `always`, `manual`, `catch`).
        -   `lastActionStatus`.
    -   `chrome.contextMenus` API
    -   `chrome.notifications` API
    -   `chrome.runtime.openOptionsPage`
    -   `chrome.downloads` API (Potential for Export)
    -   File API (HTML5 - for Import)
    -   **Permissions:** `storage`, `contextMenus`, `notifications`, `optional_host_permissions`, potentially `downloads`.
-   **JavaScript (ES6+ Modules), HTML & CSS, Fetch API, JSON.**
-   **`bencode` and `buffer` libraries:** For parsing `.torrent` files in the advanced add dialog.

## 2. Torrent Client WebUI APIs
-   Interaction with various torrent client APIs (qBittorrent, Transmission, Deluge initially) is abstracted via client-specific handlers in the `api_handlers/` directory.
-   Each handler manages the specific authentication, request/response formats, and endpoints for its client (e.g., qBittorrent's form-data and cookie auth, Transmission's JSON-RPC with session ID, Deluge's JSON-RPC with session cookie).
-   The qBittorrent handler includes a version check to handle API differences between versions (e.g., using `stopped` instead of `paused` for newer versions).
-   Common parameters like torrent URL, paused state, tags/labels, category are mapped to client-specific API fields within each handler.

## 3. Data Storage (`chrome.storage.local`) Structure (Conceptual - Expanded)

```json
{
  "servers": [
    {
      "id": "unique_server_id_1",
      "name": "User-Friendly Server Name 1",
      "clientType": "qbittorrent", // New field
      "url": "http://localhost:8080", // Generic field name
      "username": "admin", // Generic field name
      "password": "password", // Generic field name
      "tags": "default, movies",
      "category": "films",
      "categories": "films,tv,software",
      "addPaused": false
    },
    {
      "id": "unique_server_id_2",
      "name": "Seedbox Transmission",
      "clientType": "transmission",
      "url": "http://seedbox.example.com:9091",
      "username": "user",
      "password": "securepassword",
      "labels": ["linux-isos", "public-domain"], // Example for Transmission
      "addPaused": true
    }
    // ... more server objects
  ],
  "activeServerId": "unique_server_id_1",
  "urlToServerMappings": [
    {
      "id": "mapping_uuid_1", // Unique ID for the mapping rule
      "websitePattern": "example-tracker.com", // User-input string
      "serverId": "unique_server_id_1" // ID of a server from the 'servers' array
    },
    {
      "id": "mapping_uuid_2",
      "websitePattern": "https://specific.site/downloads/",
      "serverId": "unique_server_id_2"
    }
    // ... more mapping rules
  ],
  "enableUrlBasedServerSelection": false,
  "advancedAddDialog": "manual",
  "lastActionStatus": "Torrent X added successfully to Server Y."
}
```

## 4. Development Setup & Technical Constraints
(As previously defined).

## 5. Updated File Structure (Conceptual)
-   `manifest.json`
-   `background.js` (ES Module)
-   `LinkMonitor.js`
-   `api_handlers/`
    -   `api_client_factory.js`
    -   `qbittorrent_handler.js`
    -   `transmission_handler.js`
    -   `deluge_handler.js`
    -   `rutorrent_handler.js`
    -   `... (other client handlers)`
-   `options/`
    -   `options.html`
    -   `options.js`
-   `popup/`
    -   `popup.html`
    -   `popup.js`
-   `confirmAdd/`
    -   `confirmAdd.html`
    -   `confirmAdd.js`
-   `add/`
    -   `add.html`
    -   `add.js`
-   `js/`
    -   `theme.js`
-   `icons/` (if any custom icons are re-added)
-   `memory-bank/` (documentation)
-   `.clinerules`

## 6. Key Technical Challenges & Considerations
-   **Multi-Client API Abstraction:** Designing a robust and maintainable system of API handlers and a factory to manage diverse client APIs (authentication, request/response formats, parameter mapping).
-   **Client-Specific UI in Options:** Dynamically adjusting the server configuration form in `options.html` based on the selected `clientType` to show relevant fields (e.g., SCGI URL for rTorrent, specific auth fields for uTorrent).
-   **Parameter Mapping:** Translating generic extension parameters (tags, category, paused) to client-specific API parameters within each handler. For example, qBittorrent has `tags` and `category`, while Transmission uses a single `labels` array.
-   **Error Handling:** Normalizing diverse error responses from different client APIs into consistent feedback for the user.
-   **Session Management:** Handling various session mechanisms (cookies for Deluge, session IDs for Transmission) reliably within the service worker context, especially with `fetch`.
-   **Permissions:** Ensuring `optional_host_permissions` are requested correctly as users add servers with different URLs.
-   **Data Migration:** Ensuring smooth transition for existing users if storage structure changes significantly (though current changes aim for additive compatibility by defaulting `clientType`).
-   **URL Pattern Matching Logic:** (As before, remains relevant).
-   **Export/Import Logic:** Now needs to handle `clientType` and potentially client-specific fields within the `servers` array.
