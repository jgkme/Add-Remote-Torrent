# Progress: Remote Torrent WebUI Adder via Browser

## 1. Current Project Status

-   **Overall:** Phase 1 (Multi-Client Architecture Transformation) is complete. Starting Phase 2 (Adding More Client Support & Refinements).
-   **Current Activity:** Beginning implementation of more detailed client handlers and UI refinements for client-specific options.

## 2. Phased Implementation Plan

---
### **Phase 0: Original qBittorrent WebUI Adder (Completed)**
*Objective: Develop a fully-featured Chrome extension for adding torrents to qBittorrent servers, including multi-server support, advanced add dialog, and URL-based server selection.*
-   **Status:** [X] Completed.

---
### **Phase 1: Multi-Client Architecture Transformation (Completed)**
*Objective: Transform the existing extension into a multi-client torrent adder by refactoring the core architecture to support various torrent client APIs in a modular and extensible way. Update all project documentation.*

-   **Project Setup & Renaming:**
    -   [X] Rename project to "Remote Torrent WebUI Adder via Browser".
    -   [X] Update `manifest.json` with new name, description, and set `background.js` to be an ES module.
    -   [X] Update UI titles in `options.html` and `popup.html`.
    -   [X] Updated version to `0.2.1` in `manifest.json` and `package.json`.
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
    -   [X] Refactored `addTorrentToClient` to use the API client factory and delegate calls.
    -   [X] Simplified context menu to a single "Add Torrent to Remote WebUI" item; `onClicked` handler determines link type (magnet or .torrent).
    -   [X] Removed qBittorrent-specific helper functions from `background.js`.
-   **UI & Data Structure Updates for Multi-Client Support:**
    -   **Options Page (`options.html`, `options.js`):**
        -   [X] Added "Client Type" dropdown to server form.
        -   [X] Updated JS to save/load `clientType` and use generic field names.
        -   [X] Updated `testConnection` to pass full server config.
        -   [X] Ensured `clientType` is handled in import/export.
        -   [X] Fixed active server item styling in dark mode.
        -   [X] Added footer with version number and developer link placeholder.
    -   **Popup Page (`popup.html`, `popup.js`):**
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

-   **Placeholder Handler Creation & UI Integration (Completed for initial list):**
    -   [X] Created placeholder API handlers for uTorrent, rTorrent, Synology DS, QNAP DS, Kodi Elementum, BitTorrent, Buffalo, Vuze, tTorrent.
    -   [X] Integrated these new client types into `api_client_factory.js`.
    -   [X] Added corresponding options to the "Client Type" dropdown in `options.html`.
-   **Client-Specific UI Refinements (In Progress):**
    -   [X] Added "RPC Path" field to `options.html` for Transmission, with dynamic visibility handled in `options.js`.
    -   [X] Updated `transmission_handler.js` to use the configured RPC Path.
    -   [X] Added "SCGI/HTTPRPC URL" field to `options.html` for rTorrent, with dynamic visibility handled in `options.js`.
    -   [X] Updated `rtorrent_handler.js` to use the configured SCGI/HTTPRPC Path.
    -   [ ] Further refine UI in `options.html` for other client-specific configuration fields as their handlers are developed.
-   **On-Page Link Catching & Modal Feature (New - In Progress):**
    -   [X] Created `content_script.js` with adapted legacy logic for link/form catching and on-page modal trigger.
    -   [X] Updated `manifest.json` to register `content_script.js`.
    -   [X] Updated `background.js` to handle `getStorageData`, `setStorageData`, `pageActionToggle`, adapted `addTorrent` messages, and added `getTorrentAddPreflightInfo` message handler to determine if modal should show and provide server data (including `dirlist`, `labellist`, defaults).
    -   [X] Updated `options.html` and `options.js` to include global settings for on-page link catching and the per-server `askForLabelDirOnPage` flag (UI for this flag was already present).
    -   [X] Updated `content_script.js` to use `getTorrentAddPreflightInfo` and to populate/pre-fill the on-page modal (`rtwa_showLabelDirChooser`) with data from `background.js`.
    -   [ ] Further refinement and testing of the on-page modal UI and `setNewSettings` logic in `content_script.js`.
-   **Advanced Add Dialog Enhancements (`confirmAdd/`):**
    -   [X] Added "Select files to download" checkbox and placeholder UI to `confirmAdd.html`.
    -   [X] Updated `confirmAdd.js` to manage visibility of file selection UI (only for non-magnet links).
    -   [X] Integrated `bencode` library (replacing `bencode-js`) and `buffer` polyfill.
    -   [X] Updated `confirmAdd.js` to fetch, parse, display file list, handle "Select/Deselect All", and collect `selectedFileIndices` and `totalFileCount`.
    -   [X] Updated `background.js` to pass `selectedFileIndices` and `totalFileCount` to API handlers via `torrentOptions`, and increased Advanced Add Dialog window width and height.
    -   [X] Updated `confirmAdd/confirmAdd.html` to increase main container `max-width`, adjust scrolling behavior (removed general form scroll, increased file list `max-h`), and removed malformed comments.
    -   [X] Updated `options/options.html` and `popup/popup.html` to remove malformed comments.
    -   [X] Refactored `qbittorrent_handler.js` file selection: adds torrent paused (if selection active), then identifies hash, then uses `/torrents/filePrio` endpoint to set priorities, then conditionally resumes. Direct `filePrio` on add was unreliable.
    -   [X] Updated `transmission_handler.js` to implement file selection using the "add paused, get files, set wanted/unwanted files, then optionally resume" workflow.
-   **Flesh out Placeholder Handlers (Next):**
    -   [X] uTorrent: Refined handler for `path` parameter, `testConnection`, `credentials: 'include'`; attempted file selection via post-add `setprops` (hash retrieval for `.torrent` URLs is a known challenge).
    -   [X] BitTorrent: Refined handler (similar to uTorrent) for `path` parameter, `testConnection`, `credentials: 'include'`; file selection logic will mirror uTorrent's attempt.
    -   [X] rTorrent: Refined placeholder to use `load.normal`/`load.start` with direct URLs, acknowledge SCGI path. Basic XML-RPC request/response handling in place. (Auth was already basic). Base64 content upload deferred.
    -   [X] Transmission: Enhanced to support fetching `.torrent` file URLs (base64 encoded `metainfo`) and implemented file selection logic.
    -   [X] Synology Download Station: Refined auth API version to '2' by default. Core logic was mostly aligned.
    -   [X] QNAP Download Station: Refined auth logic to target `/cgi-bin/authLogin.cgi` and use `user`/`pwd` params, with extensive comments on API uncertainties.
    -   [X] Deluge: Refined `testConnection` to use `auth.check_session` and implemented file selection logic (add paused, set priorities, conditionally resume).
    -   [X] Kodi Elementum: Refined `params` string for `Addons.ExecuteAddon`. (Auth was already basic).
    -   [X] Buffalo Torrent Client: Refined handler to mirror uTorrent structure with `dir` param and CSRF token logic.
    -   [X] Vuze: Refined handler to mirror Transmission RPC structure and auth.
    -   [X] tTorrent: Refined placeholder for `POST /api/add` with FormData.
    -   [ ] Further API investigation and implementation needed for full functionality of Buffalo, Vuze, tTorrent, and robust XML-RPC for rTorrent.
-   **Error Handling & Feedback:**
    -   [X] Standardized error object structure (`{ success: false, error: { userMessage, technicalDetail, errorCode } }`) across all API handlers.
    -   [X] Updated `background.js` (`addTorrentToClient`) to process standardized error objects for user notifications.
    -   [ ] Further enhance specificity of error messages and user feedback based on testing.
-   **UI/UX Enhancements (Tailwind CSS):**
    -   [X] Rewrote `options/options.html` with Tailwind CSS and removed `options.css`.
    -   [X] Rewrote `popup/popup.html` with Tailwind CSS and removed `popup.css`.
    -   [X] Rewrote `confirmAdd/confirmAdd.html` with Tailwind CSS and removed `confirmAdd.css`.
    -   [X] Updated dynamic modal HTML in `content_script.js` to use Tailwind CSS classes.
    -   [X] Updated `options.js` (`renderServerList` function) to apply Tailwind CSS classes for improved server list item formatting (including fix for active server item in dark mode).
    -   [X] Tailwind CSS processing now integrated into Webpack build.
    -   [X] Changed Tailwind `darkMode` strategy to `'class'` and added JS to HTML files to manage the `dark` class on `document.documentElement` for robust dark mode.
-   **Build Process (Webpack):**
    -   [X] Added Webpack and related dev dependencies (`webpack-cli`, `babel-loader`, etc.) to `package.json`.
    -   [X] Created `webpack.config.js` for bundling, transpiling, CSS processing, asset copying, and minification.
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
