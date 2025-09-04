# Active Context: Add Remote Torrent

## 1. Current Work Focus

-   **Phase:** Phase 3: UI/UX Enhancements & System Modernization.
-   **Activity:** Overhauling the custom link-catching feature.
-   **Objective:** Replace the outdated, single-string input for link patterns with a modern, user-friendly UI that allows for easy management of multiple regex patterns.

## 2. Recent Changes & Decisions

-   **Link Catching UI Overhaul (v0.3.19):**
    -   **Feature:** Replaced the single text input for "Custom Link Catching Patterns" with a dynamic list UI on the options page. Users can now add, edit, and delete individual regex patterns.
    -   **Feature:** Added two default patterns to catch common `.torrent` file links and `torrents.php` download links. These are marked as "Default" and can be edited but not deleted.
    -   **Migration:** Implemented a seamless, one-time migration for existing users. The old `linkmatches` tilde-separated string is automatically converted into the new array-based `linkCatchingPatterns` format, preserving all user-defined patterns. The old `linkmatches` key is removed from storage after migration.
    -   **Backend Update:** The `background.js` and `content_script.js` were updated to use the new `linkCatchingPatterns` array from `chrome.storage.local`, completely removing the dependency on the old `linkmatches` string.

-   **Client Support Expansion (v0.3.18):**
    -   **Feature:** Added support for four new torrent clients: BiglyBT, Flood, Porla, and an updated handler for Kodi Elementum.
    -   **Refactor:** Rewrote several handlers to use more robust authentication and request methods based on new research.

## 3. Next Steps (High-Level Plan)

1.  **Finalize Documentation:**
    -   Update `systemPatterns.md` to document the new UI pattern for managing lists (as seen in URL rules, tracker rules, and now link patterns).
    -   Update `progress.md` to reflect the completion of this feature.
2.  **Release:**
    -   Increment the version number to `0.3.19` in `package.json` and `manifest.json`.
    -   Update the `README.md` changelog.
    -   Build the extension.
    -   Commit, push, and create the new release on GitHub.

## 4. Active Decisions & Considerations

-   The migration path for the link-catching patterns was designed to be automatic and non-destructive, ensuring that users with existing custom patterns do not lose their settings during the update.
-   The new UI for managing patterns reuses the same design and logic as the URL and Tracker rules, creating a consistent user experience across the options page.

## 5. Open Questions/To Discuss
-   None at this time. The current feature implementation is complete.
