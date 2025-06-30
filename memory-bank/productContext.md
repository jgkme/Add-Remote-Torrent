# Product Context: Add Remote Torrent

## 1. Problem Statement

Users who frequently download torrents often find it cumbersome to switch between their browser and their torrent client, especially if they use multiple torrent clients or multiple instances of the same client (e.g., a local qBittorrent and a remote Deluge seedbox). Managing different server settings (including client type, URL, credentials), default torrent parameters (like tags, categories, or initial paused state, which vary by client) for each server, and manually choosing the correct server for torrents from specific websites adds layers of complexity and repetitive effort.

## 2. Solution

This Chrome extension aims to streamline the process of adding torrents to one or more torrent client servers, supporting a variety of popular clients. By integrating directly into the browser, users can:
-   Configure and manage multiple server profiles for different torrent client types (e.g., qBittorrent, Transmission, Deluge).
-   Select a "default active" server for adding torrents.
-   Optionally, define rules to automatically select a specific server based on the URL of the website where the torrent link is found.
-   Define per-server defaults for parameters like tags, categories, and initial paused state, tailored to what each client supports.
-   Send magnet links or .torrent file URLs to the appropriate torrent client with a single click via a context menu option, using the server's defaults.
-   Optionally, for advanced users, enable a feature to modify these parameters on-the-fly for each torrent before it's added.
-   Optionally, add torrents by pasting URLs directly into the extension's popup.
-   Optionally, export and import all server configurations and settings for backup or easy setup on other devices.

This significantly reduces manual effort, improves workflow efficiency, and provides flexibility for different user needs, including automated server selection for specific sites across various torrent clients.

## 3. Target User

-   Regular users of supported torrent clients (qBittorrent, Transmission, Deluge, etc.) who download torrents frequently.
-   Users who manage multiple torrent servers, potentially of different client types (e.g., local and remote, or different clients for different purposes).
-   Users who download from specific sites and want to route those torrents to particular servers (regardless of client type) automatically.
-   Users who want a more integrated and efficient way to manage their downloads with specific default parameters, adapted to their chosen client(s).
-   Users comfortable with installing and configuring browser extensions, ranging from those who prefer simplicity to those who desire fine-grained control and automation.

## 4. How It Should Work (Expanded)

1.  **Configuration (Options Page):**
    *   **Server Management:** Users can add, edit, and delete server profiles. Each profile includes:
        *   Server Name (user-defined).
        *   Client Type (dropdown: qBittorrent, Transmission, Deluge, etc.).
        *   Server URL.
        *   Credentials (username, password, as applicable to the client type).
        *   Default parameters (e.g., Tags/Labels, Category, Paused State), with fields dynamically shown/relevant based on client type.
        *   Test Connection button (validates against the specific client API).
    *   **URL-to-Server Mappings:**
        *   A section to define rules: Website URL Pattern (domain/prefix) -> Target Server ID.
        *   Users can add, edit, delete, and reorder these rules (order determines priority: first match wins).
    *   **Global Settings:**
        *   Toggle to enable/disable "URL-Based Server Selection" (default: disabled).
        *   Toggle to enable/disable the "Advanced Add Dialog" (default: disabled).
    *   **Export/Import:** Buttons for exporting/importing all server configurations and URL-to-Server mappings.

2.  **Active Server Selection & Determination:**
    *   **Manual Default (Popup):** The popup displays a dropdown menu listing all configured server names (and potentially their client type for clarity). The user selects a server here to set it as the "default active" server. This selection is remembered.
    *   **Automatic (URL-Based, if enabled):** When a torrent is added via context menu:
        *   If "URL-Based Server Selection" is enabled, the extension checks the current page's URL against the defined mapping rules.
        *   If a rule matches, the server specified in that rule is used for this specific torrent addition.
        *   If no rule matches, or if the feature is disabled, the "default active" server (selected in the popup) is used.
    *   The popup also shows details of the "default active" server and the status of the last action.
    *   A "Clear Last Action Status" button (Phase 2).
    -   An optional input field to manually paste a magnet/torrent URL and an "Add" button (Phase 2). (Manual adds via popup would likely use the "default active" server, or could also respect URL rules if the current tab's URL is considered).

3.  **Adding Torrents (Context Menu / Popup Manual Add):**
    *   The target server is determined (manual default or URL-based rule).
    *   **If "Advanced Add Dialog" is DISABLED (Default):**
        *   The link is sent to the determined target server using its pre-configured default tags, category, and paused state.
    *   **If "Advanced Add Dialog" is ENABLED:**
        *   A dialog appears, pre-filled with the determined target server's name and its defaults for tags, category, paused state.
        *   User can modify these parameters for this specific torrent.
        *   "Confirm Add" sends to the target server with (potentially modified) parameters.

4.  **Feedback:**
    *   Clear browser notifications for success or failure, indicating which server (and its client type) the torrent was sent to (and if a URL rule was applied).
    *   Status messages within the popup and options page.

## 5. User Experience Goals

-   **Simplicity (Default):** For users who want quick, one-click adding with pre-set defaults to a manually selected active server.
-   **Automation (Optional):** For users who want torrents from specific sites to automatically go to designated servers.
-   **Flexibility (Optional):** For advanced users who want per-torrent control over parameters.
-   **Efficiency:** Significantly reduce steps for adding torrents, especially with multiple servers and site-specific routing.
-   **Clarity:** Easy to understand which server is active/targeted and what settings are being applied.
-   **Reliability, Security, Lightweight:** (As previously defined).

## 6. Key Features from User Perspective

-   Manage multiple server profiles for various torrent clients (qBittorrent, Transmission, Deluge, etc.) with per-server, client-specific defaults.
-   Manually select a default active server via popup.
-   (Optional) Automate server selection based on website URL rules, irrespective of client type.
-   "One-click" torrent adding using appropriate server defaults, handled by the correct client API.
-   (Optional) Advanced dialog to customize parameters (relevant to the target client) for each torrent before adding.
-   Manual URL input via popup.
-   Export/Import all server configurations (multi-client) and URL mappings.
-   Clear notifications and status updates, indicating target server and client type.
