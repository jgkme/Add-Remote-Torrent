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
-   **Advanced Add Dialog Improvements (via Pull Request):**
    -   The category/label input in the advanced add dialog is now a dropdown menu, populated from a new "Categories/Labels" field in the server settings. This improves user experience by preventing typos and showing available options.
    -   The file selection logic in the dialog has been enhanced to correctly parse `.torrent` files and display a list of files with their sizes.
-   **Options Page Enhancements (via Pull Request):**
    -   Added a "Categories/Labels" input field to the server configuration form to define the options for the new dropdown in the advanced add dialog.
    -   Replaced the "Show advanced options dialog" checkbox with a dropdown menu, providing more granular control (`Never`, `Always`, `Only when added manually`, `Only on link/form catching`).
-   **Stricter Content-Type Check:**
    -   Modified `background.js` to abort the add operation if the `Content-Type` of a fetched URL is not a recognized torrent type. This prevents the extension from attempting to add non-torrent files to the client.
-   **CSS Injection Fix:**
    -   Removed automatic Tailwind CSS injection from `content_script.js`.
    -   Implemented dynamic CSS injection/removal in `content_script.js` to ensure that the extension's styles are only applied when the on-page modal is active, preventing style conflicts with other websites.

## 3. Next Steps (High-Level Plan)

1.  **Testing:**
    -   Thoroughly test the new features and bug fixes, especially the dynamic link monitoring and the improved click handling.
2.  **Memory Bank Update:**
    -   Ensure all Memory Bank files are updated to reflect the latest changes.
3.  **Prepare for Release:**
    -   Once testing is complete, prepare for a new release with the recent improvements.

## 4. Active Decisions & Considerations

-   The recent pull request has significantly improved the extension's functionality and reliability. The focus should now be on ensuring these new features are stable and well-documented.

## 5. Open Questions/To Discuss
-   None at the moment.
