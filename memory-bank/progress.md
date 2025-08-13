# Progress: Add Remote Torrent

## 1. Current Project Status

-   **Overall:** Phase 2 (Adding More Client Support & Refinements) is in progress.
-   **Current Activity:** Addressing user feedback, fixing critical bugs, and improving the overall user experience and support infrastructure.

## 2. Phased Implementation Plan

---
### **Phase 0: Original qBittorrent WebUI Adder (Completed)**
*Objective: Develop a fully-featured Chrome extension for adding torrents to qBittorrent servers, including multi-server support, advanced add dialog, and URL-based server selection.*
-   **Status:** [X] Completed.

---
### **Phase 1: Multi-Client Architecture Transformation (Completed)**
*Objective: Transform the existing extension into a multi-client torrent adder by refactoring the core architecture to support various torrent client APIs in a modular and extensible way. Update all project documentation.*
-   **Status:** [X] Completed.

---
### **Phase 2: Adding More Client Support & Refinements (Current Focus)**
*Objective: Expand client compatibility by fleshing out placeholder handlers and refine the user experience for multi-client management.*

-   **Release v0.3.6 (2025-08-14):**
    -   [X] **Versioning Fix:** Corrected versioning scheme in `manifest.json` and `package.json` to be compliant with Chrome Web Store policies (e.g., `0.3.6`), resolving a critical loading error.
    -   [X] **ruTorrent Handler Fix:** Corrected the URL construction logic to prevent "404 Not Found" errors, relying solely on the full Server URL.
    -   [X] **uTorrent (Old) Handler Fix:** Reworked the handler to remove the CSRF token requirement, ensuring compatibility with very old, token-less clients (e.g., v2.0.4).
    -   [X] **"Report Issue" Feature:**
        -   Added a "Report Issue" button to the popup UI.
        -   Implemented logic in `popup.js` to open a pre-filled GitHub issue template with sanitized error information.
    -   [X] **Options Page UX Improvements:**
        -   Added inline help text for the "Custom URL patterns" field.
        -   Made error messages on the server form persistent (they no longer disappear automatically).
        -   Added a confirmation dialog to warn users before saving a server configuration that has failed a connection test.
    -   [X] **Documentation Updates:**
        -   Consolidated recent changes into a single `v0.3.6` entry in the `README.md` changelog.
        -   Added a "Reporting Issues" section to `README.md`.
        -   Added a troubleshooting note for macOS users to `README.md`.
        -   Updated `memory-bank/techContext.md` with the correct versioning requirements.
        -   Updated `memory-bank/activeContext.md` and this file.
    -   [X] **Release Management:** Deleted invalid tags (`v0.3.5b`, `v0.3.5c`) from the remote repository and created a new, valid `v0.3.6` release on GitHub.

-   **(Previous Phase 2 Work is documented below for historical context)**
    -   [X] Dynamic Link Monitoring & Click Handling
    -   [X] Placeholder Handler Creation & UI Integration
    -   [X] Client-Specific UI Refinements
    -   [X] Tracker URL-Based Label/Directory Assignment
    -   [X] On-Page Link Catching & Modal Feature
    -   [X] Advanced Add Dialog Enhancements
    -   [X] Fleshed out multiple placeholder handlers (uTorrent, rTorrent, etc.)
    -   [X] Numerous UI/UX Enhancements with Tailwind CSS
    -   [X] Established Webpack build process
    -   [X] Previous releases (v0.2.9 - v0.3.5)

---
### **Phase 3: Advanced Features & Polish (Future)**
*Objective: Introduce advanced client-specific options and further polish the overall extension.*
(Tasks remain as previously defined)
-   [ ] Consider client-specific advanced options in the "Advanced Add Dialog".
-   [ ] Further UI/UX improvements based on multi-client usage patterns and feedback.
-   [ ] Comprehensive testing across all supported clients and browsers.
-   [ ] Final review of all documentation.

## 3. Known Issues & Blockers
-   **macOS Link Catching:** A user reported on-page link catching does not work on macOS. This may be a configuration issue or a platform-specific bug requiring further investigation.
-   **Placeholder Handler Functionality:** Many handlers (e.g., Buffalo, Vuze, tTorrent) are still very basic and require significant work or API discovery to become fully functional.
-   **rTorrent Handler XML Complexity:** While basic functionality exists, robust XML-RPC handling for all rTorrent features remains a complex task.

## 4. Milestones (New Phased Approach)

-   **Milestone 0 (Original Project Complete):** qBittorrent WebUI Adder.
    -   **Status:** [X] Complete
-   **Milestone 1 (Multi-Client Architecture Foundation):** Phase 1 tasks completed.
    -   **Status:** [X] Complete
-   **Milestone 2 (Expanded Client Support):** Phase 2 tasks, focusing on implementing full support for placeholder clients and UI refinements.
    -   **Status:** [X] In Progress
-   **Milestone 3 (Full Feature Set & Polish):** Phase 3 tasks.
    -   **Status:** [ ] Not Started
