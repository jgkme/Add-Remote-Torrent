# Active Context: Add Remote Torrent

## 1. Current Work Focus

-   **Phase:** Phase 2: New Feature Implementation & Bug Fixes.
-   **Activity:** Adding support for new torrent clients and implementing a major new context menu feature.
-   **Objective:** Expand client compatibility and enhance user workflow by providing direct access to download directories from the context menu.

## 2. Recent Changes & Decisions

-   **uTorrent Handler Overhaul (v0.3.17):**
    -   **Fix:** Implemented a comprehensive fix for uTorrent connectivity issues. The handler now correctly uses a user-configurable "Relative Path" for all API requests, including token fetching and connection testing.
    -   **Fix:** The connection test was changed to use the more reliable `getsettings` API call instead of `gettorrents`.
    -   **UX:** The options page now auto-detects a path in the server URL and moves it to the "Relative Path" field to simplify configuration.
    -   **UX:** The "Open WebUI" buttons in both the options page and the popup now correctly construct the URL using the base URL and the relative path.

-   **Context Menu Feature (v0.3.18):**
    -   **Feature:** Added a new global setting, "Show download directories in context menu," to give users explicit control over this feature.
    -   **Feature:** Implemented a nested context menu structure (`Server -> Directory`) that allows users to add torrents directly to a predefined download location in a single click.
    -   **Fix:** Corrected a bug where the context menu would fail to build if a server had no download directories defined.
    -   **Fix:** Added error handling to `content_script.js` to prevent "context invalidated" errors that occurred on dynamic pages like YouTube.

-   **Code Refactoring:**
    -   Replaced all instances of the old "RTWA" (Remote Torrent Web Adder) acronym with "ART" (Add Remote Torrent) in user-facing logs and comments to reflect the current project name.

## 3. Next Steps (High-Level Plan)

1.  **Add New Clients:**
    -   Research the APIs for BiglyBT, Flood, and Porla.
    -   Implement new API handlers for each client in the `api_handlers/` directory.
    -   Update the client dropdown list in `options/options.html`.
    -   Add any necessary client-specific fields and logic to the options page.
2.  **Update Documentation:**
    -   Update the `README.md` and all `memory-bank/` files to include the new clients and any new technical patterns that emerge.
3.  **Release:**
    -   Commit the new client implementations.
    -   Increment the version number.
    -   Build and release the new version with the added clients.

## 4. Active Decisions & Considerations

-   The context menu implementation now uses nested submenus, which is a more robust and user-friendly approach than the previously considered conditional logic.
-   A dedicated option was added for the context menu directory feature to provide clear and direct control, rather than overloading an existing setting.

## 5. Open Questions/To Discuss
-   What are the specific API endpoints and authentication methods for Porla? (Requires research).
-   Does the Flood API (jesec) require any special handling or session management? (Requires research).
-   BiglyBT appears to be a fork of Vuze. How similar is its API? Will the existing Vuze handler work as a base? (Requires research).
