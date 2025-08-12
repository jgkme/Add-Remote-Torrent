# Active Context: Add Remote Torrent

## 1. Current Work Focus

-   **Phase:** Phase 2: Refinements and Bug Fixes.
-   **Activity:** Incorporating community-contributed improvements and fixing bugs.
-   **Objective:** Improve the extension's reliability, user experience, and robustness.

## 2. Recent Changes & Decisions

-   **Version Update:**
    -   Updated extension version to `0.2.9` in `manifest.json` and `package.json`.
-   **Dynamic Link Monitoring (via Pull Request):**
    -   Integrated a new `LinkMonitor.js` module that uses a `MutationObserver` to dynamically detect new links added to a page after the initial load. This significantly improves link catching on modern, dynamic websites.
    -   Refactored `content_script.js` to use the `LinkMonitor`, making the link detection more efficient and reliable.
-   **Click Handling Fix (via Pull Request):**
    -   Modified `content_script.js` to only prevent the default browser action (`e.preventDefault()`) for links that are confirmed to be torrents (`magnet:` or `.torrent`). This fixes a critical bug where the extension would block navigation to non-torrent links.
-   **API Handler Architecture:**
    -   Created `api_handlers/rutorrent_handler.js` to support the ruTorrent web front-end.
-   **Advanced Add Dialog Improvements (via Pull Request):**
    -   The category/label input in the advanced add dialog is now a dropdown menu, populated from a new "Categories/Labels" field in the server settings. This improves user experience by preventing typos and showing available options.
    -   The file selection logic in the dialog has been enhanced to correctly parse `.torrent` files and display a list of files with their sizes.
-   **Options Page Enhancements (via Pull Request):**
    -   Added a "WebUI" button to each server profile in the options page, allowing users to open the server's WebUI in a new tab.
    -   Added a "Download Locations" input field for Transmission servers, allowing users to specify a list of download locations.
    -   Added a "Categories/Labels" input field to the server configuration form to define the options for the new dropdown in the advanced add dialog.
    -   Replaced the "Show advanced options dialog" checkbox with a dropdown menu, providing more granular control (`Never`, `Always`, `Only when added manually`, `Only on link/form catching`).
    -   Added new fields for ruTorrent-specific settings (`ruTorrentrelativepath`, `rutorrentdontaddnamepath`, `rutorrentalwaysurl`).
-   **Stricter Content-Type Check:**
    -   Modified `background.js` to abort the add operation if the `Content-Type` of a fetched URL is not a recognized torrent type. This prevents the extension from attempting to add non-torrent files to the client.
-   **CSS Injection Fix:**
    -   Removed automatic Tailwind CSS injection from `content_script.js`.
    -   Implemented dynamic CSS injection/removal in `content_script.js` to ensure that the extension's styles are only applied when the on-page modal is active, preventing style conflicts with other websites.
-   **qBittorrent Paused State Fix:**
    -   Implemented a version check in `qbittorrent_handler.js` to automatically detect the qBittorrent version.
    -   The handler now uses the `stopped` parameter instead of `paused` for qBittorrent versions >= 5.1.2, fixing the bug where torrents were not being added in a paused state.
-   **Add Torrent by Icon Click:**
    -   Implemented a new feature to add a torrent by clicking the extension icon. This opens a dialog where the user can paste a torrent URL or magnet link.
-   **Client-Specific Feature Enhancements:**
    -   **qBittorrent:** Added a "Save Path" option.
    -   **Transmission:** Added options for speed limits, seeding limits, peer limits, sequential downloading, and bandwidth priority.
    -   **Deluge:** Added options for speed limits, connection limits, seeding options, and miscellaneous settings like sequential downloading.
    -   **rTorrent:** Added options for priority, throttle, and peer settings. Improved label support to use `d.custom.set` instead of `d.custom1.set`.
    -   **ruTorrent:** Improved label support to handle multiple labels.
    -   **uTorrent / BitTorrent:** Improved `add-file` to support download directory and labels.
-   **New Client Support:**
    -   **Hadouken:** Added support for Hadouken.
    -   **Tixati:** Added support for Tixati.
    -   **Torrentflux:** Added support for Torrentflux.
    -   **Vuze:** Added support for Vuze HTML WebUI.
    -   **Flood:** Added support for Flood.
    -   **Tribler:** Added support for Tribler.
    -   **BiglyBT:** Added support for BiglyBT.
-   **UI Fixes:**
    -   Fixed the positioning of the "Clear Last Action Status" button in the popup.
    -   Made the "Active Server Details" section in the popup clickable to open the server's WebUI.
-   **Version Update:**
    -   Updated extension version to `0.3.2` in `manifest.json` and `package.json`.
-   **Deployment:**
    -   Documented the deployment process, including the use of `gh` for releases.
    -   Successfully created and uploaded the v0.3.2 release to GitHub.
-   **Documentation:**
    -   Updated `README.md` to include the newly added clients.
-   **Git:**
    -   Committed all changes to the local repository.
-   **Bug Fixes:**
    -   **ruTorrent:** Corrected the handler to properly add torrents, addressing issues with URL construction, magnet link handling, and parameter submission. This fix was based on a working implementation from a similar project and the official documentation.

## 3. Next Steps (High-Level Plan)

1.  **Testing:**
    -   Thoroughly test all the new features and bug fixes.
2.  **Continue Client Feature Enhancement:**
    -   Review the remaining client handlers and their documentation to identify and implement missing features.
3.  **Memory Bank Update:**
    -   Ensure all Memory Bank files are updated to reflect the latest changes.
4.  **Prepare for Release:**
    -   Once testing is complete, prepare for a new release with the recent improvements.

## 4. Active Decisions & Considerations

-   The recent pull request has significantly improved the extension's functionality and reliability. The focus should now be on ensuring these new features are stable and well-documented.

## 5. Open Questions/To Discuss
-   None at the moment.
