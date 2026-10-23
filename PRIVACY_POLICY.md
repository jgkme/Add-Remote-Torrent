# Privacy Policy for Add Remote Torrent

**Last Updated: 2026-09-16**

## 1. Introduction

Thank you for using Add Remote Torrent ("the Extension"). This Privacy Policy explains how the Extension handles your data. Your privacy and security are important to us.

## 2. Data Collection and Usage

**Add Remote Torrent does not collect, store, or transmit personal data to the developer or any third-party analytics service.**

Information you enter yourself—such as server profiles (names, URLs, usernames, passwords, API keys), URL-mapping rules, and preferences—is saved **only on your device** using `chrome.storage.local`. That data is not sent to our servers. It is used solely to operate features you enable (adding torrents, status checks, notifications, and similar).

The Extension may **communicate directly** with:

- **Torrent client WebUIs you configure** (for example on your home LAN, a NAS, or a remote VPS), only after you grant host access for those URLs.
- **Websites you visit** when you use features that need the current page (for example optional on-page link catching, or downloading a `.torrent` file in the browser using your existing site session before sending it to your client).

We do not operate a backend that receives your browsing history or server credentials.

## 3. Permissions

The Extension requests the following permissions:

| Permission | Why it is needed |
|------------|------------------|
| **storage** | Save server profiles, settings, action history, and RSS state locally on your device. |
| **contextMenus** | Show the right-click "send to…" menu for configured servers. |
| **notifications** | Show success/failure (and optional status) notifications after actions. |
| **offscreen** | Play optional success/failure sounds via a small offscreen document (required by Chrome for audio in MV3). **Firefox builds omit this permission** and play sounds in the background page instead. |
| **alarms** | Periodically refresh server/torrent status and optional RSS feed checks in the background. |
| **activeTab** | Temporary access to the **current tab** when you invoke the extension (popup, context menu, or keyboard shortcut)—used with clipboard quick-add without requesting permanent access to all tabs. |
| **scripting** | Run a one-shot script in the active tab to read the clipboard when you use the "Quick add torrent from clipboard" shortcut (user-initiated; only on normal `http://` / `https://` pages). |
| **clipboardRead** | Read the clipboard for the popup clipboard row, quick-add, and the optional “auto-add when copied” setting. That setting is off until you turn it on, and it only watches pages you have granted this extension access to. Chrome and Brave reject popup `readText()` without this permission, even when the site clipboard setting is Allow. |
| **webRequest / webRequestBlocking** | **Firefox package only.** Rewrite `Origin: moz-extension://…` on requests to your torrent client so qBittorrent CSRF checks see the WebUI origin. Not included in the Chrome package (Chrome Web Store MV3 does not allow blocking `webRequest` for typical store extensions). |
| **optional_host_permissions** (`http://*/*`, `https://*/*`) | Connect to **your** torrent clients and sites. Host access is **optional** and granted by you (for example when saving a server or when the browser prompts). This broad pattern is intentional so the Extension works with **local network addresses** (for example `192.168.x.x`, `10.x.x.x`), **custom ports**, **reverse proxies**, and **remote VPS/seedbox hostnames** without listing every possible URL in advance. The Extension does not connect to arbitrary hosts unless you configure them or use a feature that needs the current page. |

### Content scripts and page access

When you enable **on-page link catching** in Options, the Extension registers a content script for web pages. It is **not** loaded on every site by default. It is used to:

- Highlight and intercept magnet/torrent links on pages you visit (optional feature).
- Send clicked links to your configured remote client.

Disabling link catching unregisters that script for new page loads (already-open tabs may keep handlers until you refresh them).

On sites you have already granted access to, a separate small script records the element under a right-click so download buttons that are not normal links can be sent to your client. It does not read page text for any other purpose. Right-click on a site you have not granted still uses temporary **activeTab** access only after you choose the menu item.

Private-tracker `.torrent` downloads that need your browser session are handled in the extension background using fetches to URLs you trigger—not by uploading page content to us.

## 4. Third-Party Services

The Extension does not use third-party analytics, advertising, or data brokers. Network traffic goes between your browser and the servers **you** configure (torrent clients, indexers, trackers, RSS URLs you add), not to a developer-operated collection service.

## 5. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be posted in the repository and reflected in the "Last Updated" date above.

## 6. Contact Us

If you have questions about this Privacy Policy, open an issue on our [GitHub repository](https://github.com/jgkme/Add-Remote-Torrent/issues).
