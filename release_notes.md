### v0.3.21 (2025-09-06)

*   **Fix:** Resolved a critical "Extension context invalidated" error that occurred during extension reloads. The content script now handles this expected error gracefully, preventing console errors on every page load and improving overall stability.
