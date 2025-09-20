# Progress: Add Remote Torrent

## 1. Current Project Status

-   **Overall:** A critical hotfix (v0.4.8) has been developed to address major bugs from the v0.4.7 release.
-   **Current Activity:** Finalizing documentation before releasing the hotfix.

## 2. Phased Implementation Plan

---
### **Phase 0: Original qBittorrent WebUI Adder (Completed)**
*Objective: Develop a fully-featured Chrome extension for adding torrents to qBittorrent servers.*
-   **Status:** [X] Completed.

---
### **Phase 1: Multi-Client Architecture Transformation (Completed)**
*Objective: Transform the existing extension into a multi-client torrent adder by refactoring the core architecture.*
-   **Status:** [X] Completed.

---
### **Phase 2: Expanded Client Support & UX Refinements (Completed)**
*Objective: Expand client compatibility and refine the user experience with major new features.*
-   **Status:** [X] Completed.

---
### **Phase 3: UI/UX Enhancements & System Modernization (Completed)**
*Objective: Modernize core features with better UI and robust, future-proof logic.*
-   **Status:** [X] Completed.

---
### **Phase 4: Stability & Hotfixes (In Progress)**
*Objective: Address critical bugs and improve the stability of existing features.*

-   **Release v0.4.8 (Current Hotfix):**
    -   [X] **Fix (Critical):** Overhauled the download completion notification system to prevent notification spam. The system now only tracks and notifies for torrents added *by the extension*, ignoring the user's wider torrent list.
    -   [X] **Fix:** Resolved a bug where qBittorrent servers would display "N/A" for total torrents and speed statistics in the popup and dashboard.
    -   [X] **Feature:** Added a global setting in the Options page to allow users to enable or disable download completion notifications, providing full control over the feature.
    -   [X] **Refactor:** Established a new `getTorrentsInfo(serverConfig, hashes)` function as a required standard for API handlers to support the new targeted notification system.

-   **Comprehensive Code Review & Refactoring (Self-initiated):**
    -   [X] **Fix (Critical):** Refactored qBittorrent and Deluge API handlers to use a robust, per-server session manager, fixing major bugs in multi-server environments.
    -   [X] **Fix (Critical):** Corrected a bug in the Options page that prevented URL-to-server mapping rules from being edited.
    -   [X] **Fix (Security):** Patched a self-XSS vulnerability on the dashboard page by implementing secure, DOM-based HTML escaping.
    -   [X] **Fix (Concurrency):** Replaced an unbounded `Promise.all` in the background server check with a concurrent queue to improve stability.
    -   [X] **Fix (Error Handling):** Improved error handling for context menu creation to prevent inconsistent states.
    -   [X] **Refactor:** Improved consistency of dynamic link detection in `LinkMonitor.js`.
    -   [X] **Refactor:** Optimized data transfer from the "Advanced Add" dialog to the background script.

---
### **Phase 5: Advanced Features & Polish (Future)**
*Objective: Introduce advanced client-specific options and further polish the overall extension.*
-   [ ] Consider client-specific advanced options in the "Advanced Add Dialog".
-   [ ] Further UI/UX improvements based on multi-client usage patterns and feedback.

## 3. Known Issues & Blockers
-   **Low Priority:** The new `trackedTorrents` list does not currently handle cases where a torrent is deleted from the client before completing. This is a minor edge case and can be addressed later.
-   **Placeholder Handler Functionality:** Many existing handlers (e.g., Buffalo, tTorrent) are still very basic and require significant work to become fully functional.
-   **rTorrent Handler XML Complexity:** The rTorrent handler could be made more robust.

## 4. Milestones (New Phased Approach)

-   **Milestone 0 (Original Project Complete):** qBittorrent WebUI Adder.
    -   **Status:** [X] Complete
-   **Milestone 1 (Multi-Client Architecture Foundation):** Phase 1 tasks completed.
    -   **Status:** [X] Complete
-   **Milestone 2 (Expanded Client Support & UX Refinements):** Phase 2 tasks completed.
    -   **Status:** [X] Complete
-   **Milestone 3 (UI/UX Modernization):** Phase 3 tasks completed.
    -   **Status:** [X] Complete
-   **Milestone 4 (Stability & Hotfixes):** Phase 4 tasks.
    -   **Status:** [X] In Progress
-   **Milestone 5 (Full Feature Set & Polish):** Phase 5 tasks.
    -   **Status:** [ ] Not Started
