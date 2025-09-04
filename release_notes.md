### ✨ New Features & Improvements

- **New Client Support:** Added support for four new clients: BiglyBT, Flood, Porla, and an updated Elementum handler.
- **Link Catching UI Overhaul:** Replaced the single text input for 'Custom Link Catching Patterns' with a dynamic, user-friendly UI. You can now easily add, edit, and delete individual regex patterns, similar to how URL and Tracker rules are managed.
- **Default Patterns:** Added two default patterns to improve out-of-the-box link detection for common `.torrent` file links and `torrents.php` download links.
- **Seamless Migration:** Implemented an automatic, one-time migration for existing users. The old `linkmatches` tilde-separated string is converted into the new array-based format, preserving all user-defined patterns without any data loss.
- **Dependency Update:** Updated project dependencies to their latest versions.

### 🐛 Bug Fixes

- No direct bug fixes in this release, but the refactoring of the link-catching system modernizes the codebase and removes legacy logic.
