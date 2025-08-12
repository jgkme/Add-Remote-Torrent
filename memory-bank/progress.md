# Progress: Add Remote Torrent

## 1. Current Project Status

-   **Overall:** Phase 2 (Adding More Client Support & Refinements) is in progress.
-   **Current Activity:** Incorporating community-contributed improvements and fixing bugs.

## 2. Phased Implementation Plan

---
### **Phase 0: Original qBittorrent WebUI Adder (Completed)**
*Objective: Develop a fully-featured Chrome extension for adding torrents to qBittorrent servers, including multi-server support, advanced add dialog, and URL-based server selection.*
-   **Status:** [X] Completed.

---
### **Phase 1: Multi-Client Architecture Transformation (Completed)**
*Objective: Transform the existing extension into a multi-client torrent adder by refactoring the core architecture to support various torrent client APIs in a modular and extensible way. Update all project documentation.*

-   **Project Setup & Renaming:**
    -   [X] Rename project to "Add Remote Torrent".
    -   [X] Update `manifest.json` with new name, description, and set `background.js` to be an ES module.
    -   [X] Update UI titles in `options.html`, `popup/popup.html`, `confirmAdd/confirmAdd.html`.
    -   [X] Updated `README.md` with new project name.
    -   [X] Updated version to `0.2.9` in `manifest.json` and `package.json`.
-   **API Research & Initial Handler Implementation (qBittorrent, Transmission, Deluge):**
    -   [X] Researched APIs for Deluge and Transmission (provided by user).
    -   [X] Created `api_handlers/` directory.
    -   [X] Implemented `api_handlers/api_client_factory.js`.
    -   [X] Created `api_handlers/qbittorrent_handler.js` (refactored from original `background.js`).
    -   [X] Created `api_handlers/transmission_handler.js`.
    -   [X] Created `api_handlers/deluge_handler.js`.
-   **Core Logic Refactoring (`background.js`):**
    -   [X] Imported `getClientApi` factory.
    -   [X] Refactored `testConnection` message listener to use the API client factory.
    -   [X] Renamed `addTorrentToQb` to `addTorrentToClient`.
    -   [X] Refactored `addTorrentToClient` to:
        -   Use the API client factory and delegate calls.
        -   For non-magnet links, attempt to fetch URL content (with `credentials: 'include'`), check `Content-Type` to identify actual `.torrent` files, base64 encode if applicable, and pass `torrentFileContentBase64` and `originalTorrentUrl` to handlers via `torrentOptions` (improves private tracker support and handles URLs not ending in `.torrent`).
        -   **Stricter Content-Type Check:** Aborts add operation if `Content-Type` is not a recognized torrent type.
    -   [X] Simplified context menu to a single "Add Torrent to Remote WebUI" item; `onClicked` handler now passes all non-magnet links to `addTorrentToClient` for Content-Type based processing.
    -   [X] Removed qBittorrent-specific helper functions from `background.js`.
-   **UI & Data Structure Updates for Multi-Client Support:**
    -   **Options Page (`options.html`, `options.js`):**
        -   [X] Added "Client Type" dropdown to server form.
        -   [X] Updated JS to save/load `clientType` and use generic field names.
        -   [X] Updated `testConnection` to pass full server config; improved error display for connection failures.
        -   [X] Ensured `clientType` is handled in import/export.
        -   [X] Fixed active server item styling in dark mode.
        -   [X] Added footer with version number and developer link placeholder.
        -   [X] Updated exported settings filename to `Add Remote Torrent_settings.json`.
    -   **Popup Page (`popup/popup.html`, `popup.js`):**
        -   [X] Updated HTML and JS to display client type and use generic server fields.
    -   **Data Storage (`chrome.storage.local`):**
        -   [X] Server objects updated for `clientType` and generic field names.
-   **Documentation Update (Memory Bank & Rules):**
    -   [X] Updated `memory-bank/projectbrief.md`.
    -   [X] Updated `memory-bank/productContext.md`.
    -   [X] Updated `memory-bank/systemPatterns.md`.
    -   [X] Updated `memory-bank/techContext.md`.
    -   [X] Updated `memory-bank/activeContext.md`.
    -   [X] Updated this file (`memory-bank/progress.md`).
    -   [X] Updated `.clinerules` with new patterns.
-   **Initial Testing (Post-Refactor):**
    -   [ ] Conduct initial functionality tests for qBittorrent, Transmission, and Deluge (User Action).

---
### **Phase 2: Adding More Client Support & Refinements (Current Focus)**
*Objective: Expand client compatibility by fleshing out placeholder handlers and refine the user experience for multi-client management.*

-   **Dynamic Link Monitoring & Click Handling (via Pull Request):**
    -   [X] Created `LinkMonitor.js` to dynamically detect new links on a page using a `MutationObserver`.
    -   [X] Refactored `content_script.js` to use `LinkMonitor`, making link detection more robust.
    -   [X] Fixed a bug in `content_script.js` where clicking non-torrent links would prevent navigation.
-   **Placeholder Handler Creation & UI Integration (Completed for initial list):**
    -   [X] Created placeholder API handlers for uTorrent, rTorrent, Synology DS, QNAP DS, Kodi Elementum, BitTorrent, Buffalo, Vuze, tTorrent.
    -   [X] Created `rutorrent_handler.js` to support the ruTorrent web front-end.
    -   [X] Integrated these new client types into `api_client_factory.js`.
    -   [X] Added corresponding options to the "Client Type" dropdown in `options.html`.
-   **Client-Specific UI Refinements (In Progress):**
    -   [X] Added "RPC Path" and "Download Locations" fields to `options.html` for Transmission, with dynamic visibility handled in `options.js`.
    -   [X] Updated `transmission_handler.js` to use the configured RPC Path.
    -   [X] Added "SCGI/HTTPRPC URL" field to `options.html` for rTorrent, with dynamic visibility handled in `options.js`.
    -   [X] Updated `rtorrent_handler.js` to use the configured SCGI/HTTPRPC Path.
    -   [X] Added "ruTorrent Relative Path" and other ruTorrent-specific options to `options.html` and `options.js`.
    -   [X] Renamed "rTorrent" to "rTorrent (XML-RPC)" and "ruTorrent" to "ruTorrent (WebUI)" in `options.html` for clarity.
    -   [X] Refined `toggleClientSpecificFields` in `options.js` to dynamically show/hide Username and Password fields and adjust URL/Username labels and placeholders based on `clientType` (e.g., for Deluge, Kodi Elementum, uTorrent).
    -   [X] Added "Categories/Labels" input to `options.html` to define available categories for the advanced add dialog.
    -   [ ] Further refine UI in `options.html` for other client-specific configuration fields as their handlers are developed.
-   **Tracker URL-Based Label/Directory Assignment (New - In Progress):**
    -   [X] Added UI section and form to `options/options.html` for managing tracker URL rules.
    -   [X] Implemented logic in `options/options.js` for CRUD operations, storage, and export/import of `trackerUrlRules`.
    -   [X] Fixed a bug in `options.js` where clearing the label or directory field for a tracker rule would not save the change.
    -   [X] Updated `background.js` (`addTorrentToClient`) to:
        -   Import `bencode` (from the `bencode` npm package).
        -   Refactor rule application into a helper function `applyTrackerRulesLogic`.
        -   If a magnet link is being added, extract tracker URLs from `&tr=` parameters (URI decoded) and pass to `applyTrackerRulesLogic`.
        -   If `.torrent` file content is available, decode it, extract announce URLs (using `TextDecoder`), and pass to `applyTrackerRulesLogic`.
        -   `applyTrackerRulesLogic` matches these URLs against stored `trackerUrlRules`.
        -   Override `torrentOptions.category` (label) and/or `torrentOptions.downloadDir` if a rule matches.
        -   Update success notification to indicate if a tracker rule was applied.
-   **On-Page Link Catching & Modal Feature (New - In Progress):**
    -   [X] Created `content_script.js` with adapted legacy logic for link/form catching and on-page modal trigger.
    -   [X] Updated `manifest.json` to register `content_script.js`.
    -   [X] Updated `background.js` to handle `getStorageData`, `setStorageData`, `pageActionToggle`, adapted `addTorrent` messages, and added `getTorrentAddPreflightInfo` message handler to determine if modal should show and provide server data (including `dirlist`, `labellist`, defaults).
    -   [X] Updated `options.html` and `options.js` to include global settings for on-page link catching and the per-server `askForLabelDirOnPage` flag (UI for this flag was already present).
    -   [X] Updated `content_script.js` to use `getTorrentAddPreflightInfo` and to populate/pre-fill the on-page modal (`rtwa_showLabelDirChooser`) with data from `background.js`.
    -   [X] Fixed a bug in `content_script.js` where `catchfrompage` and `linksfoundindicator` settings were being compared to the string `"true"` instead of the boolean `true`, preventing the feature from activating.
    -   [X] Fixed CSS leaking issue by dynamically injecting/removing CSS in `content_script.js`.
    -   [ ] Further refinement and testing of the on-page modal UI and `setNewSettings` logic in `content_script.js`.
-   **Advanced Add Dialog Enhancements (`confirmAdd/`):**
    -   [X] Added "Select files to download" checkbox and placeholder UI to `confirmAdd.html`.
    -   [X] Updated `confirmAdd.js` to manage visibility of file selection UI (only for non-magnet links).
    -   [X] Integrated `bencode` library (replacing `bencode-js`) and `buffer` polyfill.
    -   [X] Updated `confirmAdd.js` to fetch, parse, display file list, handle "Select/Deselect All", and collect `selectedFileIndices` and `totalFileCount`.
    -   [X] Updated `background.js` to pass `selectedFileIndices` and `totalFileCount` to API handlers via `torrentOptions`, and increased Advanced Add Dialog window width and height.
    -   [X] Updated `confirmAdd/confirmAdd.html` to increase main container `max-width`, adjust scrolling behavior (removed general form scroll, increased file list `max-h`), and removed malformed comments.
    -   [X] Updated `options/options.html` and `popup/popup.html` to remove malformed comments.
    -   [X] Replaced "Show advanced options dialog" checkbox with a dropdown for more granular control.
    -   [X] Refactored `qbittorrent_handler.js`:
        -   File selection: adds torrent paused (if selection active), identifies hash, uses `/torrents/filePrio` endpoint for priorities, conditionally resumes. Prioritizes pre-fetched torrent file content.
        -   API v5.1.0+ Compatibility: Added `Referer` (using full `serverConfig.url`) and `Origin` headers to all requests. Changed login request body to `application/x-www-form-urlencoded` and set appropriate `Content-Type` header. Corrected `getApiUrl` to prevent double slashes. Added detailed logging to `testConnection`. Updated auth failure message to suggest checking CSRF protection.
        -   **Paused State Fix:** Implemented a version check to use the `stopped` parameter instead of `paused` for qBittorrent versions >= 5.1.2, fixing a bug where torrents were not being added in a paused state.
    -   [X] Updated `transmission_handler.js` to implement file selection using the "add paused, get files, set wanted/unwanted files, then optionally resume" workflow. Also updated to prioritize pre-fetched torrent file content.
-   **Flesh out Placeholder Handlers (Next):**
    -   [X] uTorrent: Refined handler for `path` parameter, `testConnection`, `credentials: 'include'`; attempted file selection via post-add `setprops`. Updated to prioritize pre-fetched torrent file content (using `action=add-file`).
    -   [X] BitTorrent: Refined handler (similar to uTorrent) for `path` parameter, `testConnection`, `credentials: 'include'`; file selection logic will mirror uTorrent's attempt. Updated to prioritize pre-fetched torrent file content.
    -   [X] rTorrent: Refined placeholder to use `load.normal`/`load.start` with direct URLs or `load.raw_start`/`load.raw` with pre-fetched base64 content. Acknowledges SCGI path. Basic XML-RPC request/response handling in place.
    -   [X] Transmission: Enhanced to support fetching `.torrent` file URLs (base64 encoded `metainfo`) and implemented file selection logic. (Already handles pre-fetched content well).
    -   [X] Synology Download Station: Updated auth path to `entry.cgi`, default `SYNO.API.Auth` version to `6`, default `SYNO.DownloadStation.Task` version to `3`. `makeSynologyApiRequest` now uses specific CGI paths for different APIs (e.g., `DownloadStation/task.cgi`). `testConnection` logs API versions. (File content upload TBD).
    -   [X] QNAP Download Station: Refined auth logic to target `/cgi-bin/authLogin.cgi` and use `user`/`pwd` params, with extensive comments on API uncertainties. (File content upload TBD).
    -   [X] Deluge: Refined `testConnection` to use `auth.check_session` and implemented file selection logic (add paused, set priorities, conditionally resume). Updated to prioritize pre-fetched torrent file content (using `core.add_torrent_file`).
    -   [X] Kodi Elementum: Refined `params` string for `Addons.ExecuteAddon`. (Auth was already basic).
    -   [X] Buffalo Torrent Client: Refined handler to mirror uTorrent structure with `dir` param and CSRF token logic.
    -   [X] Vuze: Refined handler to mirror Transmission RPC structure and auth.
    -   [X] tTorrent: Refined placeholder for `POST /api/add` with FormData.
    -   [ ] Further API investigation and implementation needed for full functionality of Buffalo, Vuze, tTorrent, and robust XML-RPC for rTorrent.
-   **Error Handling & Feedback:**
    -   [X] Standardized error object structure (`{ success: false, error: { userMessage, technicalDetail, errorCode } }`) across all API handlers.
    -   [X] Updated `background.js` (`addTorrentToClient`) to process standardized error objects for user notifications.
    -   [X] Updated `chrome.notifications.create` calls in `background.js` to use `.png` icons instead of `.svg` and added detailed logging (including `chrome.runtime.lastError` checks) to help debug notification display issues.
    -   [X] Implemented sound notifications for success/failure using Offscreen API:
        -   Created `offscreen_audio.html` and external `offscreen_audio.js` (to comply with CSP).
        -   Updated `background.js` with robust `offscreenDocumentManager` and "ready" handshake.
        -   Updated `manifest.json`, `options.html`, `options.js`, `webpack.config.js`.
        -   Uses `.mp3` files (to be provided by user).
    -   [ ] Further enhance specificity of error messages and user feedback based on testing.
-   **UI/UX Enhancements (Tailwind CSS):**
    -   [X] Implemented "Add torrent by clicking the extension icon" feature with a new dialog.
    -   [X] Added "Open WebUI" button to the server list in the options page.
    -   [X] Rewrote `options/options.html` with Tailwind CSS and removed `options.css`.
    -   [X] Rewrote `popup/popup.html` with Tailwind CSS and removed `popup.css`.
    -   [X] Rewrote `confirmAdd/confirmAdd.html` with Tailwind CSS and removed `confirmAdd.css`.
    -   [X] Updated dynamic modal HTML in `content_script.js` to use Tailwind CSS classes.
    -   [X] Updated `options.js` (`renderServerList` function) to apply Tailwind CSS classes for improved server list item formatting (including fix for active server item in dark mode); improved error display for connection tests.
    -   [X] Tailwind CSS processing now integrated into Webpack build.
    -   [X] Changed Tailwind `darkMode` strategy to `'class'`. Inline dark mode script moved to external `js/theme.js` and linked in HTMLs to resolve CSP issues. `manifest.json` CSP hash removed, `js/theme.js` added to `web_accessible_resources`.
    -   [X] Updated `tailwind.config.js` to extend the `zIndex` utility, adding `z-9999` for modal layering.
-   **Build Process (Webpack):**
    -   [X] Added Webpack and related dev dependencies (`webpack-cli`, `babel-loader`, etc.) to `package.json`.
    -   [X] Created `webpack.config.js` for bundling, transpiling, CSS processing, asset copying (including `js/theme.js`), and minification. `webpack.config.js` updated to copy `js/theme.js`.
    -   [X] Updated `package.json` scripts (`dev`, `build`) to use Webpack.
    -   [X] Added `zip-a-folder` and `scripts/zip.js` to automate zipping of the `dist` folder after `pnpm build`.
    -   [X] Updated HTML files to link to Webpack-generated CSS path (`../css/tailwind.css`).
-   **Testing:**
    -   [ ] Conduct thorough testing for each newly completed client handler.
-   **Documentation:**
    -   [ ] Update Memory Bank and `.clinerules` as new clients are fully implemented and new patterns emerge.

---
### **Phase 3: Advanced Features & Polish (Future)**
*Objective: Introduce advanced client-specific options and further polish the overall extension.*
(Tasks remain as previously defined)
-   [ ] Consider client-specific advanced options in the "Advanced Add Dialog".
-   [ ] Further UI/UX improvements based on multi-client usage patterns and feedback.
-   [ ] Comprehensive testing across all supported clients and browsers.
-   [ ] Final review of all documentation.

## 3. Known Issues & Blockers
(Remains largely the same, with emphasis on placeholder handlers)
-   **Icon Loading:** Low priority.
-   **Cookie Management in Service Workers:** Needs monitoring, especially for Deluge.
-   **Client-Specific Field Variations:** Ongoing task as new clients are fully implemented.
-   **Placeholder Handler Functionality:** Many handlers (rTorrent, Buffalo, Vuze, tTorrent) are very basic and require significant work or API discovery to become functional.
-   **rTorrent Handler XML Complexity:** The syntax issue in `rtorrent_handler.js`'s `escapeXml` helper function has been manually resolved by the user. However, robust XML-RPC handling (full parsing/construction) for rTorrent remains a significant task.

## 4. Milestones (New Phased Approach)

-   **Milestone 0 (Original Project Complete):** qBittorrent WebUI Adder.
    -   **Status:** [X] Complete
-   **Milestone 1 (Multi-Client Architecture Foundation):** Phase 1 tasks completed.
    -   **Status:** [X] Complete (Pending user testing of qBit, Transmission, Deluge)
-   **Milestone 2 (Expanded Client Support):** Phase 2 tasks, focusing on implementing full support for placeholder clients and UI refinements.
    -   **Status:** [ ] In Progress
-   **Milestone 3 (Full Feature Set & Polish):** Phase 3 tasks.
    -   **Status:** [ ] Not Started
