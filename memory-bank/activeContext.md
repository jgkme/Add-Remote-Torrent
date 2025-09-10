# Active Context: Add Remote Torrent

## 1. Current Work Focus

-   **Phase:** Hotfix & Stability Improvement (Post v0.4.7).
-   **Activity:** Addressing critical bugs reported by users after the v0.4.7 release.
-   **Objective:** Fix the notification spam issue, resolve incorrect data display for qBittorrent, and provide users with control over completion notifications.

## 2. Recent Changes & Decisions

-   **Notification System Overhaul:**
    -   **Problem:** The previous notification system checked all completed torrents on the client, causing a "notification storm" for users with large numbers of seeded torrents.
    -   **Solution:** Implemented a new, targeted tracking system.
        -   A new `trackedTorrents` array is now stored in `chrome.storage.local`.
        -   When a torrent is successfully added via the extension, its `hash` and `serverId` are added to this array.
        -   The periodic `torrentStatusCheck` alarm in `background.js` now **only** queries the status of torrents present in the `trackedTorrents` list.
        -   Once a tracked torrent is found to be complete, a notification is sent, and the torrent is **removed** from the `trackedTorrents` list to prevent future notifications.
    -   **API Handler Update:** The `qbittorrent_handler.js` (and others will need to follow) was updated to include a `getTorrentsInfo(serverConfig, hashes)` function, which allows the background script to fetch data for specific torrents instead of the entire list.
    -   **User Control:** Added a new global setting on the options page, "Enable notification on download completion," which allows users to completely disable this feature. This setting is stored as `enableCompletionNotifications` in storage and is checked by the `torrentStatusCheck` alarm.

-   **qBittorrent Stats Fix:**
    -   **Problem:** The popup and dashboard were showing "N/A" for Total Torrents, DL Speed, and UL Speed for qBittorrent servers.
    -   **Solution:** The `testConnection` function in `qbittorrent_handler.js` was updated. It now fetches the `sync/maindata` endpoint and correctly structures the response to include `torrentsInfo: { total, downloadSpeed, uploadSpeed }`, which the background script then saves to the server object in storage.

## 3. Next Steps (High-Level Plan)

1.  **Finalize Documentation:**
    -   Update `systemPatterns.md` to document the new torrent tracking mechanism.
    -   Update `progress.md` to reflect the completion of these critical fixes.
2.  **Release:**
    -   Increment the version number to `0.4.8` in `package.json` and `manifest.json`.
    -   Update the `README.md` and `release_notes.md` with details of the fixes.
    -   Build, commit, and create the new release on GitHub.

## 4. Active Decisions & Considerations

-   The decision to track only extension-added torrents is a fundamental shift that dramatically improves the efficiency and user experience of the notification feature. It respects users who use their clients for other purposes and only notifies for actions initiated by the extension.
-   The new `getTorrentsInfo` function in the API handlers is a new required standard for any client that will support completion notifications.
-   The fix for the qBittorrent stats also improves the data freshness, as it's updated during the periodic `serverStatusCheck`.

## 5. Open Questions/To Discuss
-   Should the `trackedTorrents` list have a cleanup mechanism for torrents that are removed from the client before completion? (Currently, they would remain in the list indefinitely). This is a low-priority edge case for now.
