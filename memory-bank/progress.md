# Progress: Add Remote Torrent

## 1. Current Project Status

-   **Overall:** Phase 3 (UI/UX Enhancements & System Modernization) is complete.
-   **Current Activity:** Preparing for the v0.3.19 release.

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

-   **Release v0.3.18 (2025-09-05):**
    -   [X] **Feature:** Added support for four new clients: BiglyBT, Flood, Porla, and an updated Elementum handler.
    -   [X] **Feature:** Added a new global setting to show download directories as a nested submenu in the context menu.
    -   [X] **Fix:** Corrected multiple bugs related to context menu creation and dynamic page handling.

-   **Release v0.3.17 (2025-08-29):**
    -   [X] **Fix:** Implemented a comprehensive fix for uTorrent connectivity.
    -   [X] **UX:** Improved the options page to auto-detect relative paths for uTorrent.

---
### **Phase 3: UI/UX Enhancements & System Modernization (Completed)**
*Objective: Modernize core features with better UI and robust, future-proof logic.*

-   **Release v0.3.19 (Current Release):**
    -   [X] **Feature:** Overhauled the "Custom Link Catching Patterns" setting with a new dynamic UI for adding, editing, and deleting individual patterns.
    -   [X] **Feature:** Added two default regex patterns for common torrent link formats.
    -   [X] **Migration:** Implemented an automatic, one-time migration to convert users' old, tilde-separated patterns into the new array-based format, ensuring no data loss.
    -   [X] **Refactor:** Updated the background and content scripts to use the new `linkCatchingPatterns` data structure, removing the legacy `linkmatches` code.

---
### **Phase 4: Advanced Features & Polish (Future)**
*Objective: Introduce advanced client-specific options and further polish the overall extension.*
-   [ ] Consider client-specific advanced options in the "Advanced Add Dialog".
-   [ ] Further UI/UX improvements based on multi-client usage patterns and feedback.

## 3. Known Issues & Blockers
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
-   **Milestone 4 (Full Feature Set & Polish):** Phase 4 tasks.
    -   **Status:** [ ] Not Started
