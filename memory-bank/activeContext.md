# Active Context: Add Remote Torrent

## 1. Current Work Focus

-   **Phase:** Phase 2: Refinements and Bug Fixes.
-   **Activity:** Addressing user feedback, fixing bugs, and improving the user experience.
-   **Objective:** Enhance reliability, usability, and documentation based on real-world user reports.

## 2. Recent Changes & Decisions

-   **Versioning Scheme Correction:**
    -   Corrected the versioning scheme to be compliant with Chrome Web Store policies (e.g., `0.3.6` instead of `0.3.5c`). Non-integer suffixes are invalid.
    -   Consolidated recent changes into version `0.3.6`.

-   **Bug Fixes:**
    -   **ruTorrent Handler:** Fixed a critical bug in the URL construction logic that was causing "404 Not Found" errors. The handler now correctly uses the full URL from the server settings.
    -   **uTorrent (Old) Handler:** Reworked the handler to remove the CSRF token requirement, making it compatible with very old, token-less clients (e.g., v2.0.4) and resolving connection errors.

-   **UX/Feature Enhancements:**
    -   **Report Issue Button:** Added a "Report Issue" button to the popup UI. This feature helps users by opening a new GitHub issue page with a pre-filled template including the sanitized error message, extension version, and client type.
    -   **Options Page UX:**
        -   Added inline help text for the "Custom URL patterns" field to provide better guidance.
        -   Error messages on the server configuration form are now persistent and will not disappear automatically.
        -   Implemented a confirmation dialog to warn users when they try to save a server configuration that has recently failed a connection test.

-   **Documentation:**
    -   **README:**
        -   Added a new "Reporting Issues" section with detailed instructions on how to enable debugging and submit effective bug reports.
        -   Added a new "Troubleshooting & FAQ" entry for macOS users experiencing issues with on-page link catching.
        -   Updated the changelog to reflect the consolidated `v0.3.6` release.
    -   **Memory Bank:** Updated `techContext.md` to include the new, stricter versioning rules for deployment.

-   **Accessibility Enhancement:**
    -   Added a new global setting to enable/disable text-based (visual) notifications for success or failure of torrent additions. This provides an alternative to sound-based notifications for users with hearing impairments or those who prefer visual feedback.
    -   Implemented the logic in `background.js` to check this setting before creating a `chrome.notifications` instance.
    -   Updated `options.html` and `options.js` to include the new toggle switch.

-   **Build & Deployment Hardening:**
    -   Implemented the "Verified CRX Uploads" feature for the Chrome Web Store.
    -   Generated a `private.pem` key for signing and added it to `.gitignore`.
    -   Installed the `crx` npm package to handle packaging.
    -   Updated the `scripts/zip.js` build script to produce three artifacts: a standard `.zip`, a `.sha256` checksum, and a signed `.crx` file.
    -   Updated the `v0.3.12` GitHub release to include all three consistent artifacts.
    -   Updated all relevant Memory Bank and `.clinerules` documentation to reflect the new, more secure deployment process.

## 3. Next Steps (High-Level Plan)

1.  **Monitor Feedback:** Keep an eye on user feedback for the new features and fixes in `v0.3.6`.
2.  **macOS Investigation:** If the link-catching issue on macOS persists after users have followed the new troubleshooting steps, further investigation may be required. This could involve asking for more detailed logs or trying to reproduce the issue in a virtual environment.
3.  **Continue Client Feature Enhancement:** As time permits, review other client handlers for potential improvements or missing features.

## 4. Active Decisions & Considerations

-   The decision was made to consolidate several small fixes and features into a single, valid version number (`0.3.6`) to resolve the invalid versioning issue and streamline the release history.
-   The previous invalid tags (`v0.3.5b`, `v0.3.5c`) were deleted from the remote repository to maintain a clean and valid version history.

## 5. Open Questions/To Discuss
-   Is the macOS link-catching issue a widespread problem or an isolated case of user misconfiguration? Further feedback is needed.
