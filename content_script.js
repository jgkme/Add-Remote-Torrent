// Content script for Remote Torrent WebUI Adder

// Inject Tailwind CSS into the page
(function() {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.type = 'text/css';
    styleLink.href = chrome.runtime.getURL('css/tailwind.css');
    document.head.appendChild(styleLink);
})();

var rtwa_modal_open_func, rtwa_modal_close_func;

// Modal initialization function
function rtwa_initModalLogic() {
    let modalWrapper = null;
    let modalWindow = null;
    console.log("[RTWA ContentScript] rtwa_initModalLogic: Initializing modal functions.");

    const openModal = () => {
        console.log("[RTWA ContentScript] openModal: Attempting to open modal.");
        // The modal HTML is injected by rtwa_showLabelDirChooser
        modalWrapper = document.getElementById("rtwa_modal_wrapper");
        modalWindow = document.getElementById("rtwa_modal_window");

        if (modalWrapper && modalWindow) {
            console.log("[RTWA ContentScript] openModal: Modal elements found. Setting display to flex.");
            modalWrapper.style.display = "flex"; 
            console.log("[RTWA ContentScript] openModal: Modal display set. Current display:", modalWrapper.style.display);
        } else {
            console.error("RTWA Modal: Wrapper or window not found after HTML injection.");
        }
    };

    const closeModal = () => {
        modalWrapper = document.getElementById("rtwa_modal_wrapper"); 
        if (modalWrapper) {
            modalWrapper.remove(); 
        }
        document.removeEventListener("click", clickOutsideHandler);
        document.removeEventListener("keydown", keydownHandler);
    };

    // Event handler for clicking outside the modal
    const clickOutsideHandler = (event) => {
        modalWrapper = document.getElementById("rtwa_modal_wrapper"); 
        if (modalWrapper && event.target === modalWrapper) {
            closeModal();
        }
    };

    // Event handler for the Escape key
    const keydownHandler = (event) => {
        if (event.key === "Escape" || event.keyCode === 27) {
            closeModal();
        }
    };
    
    document.addEventListener("click", clickOutsideHandler, false);
    document.addEventListener("keydown", keydownHandler, false);

    return [openModal, closeModal];
}


// Request initial data from background script
chrome.runtime.sendMessage({ action: "getStorageData" }, function(response) {
    if (chrome.runtime.lastError) {
        console.error("Error getting storage data:", chrome.runtime.lastError.message);
        return;
    }
    if (response) {
        var delay = 0;
        if (response.registerDelay && response.registerDelay > 0) { // Assuming registerDelay is a direct property
            delay = response.registerDelay;
        }
        setTimeout(function() { registerLinks(response); }, delay);
    } else {
        console.error("No response from getStorageData or response is undefined.");
    }
});

function registerLinks(response) {
    // Correctly check for boolean true, not string "true"
    if (response.catchfrompage !== true) return;

    var links = [];
    var rL = document.getElementsByTagName('a');
    var res = response.linkmatches ? response.linkmatches.split("~") : [];
    res.push("magnet:"); // Always include magnet links

    if (response.linkmatches !== "" || res.includes("magnet:")) {
        for (var lkey = 0; lkey < rL.length; lkey++) {
            if (rL[lkey] && rL[lkey].href) { // Check if rL[lkey] and its href are defined
                for (var mkey = 0; mkey < res.length; mkey++) {
                    try {
                        if (rL[lkey].href.match(new RegExp(res[mkey], "g"))) {
                            links.push(rL[lkey]);
                            break;
                        }
                    } catch (e) {
                        console.warn("Regex error matching link:", rL[lkey].href, "with pattern:", res[mkey], e);
                    }
                }
            }
        }
    }

    // Handle forms (less common for torrents, but kept from original logic)
    var rB1 = Array.prototype.slice.call(document.getElementsByTagName('button'));
    var rB2 = Array.prototype.slice.call(document.getElementsByTagName('input'));
    var rB = rB1.concat(rB2);
    
    var forms = [];
    for (var x1 = 0; x1 < rB.length; x1++) { 
        forms.push(rB[x1].form);
    }
    for (var x2 = 0; x2 < rB.length; x2++) {
        for (var mkey2 = 0; mkey2 < res.length; mkey2++) {
            if (forms[x2] != null && forms[x2].hasAttribute('action') && forms[x2].action && forms[x2].action.match) {
                try {
                    if (forms[x2].action.match(new RegExp(res[mkey2], "g"))) {
                        rB[x2].dataset.rtwaHref = forms[x2].action; // Store original action as href
                        links.push(rB[x2]);
                        break;
                    }
                } catch (e) {
                     console.warn("Regex error matching form action:", forms[x2].action, "with pattern:", res[mkey2], e);
                }
            }
        }
    }
    
    console.log("[RTWA ContentScript] Found links count:", links.length); // Added log
    console.log("[RTWA ContentScript] Found links:", links); // Added log

    if (links.length > 0) {
        // Only initialize modal logic if needed (i.e., if a server requires it)
        // For now, we'll keep it here as it's part of the general setup for links.
        // The preflight check will determine if the modal actually shows.
        var modals = rtwa_initModalLogic(); 
        rtwa_modal_open_func = modals[0];
        rtwa_modal_close_func = modals[1];

        // Correctly check for boolean true
        if (response.linksfoundindicator === true) {
            chrome.runtime.sendMessage({ action: "updateBadge", count: links.length });
        }
        
        for (var key = 0; key < links.length; key++) {
            if (links[key].addEventListener) {
                links[key].addEventListener('click', function(e) {
                    if (!(e.ctrlKey || e.shiftKey || e.altKey)) {
                        e.preventDefault();
                        var url = this.href || this.dataset.rtwaHref; // Use dataset for form elements
                        if (!url) return;

                        console.log("[RTWA ContentScript] Link clicked:", url); // Log link click

                        // Assuming 'servers' is a JSON string in the response from getStorageData
                        var servers = response.servers ? JSON.parse(response.servers) : [];
                        if (servers.length === 0) {
                            console.warn("No servers configured.");
                            // Optionally, notify user to configure servers
                            alert("No torrent servers configured. Please configure one in extension options.");
                            return;
                        }
                        
                        // Determine active/target server - this logic might need to align with background.js's determineTargetServer
                        // For now, using the first server or a server passed explicitly (not available here yet)
                        // The old code used servers[0] or a specific server if passed to showLabelDirChooser
                        // This needs to be robust, perhaps by getting activeServerId from response.
                        let activeServer = servers.find(s => s.id === response.activeServerId) || servers[0];
                        
                        // Check for client-specific "ask" flags.
                        // These flags (e.g., "rutorrentdirlabelask") need to be defined in server objects.
                        // And mapped from our generic clientType (e.g., "rtorrent", "qbittorrent")
                        // For now, let's assume a generic 'askForLabelDirOnPage' flag.
                        // NEW PREFLIGHT LOGIC:
                        const pageUrl = window.location.href;
                        chrome.runtime.sendMessage({
                            action: "addTorrent",
                            url: url,
                            pageUrl: pageUrl
                        });
                    }
                });
            }
        }
    }
}

// Register a listener for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "addTorrent") {
        // This is a placeholder for any future logic that might be needed
        // when the background script confirms the torrent has been added.
        sendResponse({}); 
        return true; 
    }
});

function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}
