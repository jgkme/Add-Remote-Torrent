// Content script for Remote Torrent WebUI Adder

var rtwa_modal_open_func, rtwa_modal_close_func;

// Modal initialization function
function rtwa_initModalLogic() {
    let modalWrapper = null;
    let modalWindow = null;

    const openModal = () => {
        // The modal HTML is injected by rtwa_showLabelDirChooser
        modalWrapper = document.getElementById("rtwa_modal_wrapper");
        modalWindow = document.getElementById("rtwa_modal_window");

        if (modalWrapper && modalWindow) {
            modalWrapper.style.display = "flex"; 
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
    if (response.catchfrompage !== "true") return;

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
    
    if (links.length > 0) {
        var modals = rtwa_initModalLogic(); 
        rtwa_modal_open_func = modals[0];
        rtwa_modal_close_func = modals[1];

        if (response.linksfoundindicator === "true") {
            chrome.runtime.sendMessage({ action: "pageActionToggle" }); // V3: Consider chrome.action.setIcon or other indicators
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
                        // This needs to be more robust, perhaps by getting activeServerId from response.
                        let activeServer = servers.find(s => s.id === response.activeServerId) || servers[0];
                        
                        // Check for client-specific "ask" flags.
                        // These flags (e.g., "rutorrentdirlabelask") need to be defined in server objects.
                        // And mapped from our generic clientType (e.g., "rtorrent", "qbittorrent")
                        // For now, let's assume a generic 'askForLabelDirOnPage' flag.
                        // NEW PREFLIGHT LOGIC:
                        const pageUrl = window.location.href;
                        console.log("[RTWA ContentScript] Sending getTorrentAddPreflightInfo for:", url); // Log before sending
                        chrome.runtime.sendMessage(
                            { action: 'getTorrentAddPreflightInfo', linkUrl: url, pageUrl: pageUrl },
                            (preflightResponse) => {
                                console.log("[RTWA ContentScript] Received preflightResponse:", preflightResponse); // Log received response
                                if (chrome.runtime.lastError) {
                                    console.error("[RTWA ContentScript] Error in getTorrentAddPreflightInfo callback:", chrome.runtime.lastError.message);
                                    alert("Error checking server settings. Torrent not added.");
                                    return;
                                }

                                if (preflightResponse.error) {
                                    console.error("[RTWA ContentScript] Preflight error from background:", preflightResponse.error);
                                    alert(`Error: ${preflightResponse.error}. Torrent not added.`);
                                    return;
                                }

                                if (preflightResponse.shouldShowModal && preflightResponse.serverInfo) {
                                    console.log("[RTWA ContentScript] Preflight says show modal. ServerInfo:", preflightResponse.serverInfo);
                                    rtwa_showLabelDirChooser(response, preflightResponse.linkUrl, preflightResponse.serverInfo);
                                } else if (preflightResponse.addedDirectly) {
                                    console.log("[RTWA ContentScript] Torrent added directly by background script after preflight.");
                                } else {
                                    console.warn("[RTWA ContentScript] Preflight check indicated no modal and not added directly. Response:", preflightResponse);
                                }
                            }
                        );
                    }
                });
            }
        }
    }
}

// Register a listener for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "showLabelDirChooser" && request.url && request.settings) {
        var modals = rtwa_initModalLogic();
        rtwa_modal_open_func = modals[0];
        rtwa_modal_close_func = modals[1];
        
        rtwa_showLabelDirChooser(request.settings, request.url, request.server);
        sendResponse({}); 
        return true; 
    }
});

function rtwa_showLabelDirChooser(initialSettings, linkUrl, serverInfo) { 
    console.log("[RTWA ContentScript] rtwa_showLabelDirChooser called. LinkURL:", linkUrl, "ServerInfo:", serverInfo); // Log call
    if (typeof rtwa_modal_open_func !== 'function' || typeof rtwa_modal_close_func !== 'function') {
        console.error("[RTWA ContentScript] Modal: open/close functions not initialized before rtwa_showLabelDirChooser.");
        var modals = rtwa_initModalLogic();
        rtwa_modal_open_func = modals[0];
        rtwa_modal_close_func = modals[1];
    }

    // serverInfo now comes directly from background preflight, includes id, name, clientType, defaultLabel, defaultDir, dirlist (JSON string), labellist (JSON string)
    if (!serverInfo || !serverInfo.id) {
        console.error("RTWA Modal: Valid serverInfo not provided.");
        alert("Error: Server information missing for on-page dialog.");
        return;
    }
    
    // Parse dirlist and labellist from serverInfo (they are sent as JSON strings)
    let dirlist = [];
    try {
        dirlist = serverInfo.dirlist ? JSON.parse(serverInfo.dirlist) : [];
    } catch (e) {
        console.error("Error parsing dirlist from serverInfo:", e, serverInfo.dirlist);
    }
    let labellist = [];
    try {
        labellist = serverInfo.labellist ? JSON.parse(serverInfo.labellist) : [];
    } catch (e) {
        console.error("Error parsing labellist from serverInfo:", e, serverInfo.labellist);
    }

    // Remove existing modal if any
    const existingModal = document.getElementById('rtwa_modal_wrapper');
    if (existingModal) {
        existingModal.remove();
    }

    // Using Tailwind classes for styling the modal
    var adddialog = `
        <div id='rtwa_modal_wrapper' class='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999 p-4'>
            <div id='rtwa_modal_window' class='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-900 dark:text-gray-100'>
                <h2 class='text-lg font-semibold mb-4 text-gray-800 dark:text-white'>Select Label and Directory</h2>
                <form id='rtwa_addform' class='space-y-4'>
                    <div>
                        <label for='rtwa_adddialog_directory' class='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Directory:</label>
                        <div class='flex items-center space-x-2'>
                            <select id='rtwa_adddialog_directory' class='grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm'>`;
    for (var d_idx in dirlist) adddialog += `<option value="${escapeHtml(dirlist[d_idx])}">${escapeHtml(dirlist[d_idx])}</option>`;
    adddialog += `
                            </select>
                            <img id='rtwa_dirremover' src='${chrome.runtime.getURL("icons/icon_delete.svg")}' title='Remove selected directory from list' class='h-5 w-5 cursor-pointer text-gray-400 hover:text-red-500' />
                        </div>
                        <label for='rtwa_adddialog_directory_new' class='block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1'>Or new:</label>
                        <input id='rtwa_adddialog_directory_new' type='text' class='mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm' />
                    </div>
                    <div>
                        <label for='rtwa_adddialog_label' class='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Label:</label>
                        <div class='flex items-center space-x-2'>
                            <select id='rtwa_adddialog_label' class='grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm'>`;
    for (var l_idx in labellist) adddialog += `<option value="${escapeHtml(labellist[l_idx])}">${escapeHtml(labellist[l_idx])}</option>`;
    adddialog += `
                            </select>
                            <img id='rtwa_labelremover' src='${chrome.runtime.getURL("icons/icon_delete.svg")}' title='Remove selected label from list' class='h-5 w-5 cursor-pointer text-gray-400 hover:text-red-500' />
                        </div>
                        <label for='rtwa_adddialog_label_new' class='block text-xs font-medium text-gray-500 dark:text-gray-400 mt-1'>Or new:</label>
                        <input id='rtwa_adddialog_label_new' type='text' class='mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm' />
                    </div>
                    <div class='mt-6 flex justify-end space-x-3'>
                        <button type='button' id='rtwa_modal_cancel_button' class='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400'>Cancel</button>
                        <input id='rtwa_adddialog_submit' type='submit' value='Add Torrent' class='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer' />
                    </div>
                </form>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML("beforeend", adddialog);
    
    rtwa_modal_open_func();

    // Pre-fill new directory and label inputs with defaults from serverInfo
    const dirInputNew = document.getElementById("rtwa_adddialog_directory_new");
    const labelInputNew = document.getElementById("rtwa_adddialog_label_new");
    if (dirInputNew && serverInfo.defaultDir) dirInputNew.value = serverInfo.defaultDir;
    if (labelInputNew && serverInfo.defaultLabel) labelInputNew.value = serverInfo.defaultLabel;
    
    // Pre-select from dropdown if default matches an existing item
    const dirSelect = document.getElementById("rtwa_adddialog_directory");
    if (dirSelect && serverInfo.defaultDir && dirlist.includes(serverInfo.defaultDir)) {
        dirSelect.value = serverInfo.defaultDir;
    }
    const labelSelect = document.getElementById("rtwa_adddialog_label");
    if (labelSelect && serverInfo.defaultLabel && labellist.includes(serverInfo.defaultLabel)) {
        labelSelect.value = serverInfo.defaultLabel;
    }


    document.getElementById("rtwa_dirremover").onclick = function() {
        var selectElement = document.getElementById("rtwa_adddialog_directory");
        var toRemoveOption = selectElement.options[selectElement.selectedIndex];
        if (toRemoveOption && toRemoveOption.value) { // Ensure there's a value to remove
            var valueToRemove = toRemoveOption.value;
            var index = dirlist.indexOf(valueToRemove);
            if (index !== -1) {
                dirlist.splice(index, 1);
                toRemoveOption.remove();
                // Pass serverInfo.id to identify which server's lists to update
                setNewSettings(serverInfo.id, dirlist, labellist, null, null); 
            }
        }
    };
    document.getElementById("rtwa_labelremover").onclick = function() {
        var selectElement = document.getElementById("rtwa_adddialog_label");
        var toRemoveOption = selectElement.options[selectElement.selectedIndex];
        if (toRemoveOption && toRemoveOption.value) { // Ensure there's a value to remove
            var valueToRemove = toRemoveOption.value;
            var index = labellist.indexOf(valueToRemove);
            if (index !== -1) {
                labellist.splice(index, 1);
                toRemoveOption.remove();
                // Pass serverInfo.id
                setNewSettings(serverInfo.id, dirlist, labellist, null, null);
            }
        }
    };
    
    document.getElementById("rtwa_addform").onsubmit = function(event) {
        event.preventDefault(); 
        var selectedLabel = document.getElementById("rtwa_adddialog_label").value;
        var inputLabel = document.getElementById("rtwa_adddialog_label_new").value.trim();
        var selectedDir = document.getElementById("rtwa_adddialog_directory").value;
        var inputDir = document.getElementById("rtwa_adddialog_directory_new").value.trim();
        
        var targetLabel = (inputLabel === "") ? ((selectedLabel === null || selectedLabel === "undefined" || selectedLabel === "") ? serverInfo.defaultLabel : selectedLabel) : inputLabel;
        var targetDir = (inputDir === "") ? ((selectedDir === null || selectedDir === "undefined" || selectedDir === "") ? serverInfo.defaultDir : selectedDir) : inputDir;
        
        var ref = new URL(window.location.href);
        ref.hash = '';
        chrome.runtime.sendMessage({
            action: "addTorrent", 
            url: linkUrl, // Use linkUrl passed to this function
            label: targetLabel, 
            dir: targetDir, 
            server: serverInfo, // Send the serverInfo object received from preflight
            referer: ref.toString()
        });
        
        // Pass serverInfo.id
        setNewSettings(serverInfo.id, dirlist, labellist, targetDir || null, targetLabel || null); 
        
        rtwa_modal_close_func();
        return false;
    };

    document.getElementById("rtwa_modal_cancel_button").onclick = function() {
        rtwa_modal_close_func();
    };
}

function setNewSettings(targetServerId, baseDirs, baseLabels, newDir, newLabel) {
    // This function needs to get the *latest* settings from storage, modify, then save.
    chrome.runtime.sendMessage({ action: "getStorageData" }, function(response) {
        if (chrome.runtime.lastError || !response || !response.servers) {
            console.error("Error fetching latest settings in setNewSettings:", chrome.runtime.lastError?.message || "No response");
            return;
        }
        var servers = JSON.parse(response.servers); // servers is an array of server objects
        const serverIndexToUpdate = servers.findIndex(s => s.id === targetServerId);

        if (serverIndexToUpdate === -1) {
            console.error("Target server not found in setNewSettings for ID:", targetServerId);
            return;
        }
        var serverToUpdate = servers[serverIndexToUpdate];
        
        var newDirList = [...baseDirs]; // Clone
        var newLabelList = [...baseLabels]; // Clone

        if (newDir && newDir.trim() !== "") {
            var dirOldPos = newDirList.indexOf(newDir);
            if (dirOldPos !== -1) newDirList.splice(dirOldPos, 1);
            newDirList.unshift(newDir);
        }
        if (newLabel && newLabel.trim() !== "") {
            var labelOldPos = newLabelList.indexOf(newLabel);
            if (labelOldPos !== -1) newLabelList.splice(labelOldPos, 1);
            newLabelList.unshift(newLabel);
        }

        serverToUpdate.dirlist = JSON.stringify(newDirList.slice(0, 10)); // Keep only top 10 for example
        serverToUpdate.labellist = JSON.stringify(newLabelList.slice(0, 10)); // Keep only top 10

        servers[serverIndexToUpdate] = serverToUpdate; // Corrected index variable
        
        // Construct the full settings object to save
        let updatedSettingsToSave = { ...response }; // Start with all existing settings
        updatedSettingsToSave.servers = JSON.stringify(servers);

        chrome.runtime.sendMessage({ action: "setStorageData", data: updatedSettingsToSave });
    });
}

function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "'&quot;")
         .replace(/'/g, "&apos;");
}
