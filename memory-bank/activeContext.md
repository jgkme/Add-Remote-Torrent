# Active Context: Remote Torrent WebUI Adder via Browser

## 1. Current Work Focus

-   **Phase:** Phase 1: Multi-Client Architecture Transformation.
-   **Activity:** Implementing core architectural changes to support multiple torrent clients. Updating documentation.
-   **Objective:** Establish a modular and extensible foundation for adding various torrent client APIs, and update all project documentation to reflect the new scope and architecture.

## 2. Recent Changes & Decisions

-   **Project Renaming:** Project officially renamed to "Remote Torrent WebUI Adder via Browser". `manifest.json` and UI titles updated.
-   **ES Module for Background Script:** `manifest.json` updated to set `background.js` type to `module`.
-   **API Handler Architecture:**
    -   Created `api_handlers/` directory.
    -   Implemented `api_handlers/api_client_factory.js` to dynamically load client-specific handlers.
    -   Created initial API handlers for qBittorrent, Transmission, Deluge (functional).
    -   Created and refined placeholder API handlers for uTorrent, rTorrent, Synology Download Station, QNAP Download Station, Kodi Elementum, BitTorrent, Buffalo Torrent, Vuze, and tTorrent based on new API documentation (authentication and core methods).
    -   Simplified `rtorrent_handler.js` `addTorrent` method to primarily use `load.start`/`load.normal` with direct torrent URLs (magnet or .torrent file URL), deferring base64 content upload and complex on-add commands for now.
    -   Updated `transmission_handler.js`:
        -   To support fetching `.torrent` file URLs, base64 encoding, and sending via `metainfo`.
        -   Implemented file selection for `.torrent` files using the "add paused, get files, set wanted/unwanted files, then optionally resume" workflow. This includes a new `makeRpcCall` helper.
    -   Updated `deluge_handler.js` to implement file selection for `.torrent` files:
        -   Adds torrent paused (if file selection active).
        -   Uses torrent ID from add response.
        -   Calls `core.set_torrent_options` with `file_priorities` (0 for deselected, 1 for selected).
        -   Conditionally resumes torrent based on user's original preference.
    -   Updated `utorrent_handler.js` (and by extension `bittorrent_handler.js`) to attempt file selection:
        -   Parses hash from magnet links.
        -   Placeholder for fetching/parsing `.torrent` files to get hash (currently warns about complexity).
        -   If hash is available, iterates through files calling `action=setprops` to set priorities (0 for deselected, 2 for normal).
        -   Attempts to set paused/started state post-add. Reliability depends on hash availability.
    -   Standardized error object structure (`{ success: false, error: { userMessage, technicalDetail, errorCode } }`) across all API handlers.
    -   Updated `qbittorrent_handler.js` to implement a new file selection strategy:
        -   Torrent is added paused (if file selection is active).
        -   The handler attempts to identify the new torrent's hash by comparing torrent lists before and after adding.
        -   Uses the `/api/v2/torrents/filePrio` endpoint to set priorities for selected (normal) and deselected (do not download) files.
        -   Conditionally resumes the torrent if the user did not originally intend for it to be paused.
        -   The direct use of `filePrio` during the initial `torrents/add` call was found to be unreliable for setting "do not download" status.
-   **`background.js` Refactoring:**
    -   Imported `getClientApi` factory.
    -   Modified `testConnection` message listener to use the factory and delegate to client handlers.
    -   Renamed `addTorrentToQb` to `addTorrentToClient`.
    -   Refactored `addTorrentToClient` to use the factory, delegate API calls, process standardized error objects for notifications, and pass `selectedFileIndices` and `totalFileCount` (from Advanced Add Dialog) to API handlers via `torrentOptions`.
    -   Simplified context menu to a single "Add Torrent to Remote WebUI" item (`id: "addTorrentGeneric"`) that appears on all links. The `onClicked` handler now determines if the link is a magnet or `.torrent` file URL and processes accordingly, or notifies if the link type is unrecognized.
    -   Removed qBittorrent-specific `getApiUrl` function.
-   **Options Page UI & Logic (`options.html`, `options.js`):**
    -   Added "Client Type" dropdown to the server configuration form.
    -   Updated JavaScript to save and load `clientType` with server profiles.
    -   Modified `testConnection` logic to send full server config (including `clientType`) to `background.js`.
    -   Added "RPC Path" field for Transmission servers and "SCGI/HTTPRPC URL" for rTorrent servers, with dynamic visibility in options.
    -   Updated `transmission_handler.js` and `rtorrent_handler.js` to use these specific path configurations (rTorrent handler also refined to use `load.normal`/`load.start` based on paused state).
    -   Refined `utorrent_handler.js` and `bittorrent_handler.js` for `path` parameter, `testConnection` logic, and added `credentials: 'include'` for cookie handling.
    -   Refined `deluge_handler.js` `testConnection` to use `auth.check_session` and added `credentials: 'include'` for cookie handling.
    -   Refined `synology_download_station_handler.js` to use API version '2' for auth by default.
    -   Refined `qnap_download_station_handler.js` authentication logic to target `/cgi-bin/authLogin.cgi` and use `user`/`pwd` params.
    -   Refined `kodi_elementum_handler.js` params string for `Addons.ExecuteAddon`.
    -   Refined `buffalo_torrent_handler.js` to mirror uTorrent structure with `dir` param and `credentials: 'include'`.
    -   Refined `vuze_handler.js` to mirror Transmission RPC structure (which includes session ID header, basic auth).
    -   Refined `ttorrent_handler.js` placeholder for `POST /api/add` and basic auth.
    -   Updated variable names and labels to be more generic (e.g., `serverUrlInput` instead of `qbUrlInput`).
    -   Ensured `clientType` is handled in import/export and defaults correctly if missing from old data.
    -   Fixed active server item styling in dark mode by removing conflicting `background-color` from inline CSS, relying on Tailwind classes from JS.
    -   Added a footer to `options.html` to display extension version and a placeholder developer link; `options.js` updated to populate version.
-   **Popup UI & Logic (`popup/popup.html`, `popup.js`):**
    -   Updated HTML to display "Client Type" for the active server.
    -   Updated JavaScript to display `clientType` and use generic `server.url`.
-   **Content Script for On-Page Link Catching & Modal (New Feature):**
    -   Created `content_script.js` based on provided legacy code, adapted for Manifest V3.
    -   Updated `manifest.json` to register `content_script.js` for `<all_urls>`.
    -   Modified `background.js` to handle new messages from content script:
        -   `getStorageData`: Provides necessary settings to content script.
        -   `setStorageData`: Allows content script to update server-specific `dirlist`/`labellist`.
        -   `pageActionToggle`: Logs request (actual icon change TBD).
        -   `addTorrent`: Adapted to receive `label`, `dir`, and `server` object from content script's modal.
        -   `getTorrentAddPreflightInfo`: New message handler in `background.js` to determine target server for a caught link, check its `askForLabelDirOnPage` flag, and respond to content script with whether to show the modal and relevant server info (including `dirlist`, `labellist`, `defaultDir`, `defaultLabel`).
    -   Updated `content_script.js`:
        -   When a link is caught, it now sends `getTorrentAddPreflightInfo` to `background.js`.
        -   Based on the response, it either calls `rtwa_showLabelDirChooser` (if modal should be shown) or relies on background script for direct add.
        -   `rtwa_showLabelDirChooser` updated to use `serverInfo` from preflight response to parse `dirlist`/`labellist` and pre-fill/pre-select modal inputs.
        -   `setNewSettings` in content script updated to use `targetServerId` for updating correct server's lists.
    -   Updated `options.html` and `options.js` to include new global settings for on-page link catching (`catchfrompage`, `linksfoundindicator`, `linkmatches`, `registerDelay`). (Note: UI for per-server `askForLabelDirOnPage` flag was already present).
-   **Memory Bank & `.clinerules` Update:**
    -   All core Memory Bank files (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`) updated.
    -   `.clinerules` updated with new patterns including placeholder handler strategy and client-specific path handling.
-   **UI/UX Enhancement (Tailwind CSS):**
    -   Rewrote `options/options.html` using Tailwind CSS classes for a modern, responsive design, emulating shadcn/ui aesthetics. Removed `options.css`.
    -   Rewrote `popup/popup.html` using Tailwind CSS, ensuring responsiveness and a clean look for the popup. Removed `popup.css`.
    -   Rewrote `confirmAdd/confirmAdd.html` (Advanced Add Dialog) using Tailwind CSS. Removed `confirmAdd.css`.
    -   Updated the dynamically generated HTML for the on-page modal in `content_script.js` (`rtwa_showLabelDirChooser` function) to use Tailwind CSS classes instead of inline styles.
    -   Updated `options.js` (`renderServerList` function) to apply Tailwind CSS classes for improved formatting of the server list items.
    -   Tailwind CSS processing is now integrated into the Webpack build process.
    -   Changed Tailwind `darkMode` strategy to `'class'` in `tailwind.config.js`.
    -   Added inline JavaScript to `options.html`, `popup.html`, and `confirmAdd.html` to toggle the `dark` class on `document.documentElement` based on OS preference, to fix dark mode styling issues.
-   **Build Process (Webpack):**
    -   Installed Webpack and related dependencies (`webpack-cli`, `babel-loader`, `@babel/core`, `@babel/preset-env`, `css-loader`, `postcss-loader`, `mini-css-extract-plugin`, `copy-webpack-plugin`, `terser-webpack-plugin`).
    -   Created `webpack.config.js` to handle:
        -   JS bundling and transpilation for all entry points (`background.js`, `content_script.js`, `options.js`, `popup.js`, `confirmAdd.js`).
        -   CSS processing (including Tailwind) via `postcss-loader`, extracting to `dist/css/tailwind.css`.
        -   Copying static assets (HTML files, `manifest.json`, `icons/`) to the `dist` folder.
        -   JS minification in production mode.
        -   Cleaning the `dist` folder before builds.
    -   Updated `package.json` scripts to use Webpack (`pnpm dev` for development, `pnpm build` for production).
    -   Added `zip-a-folder` dependency and a `scripts/zip.js` Node script to automate zipping the `dist` folder contents.
    -   The `pnpm build` script now also runs the zipping script after Webpack completes, creating `[extension-name]-v[version].zip`.
    -   Updated CSS links in HTML files to point to the Webpack-generated CSS path (`../css/tailwind.css`).
-   **Advanced Add Dialog Enhancements (`confirmAdd/`):**
    -   Added a "Select files to download" checkbox and a placeholder area for the file list to `confirmAdd.html`.
    -   Updated `confirmAdd.js` to show the file selection section only for non-magnet links and to toggle the file list placeholder visibility.
    -   Integrated `bencode` library (replacing `bencode-js`) and `buffer` polyfill for parsing `.torrent` files.
    -   Updated `confirmAdd.js` to fetch, parse (using `bencode`), and dynamically display the list of files (with names, sizes, and checkboxes) from a `.torrent` file when file selection is enabled. Includes "Select All"/"Deselect All" buttons.
    -   Logic added to `confirmAdd.js` to collect selected file indices and `totalFileCount`, passing them to `background.js`.
    -   Increased default width and height of the Advanced Add Dialog window (`background.js`).
    -   Adjusted layout in `confirmAdd/confirmAdd.html`: increased main container `max-width`, removed general form section scrollability, and increased `max-h` for the specific file list container to improve display and reduce multiple scrollbars.
-   **Version Update:**
    -   Updated extension version to `0.2.1` in `manifest.json` and `package.json`.

## 3. Next Steps (High-Level Plan)

1.  **Phase 1 - Multi-Client Architecture Transformation: COMPLETED.**
    -   Initial testing of qBittorrent, Transmission, and Deluge functionality is now pending user action.
2.  **Begin Phase 2 - Adding More Client Support & Refinements:**
    -   **Implement On-Page Modal:** Develop the `rta_modal_init` function (currently a placeholder in `content_script.js`) to create and manage the on-page dialog for selecting label/directory.
    -   **Integrate Server-Side "Ask" Flags:** Add UI in `options.js` for users to set per-server flags (e.g., `askForLabelDirOnPage`) that the content script will use to decide whether to show the modal.
    -   **Flesh out Placeholder Handlers:** Continue implementing full functionality for placeholder API handlers.
    -   **Refine Client-Specific UI:** Continue refining `options.html` for client-specific fields.
    -   **Enhance Error Handling:** Improve error handling across the extension.
    -   **Iterative Testing:** Conduct thorough testing for each newly completed client handler.
3.  **Address any further feedback and continue iterative development.**

## 4. Active Decisions & Considerations

-   **Parameter Mapping:** The `torrentOptions` object in `addTorrentToClient` (background.js) and the individual handlers needs careful management to map generic concepts (tags, category) to client-specific fields (e.g., `labels` for Transmission/Deluge). This is handled within each client handler.
-   **Session Management in Handlers:** Specific session/cookie/token management (e.g., Deluge cookie, Transmission session ID) is encapsulated within each respective handler. The reliability of cookie handling in service workers for `fetch` is a known area to monitor.
-   **Error Normalization:** All API client handlers now return a standardized error object (`{ success: false, error: { userMessage, technicalDetail, errorCode } }`). `background.js` (`addTorrentToClient`) has been updated to process this structure for creating user-friendly notifications.
-   **Icons Issue Status:** Persists from previous version; default icon used. Not a priority for current architectural changes.
-   **rTorrent Handler XML Complexity:** The syntax issue in `rtorrent_handler.js`'s `escapeXml` helper function has been manually resolved by the user. However, full, robust XML-RPC communication for rTorrent (including comprehensive parameter type handling and XML response parsing) still requires a more dedicated strategy, potentially a lightweight library or more advanced manual XML processing. This handler needs significant future work to be fully functional.

## 5. Open Questions/To Discuss
-   None currently; focusing on completing Phase 1 documentation and testing.
