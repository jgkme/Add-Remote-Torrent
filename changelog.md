# Changelog

All notable changes to this project will be documented in this file.

## [0.2.4] - 2025-06-06 
### Added
-   **Sound Notifications:**
    -   Implemented success/failure sound notifications for torrent additions.
    -   Uses the Offscreen API for reliable audio playback from the service worker.
    -   Resolved CSP issues by using an external script (`offscreen_audio.js`) for the offscreen document (`offscreen_audio.html`).
    -   Added an option in the settings page to enable/disable sound notifications.
    -   Audio files (`success.mp3`, `failure.mp3`) are expected in an `audio/` directory.
-   **Tracker URL-Based Label/Directory Assignment:**
    -   New feature to automatically assign labels and/or download directories based on tracker announce URLs found within `.torrent` files.
    -   Added a new section in the Options page to create, manage (edit/delete), and list these rules.
    -   Each rule consists of a "Tracker URL Pattern" (substring match), an optional "Assign Label", and an optional "Assign Directory".
    -   Logic implemented in `background.js` to:
        -   Parse `.torrent` file content (using the `bencode` library) when a `.torrent` file is added.
        -   Extract `announce` and `announce-list` URLs.
        -   Match these URLs against the configured `trackerUrlRules`.
        -   If a rule matches, the torrent's category (label) and/or download directory are overridden. The first matching rule applies.
    -   The `trackerUrlRules` are included in the settings export/import functionality.
    -   Success notifications now indicate if a tracker rule was applied.

### Changed
-   **Exported Settings Filename:** Corrected the default filename for exported settings from `RemoteTorrentAdder_settings.json` to `Add Remote Torrent_settings.json` to align with the new project name.
-   **qBittorrent API v5.1.0+ Compatibility:**
    -   Added `Referer` and `Origin` headers to all API requests.
    -   Changed `Content-Type` to `application/x-www-form-urlencoded` for login requests.
    -   Corrected the `getApiUrl` helper function to prevent double slashes.
    -   Updated the `testConnection` error message for authentication failures to suggest checking qBittorrent's "CSRF Protection" setting.
-   **Notification Icons:** Switched from `.svg` to `.png` (`icons/icon-48x48.png`) for potentially better reliability in `chrome.notifications.create` calls.
-   **Bencode Library:** Ensured consistent use of the `bencode` npm package for parsing torrent file metadata in `background.js` (for tracker rules) and `confirmAdd.js` (for file list).

### Fixed
-   **CSP for Theme Script:** Resolved Content Security Policy violations by moving the inline dark mode script to an external `js/theme.js` file.
-   **Sound Notification Errors:** Iteratively fixed "Audio is not defined" and "Receiving end does not exist" errors by implementing and refining the Offscreen API usage with a ready-handshake mechanism.

---
*(Previous versions/changes before 0.2.3 would be documented here if available)*
