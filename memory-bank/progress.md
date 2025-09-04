# Progress: Add Remote Torrent

## 1. Current Project Status

-   **Overall:** Phase 2 (Adding More Client Support & Refinements) is in progress.
-   **Current Activity:** Adding support for new torrent clients (BiglyBT, Flood, Porla) and updating all project documentation.

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
### **Phase 2: Adding More Client Support & Refinements (Current Focus)**
*Objective: Expand client compatibility by fleshing out placeholder handlers and refining the user experience.*

-   **Release v0.3.18 (2025-09-05):**
    -   [X] **Feature:** Added a new global setting to show download directories as a nested submenu in the context menu.
    -   [X] **Fix:** Corrected a bug where the context menu would fail to build if a server had no download directories defined.
    -   [X] **Fix:** Added error handling to the content script to prevent "context invalidated" errors on dynamic pages.

-   **Release v0.3.17 (2025-08-29):**
    -   [X] **Fix:** Implemented a comprehensive fix for uTorrent connectivity. The handler now correctly uses a user-configurable "Relative Path" for all API requests, and the connection test uses a more reliable `getsettings` action.
    -   [X] **UX:** The options page now auto-detects the relative path from the server URL for uTorrent clients and correctly builds the "Open WebUI" link in all parts of the extension.

-   **(Previous releases are documented in the README.md changelog)**

---
### **Phase 3: New Client Integration (Next Steps)**
*Objective: Add support for BiglyBT, Flood, and Porla.*
-   [ ] Research APIs for BiglyBT, Flood, and Porla.
-   [ ] Implement API handlers for each new client.
-   [ ] Update the UI (options page) to include the new clients.
-   [ ] Thoroughly test functionality for the new clients.

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
-   **Milestone 3 (New Client Integration):** Phase 3 tasks.
    -   **Status:** [ ] Not Started
-   **Milestone 4 (Full Feature Set & Polish):** Phase 4 tasks.
    -   **Status:** [ ] Not Started
