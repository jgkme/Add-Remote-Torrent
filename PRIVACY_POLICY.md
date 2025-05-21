# Privacy Policy for Add Remote Torrent Extension

**Last Updated: May 17, 2025**

This Privacy Policy describes how the "Add Remote Torrent" Chrome extension (the "Extension") handles your information. By installing and using the Extension, you agree to the collection and use of information in accordance with this policy.

## 1. Information We Do Not Collect

We, the developers of Add Remote Torrent, **do not collect, store, or transmit any of your personal data or browsing activity to our servers or any third-party servers** (except for the torrent client servers you explicitly configure within the Extension).

This includes:
-   Your browsing history.
-   Personal identification information (unless you voluntarily provide it in a support request, which is handled outside the Extension).
-   Credentials for your torrent client servers (these are stored locally on your computer, as described below).

## 2. Information the Extension Stores Locally

The Extension uses `chrome.storage.local` (storage provided by your browser) to save your configurations and preferences. This data is stored only on your local computer where the Extension is installed. This data includes:

-   **Server Profiles:** Details you enter for each torrent client server, such as:
    -   Server Name (user-defined alias)
    -   Client Type (e.g., qBittorrent, Transmission)
    -   Server URL
    -   Username and Password (for accessing your torrent client's WebUI)
    -   Client-specific paths (e.g., RPC Path for Transmission, SCGI Path for rTorrent)
    -   Default torrent parameters (tags, category/label, download directory, initial paused state)
    -   Per-server lists of recently used directories and labels (`dirlist`, `labellist`)
    -   The "Ask for Label/Directory on page" setting for each server.
-   **Active Server ID:** The identifier of the server you have currently selected as active.
-   **Global Settings:** User preferences such as:
    -   Whether to show the Advanced Add Dialog.
    -   Whether to enable URL-based server selection.
    -   Settings related to on-page link catching (e.g., `catchfrompage`, `linksfoundindicator`, `linkmatches`, `registerDelay`).
-   **URL-to-Server Mappings:** Rules you define for automatic server selection based on website URLs.
-   **Last Action Status:** A temporary status message about the last torrent addition attempt (for display in the popup).

This locally stored data is essential for the Extension to function as intended, allowing you to manage your server configurations and preferences without re-entering them.

## 3. Information Transmission

When you use the Extension to add a torrent:
-   The torrent link (magnet URL or `.torrent` file URL) and any parameters you've set (either defaults from your server profile or custom ones from a dialog) are transmitted **directly from your browser to the torrent client server you have configured and selected.**
-   If you use the file selection feature for `.torrent` files, the Extension will first fetch the `.torrent` file from its original URL to parse its contents. This request is made from your browser to the server hosting the `.torrent` file.
-   Credentials (username/password) for your torrent servers are sent only to those respective servers for authentication, as required by their WebUI APIs.

**We do not have access to, nor do we intercept or store, any of this transmitted data.**

## 4. Permissions Usage

The Extension requests the following permissions, with justifications provided to the Chrome Web Store:
-   **`storage`:** To save your server configurations and settings locally on your computer.
-   **`contextMenus`:** To create a right-click menu item for easily adding torrents from links.
-   **`notifications`:** To provide you with feedback on the success or failure of torrent additions.
-   **Optional `host_permissions` (`http://*/*`, `https://*/*`):**
    -   To fetch `.torrent` file content from any URL for parsing (e.g., for file selection).
    -   To enable the on-page link catching feature across all websites (if you enable it).
    -   To connect to your configured torrent client WebUI URLs, which can be on any host or IP address. These permissions are only activated for hosts you explicitly configure or for fetching `.torrent` files you interact with.

## 5. Security

While the Extension stores your server credentials locally using `chrome.storage.local`, the security of this data ultimately depends on the security of your computer and your Chrome browser profile. We recommend using strong, unique passwords for your torrent clients and maintaining good overall computer security practices.

## 6. No Tracking or Analytics

The Extension does not include any third-party tracking or analytics software to monitor your usage of the Extension or your browsing activity.

## 7. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the Extension or on its Chrome Web Store page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted.

## 8. Contact Us

If you have any questions about this Privacy Policy, please Issue a ticket here 

