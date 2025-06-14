import { debug } from '../debug';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { debugEnabled } = await chrome.storage.local.get('bgDebugEnabled');
        debug.setEnabled(debugEnabled);
    } catch (error) {
        debug.setEnabled(true);
    }

    const activeServerSelect = document.getElementById('activeServerSelect');
    const lastActionStatusSpan = document.getElementById('lastActionStatus');
    const clearLastActionStatusButton = document.getElementById('clearLastActionStatusButton');
    const manualUrlInput = document.getElementById('manualUrlInput');
    const manualAddButton = document.getElementById('manualAddButton');
    const openOptionsButton = document.getElementById('openOptionsButton');

    // Active server details display elements
    const activeServerDetailsDiv = document.getElementById('activeServerDetails');
    const activeServerClientTypeSpan = document.getElementById('activeServerClientType'); // New
    const activeServerUrlSpan = document.getElementById('activeServerUrl');
    const activeServerTagsSpan = document.getElementById('activeServerTags');
    const activeServerCategorySpan = document.getElementById('activeServerCategory');
    const activeServerPausedSpan = document.getElementById('activeServerPaused');

    let servers = [];
    let currentActiveServerId = null;

    function displayActiveServerDetails(serverId) {
        const server = servers.find(s => s.id === serverId);
        if (server) {
            activeServerClientTypeSpan.textContent = server.clientType || 'qbittorrent'; // Display client type
            activeServerUrlSpan.textContent = server.url; // Use generic 'url'
            activeServerTagsSpan.textContent = server.tags || 'Not set';
            activeServerCategorySpan.textContent = server.category || 'Not set';
            activeServerPausedSpan.textContent = server.addPaused ? 'Yes' : 'No';
            activeServerDetailsDiv.style.display = 'block';
        } else {
            activeServerClientTypeSpan.textContent = 'N/A';
            activeServerUrlSpan.textContent = 'N/A';
            activeServerTagsSpan.textContent = 'N/A';
            activeServerCategorySpan.textContent = 'N/A';
            activeServerPausedSpan.textContent = 'N/A';
            activeServerDetailsDiv.style.display = 'none';
        }
    }

    function populateServerSelect() {
        activeServerSelect.innerHTML = ''; // Clear existing options

        if (servers.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No servers configured";
            activeServerSelect.appendChild(option);
            activeServerSelect.disabled = true;
            displayActiveServerDetails(null); // Clear details
            return;
        }
        activeServerSelect.disabled = false;

        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            if (server.id === currentActiveServerId) {
                option.selected = true;
            }
            activeServerSelect.appendChild(option);
        });
        displayActiveServerDetails(currentActiveServerId);
    }

    function loadPopupData() {
        chrome.storage.local.get(['servers', 'activeServerId', 'lastActionStatus'], (result) => {
            servers = (result.servers || []).map(s => ({ // Ensure clientType and correct url field
                ...s,
                clientType: s.clientType || 'qbittorrent',
                url: s.url || s.qbUrl 
            }));
            currentActiveServerId = result.activeServerId;

            if (!currentActiveServerId && servers.length > 0) {
                // If no active server is set but servers exist, default to the first one
                currentActiveServerId = servers[0].id;
                chrome.storage.local.set({ activeServerId: currentActiveServerId }); // Save this default
            } else if (currentActiveServerId && !servers.find(s => s.id === currentActiveServerId)) {
                // If activeServerId points to a non-existent server (e.g., deleted)
                currentActiveServerId = servers.length > 0 ? servers[0].id : null;
                chrome.storage.local.set({ activeServerId: currentActiveServerId });
            }
            
            populateServerSelect();

            if (result.lastActionStatus) {
                lastActionStatusSpan.textContent = result.lastActionStatus;
            } else {
                lastActionStatusSpan.textContent = 'N/A';
            }
        });
    }

    // Event listener for server selection change
    activeServerSelect.addEventListener('change', (event) => {
        const newActiveServerId = event.target.value;
        if (newActiveServerId) {
            currentActiveServerId = newActiveServerId;
            chrome.storage.local.set({ activeServerId: newActiveServerId }, () => {
                // debug.log('Active server changed to:', newActiveServerId);
                displayActiveServerDetails(newActiveServerId);
            });
        }
    });
    
    // Listener for storage changes to update the popup dynamically
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            let needsUIRefresh = false;
            if (changes.servers) {
                servers = changes.servers.newValue || [];
                needsUIRefresh = true;
            }
            if (changes.activeServerId) {
                currentActiveServerId = changes.activeServerId.newValue;
                 // If activeServerId changed, ensure it's valid against the current (possibly changed) server list
                if (currentActiveServerId && !servers.find(s => s.id === currentActiveServerId)) {
                    currentActiveServerId = servers.length > 0 ? servers[0].id : null;
                }
                needsUIRefresh = true;
            }
            if (changes.lastActionStatus) {
                lastActionStatusSpan.textContent = changes.lastActionStatus.newValue || 'N/A';
            }

            if(needsUIRefresh) {
                populateServerSelect(); // This will also update server details display
            }
        }
    });

    // Open options page
    openOptionsButton.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options/options.html'));
        }
    });

    // Initial load
    loadPopupData();

    // Event listener for Clear Last Action Status button
    clearLastActionStatusButton.addEventListener('click', () => {
        chrome.storage.local.set({ lastActionStatus: 'N/A' }, () => {
            lastActionStatusSpan.textContent = 'N/A';
            // debug.log('Last action status cleared.');
        });
    });

    // Event listener for Manual Add button
    manualAddButton.addEventListener('click', () => {
        const urlToAdd = manualUrlInput.value.trim();
        if (urlToAdd) {
            // We need to send this URL to the background script to be processed
            // similar to how context menu clicks are handled.
            // The background script will use the currently active server.
            chrome.runtime.sendMessage(
                { action: 'addTorrentManually', url: urlToAdd },
                (response) => {
                    if (chrome.runtime.lastError) {
                        // This typically won't be hit if background script is just queueing,
                        // but good to have for direct response issues.
                        lastActionStatusSpan.textContent = `Error: ${chrome.runtime.lastError.message}`;
                        // Optionally save this error to storage as well
                        // chrome.storage.local.set({ lastActionStatus: `Error: ${chrome.runtime.lastError.message}` });
                    } else if (response && response.status) {
                        // If background script sends an immediate status (e.g. validation error)
                        lastActionStatusSpan.textContent = response.status;
                        // chrome.storage.local.set({ lastActionStatus: response.status });
                    }
                    // Clear the input field after attempting to add
                    manualUrlInput.value = ''; 
                    // The actual success/failure message will be set by background.js 
                    // via storage change listener, which updates lastActionStatusSpan.
                }
            );
        } else {
            // Optionally provide feedback if URL is empty, though not strictly necessary
            // lastActionStatusSpan.textContent = "Please enter a URL.";
        }
    });
});
