import '../css/input.css'; // Import Tailwind CSS entry point

document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const serverFormSection = document.getElementById('serverFormSection');
    const serverFormTitle = document.getElementById('serverFormTitle');
    const serverIdInput = document.getElementById('serverId');
    const serverNameInput = document.getElementById('serverName');
    const clientTypeSelect = document.getElementById('clientType'); 
    const serverUrlInput = document.getElementById('qbUrl'); 
    const serverUsernameInput = document.getElementById('qbUsername'); 
    const serverPasswordInput = document.getElementById('qbPassword'); 
    const rpcPathGroup = document.getElementById('rpcPathGroup'); 
    const rpcPathInput = document.getElementById('rpcPath'); 
    const scgiPathGroup = document.getElementById('scgiPathGroup'); 
    const scgiPathInput = document.getElementById('scgiPath'); 
    const defaultTagsInput = document.getElementById('defaultTags');
    const defaultCategoryInput = document.getElementById('defaultCategory');
    const addPausedInput = document.getElementById('addPaused');
    const askForLabelDirOnPageInput = document.getElementById('askForLabelDirOnPage'); // Reference for the new checkbox
    const saveServerButton = document.getElementById('saveServerButton');
    const testConnectionButton = document.getElementById('testConnectionButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const formStatusMessageDiv = document.getElementById('formStatusMessage');

    // Server list elements
    const serverListSection = document.getElementById('serverListSection');
    const serverListUl = document.getElementById('serverList');
    const showAddServerFormButton = document.getElementById('showAddServerFormButton');

    // Global settings elements
    const showAdvancedAddDialogToggle = document.getElementById('showAdvancedAddDialogToggle');
    const enableUrlBasedServerSelectionToggle = document.getElementById('enableUrlBasedServerSelectionToggle');
    const catchFromPageToggle = document.getElementById('catchFromPageToggle'); 
    const linksFoundIndicatorToggle = document.getElementById('linksFoundIndicatorToggle'); 
    const linkMatchesInput = document.getElementById('linkMatchesInput'); 
    const registerDelayInput = document.getElementById('registerDelayInput'); 

    // URL Mapping elements
    const urlMappingSection = document.getElementById('urlMappingSection'); 
    const mappingsListContainer = document.getElementById('mappingsListContainer');
    const urlMappingsListUl = document.getElementById('urlMappingsList');
    const showAddMappingFormButton = document.getElementById('showAddMappingFormButton');
    const mappingFormSection = document.getElementById('mappingFormSection');
    const mappingFormTitle = document.getElementById('mappingFormTitle');
    const mappingIdInput = document.getElementById('mappingId');
    const websitePatternInput = document.getElementById('websitePatternInput');
    const mapToServerSelect = document.getElementById('mapToServerSelect');
    const saveMappingButton = document.getElementById('saveMappingButton');
    const cancelMappingEditButton = document.getElementById('cancelMappingEditButton');
    const mappingFormStatusMessageDiv = document.getElementById('mappingFormStatusMessage');

    // Backup/Restore elements
    const exportSettingsButton = document.getElementById('exportSettingsButton');
    const importSettingsFile = document.getElementById('importSettingsFile');
    const importSettingsButton = document.getElementById('importSettingsButton');
    const backupStatusMessageDiv = document.getElementById('backupStatusMessage');

    // Footer elements
    const extensionVersionSpan = document.getElementById('extensionVersion');
    const developerLink = document.getElementById('developerLink');


    let servers = [];
    let activeServerId = null;
    let globalSettings = {
        showAdvancedAddDialog: false,
        enableUrlBasedServerSelection: false,
        catchfrompage: false, 
        linksfoundindicator: false, 
        linkmatches: '', 
        registerDelay: 0 
    };
    let urlToServerMappings = [];

    // --- Utility Functions ---
    function generateId() {
        return `server-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    function displayFormStatus(message, type) {
        formStatusMessageDiv.textContent = message;
        formStatusMessageDiv.className = 'mt-4 text-sm p-3 rounded-md border'; // Base classes
        if (type === 'success') {
            formStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            formStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else { // Neutral / info
            formStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                formStatusMessageDiv.textContent = '';
                formStatusMessageDiv.className = 'mt-4 text-sm'; // Reset to base, effectively hiding it if no content
            }, 5000);
        } else if (!message) {
             formStatusMessageDiv.className = 'mt-4 text-sm'; // Hide if no message
        }
    }
    
    function displayMappingFormStatus(message, type) {
        mappingFormStatusMessageDiv.textContent = message;
        mappingFormStatusMessageDiv.className = 'mt-3 text-sm p-3 rounded-md border'; // Base classes
        if (type === 'success') {
            mappingFormStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            mappingFormStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else {
            mappingFormStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }

        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                mappingFormStatusMessageDiv.textContent = '';
                mappingFormStatusMessageDiv.className = 'mt-3 text-sm';
            }, 5000);
        } else if (!message) {
            mappingFormStatusMessageDiv.className = 'mt-3 text-sm';
        }
    }

    function displayBackupStatus(message, type) {
        backupStatusMessageDiv.textContent = message;
        backupStatusMessageDiv.className = 'mt-4 text-sm p-3 rounded-md border'; // Base classes
        if (type === 'success') {
            backupStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            backupStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else {
            backupStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                backupStatusMessageDiv.textContent = '';
                backupStatusMessageDiv.className = 'mt-4 text-sm';
            }, 5000);
        } else if (!message) {
            backupStatusMessageDiv.className = 'mt-4 text-sm';
        }
    }

    function toggleClientSpecificFields(clientType) {
        rpcPathGroup.style.display = clientType === 'transmission' ? 'block' : 'none';
        scgiPathGroup.style.display = clientType === 'rtorrent' ? 'block' : 'none';
        
        const serverUrlLabel = document.querySelector('label[for="qbUrl"]');
        if (clientType === 'rtorrent') {
            serverUrlLabel.textContent = 'rTorrent Web UI URL (e.g., ruTorrent, optional if SCGI direct):';
        } else {
            serverUrlLabel.textContent = 'Server URL (e.g., http://localhost:8080 or http://localhost:9091):';
        }
    }

    function showServerForm(isEditing = false, server = null) {
        serverListSection.style.display = 'none';
        serverFormSection.style.display = 'block';
        serverFormTitle.textContent = isEditing ? 'Edit Server Profile' : 'Add New Server Profile';
        let currentClientType = 'qbittorrent'; 

        if (isEditing && server) {
            serverIdInput.value = server.id;
            serverNameInput.value = server.name;
            clientTypeSelect.value = server.clientType || 'qbittorrent';
            currentClientType = clientTypeSelect.value;
            serverUrlInput.value = server.url; 
            serverUsernameInput.value = server.username; 
            serverPasswordInput.value = server.password; 
            rpcPathInput.value = server.rpcPath || ''; 
            scgiPathInput.value = server.scgiPath || ''; 
            defaultTagsInput.value = server.tags || '';
            defaultCategoryInput.value = server.category || '';
            addPausedInput.checked = server.addPaused || false;
            askForLabelDirOnPageInput.checked = server.askForLabelDirOnPage || false; // Load new flag
        } else {
            serverIdInput.value = ''; 
            serverNameInput.value = '';
            clientTypeSelect.value = 'qbittorrent';
            currentClientType = clientTypeSelect.value;
            serverUrlInput.value = '';
            serverUsernameInput.value = '';
            serverPasswordInput.value = '';
            rpcPathInput.value = ''; 
            scgiPathInput.value = ''; 
            defaultTagsInput.value = '';
            defaultCategoryInput.value = '';
            addPausedInput.checked = false;
            askForLabelDirOnPageInput.checked = false; // Default for new server
        }
        toggleClientSpecificFields(currentClientType); 
        formStatusMessageDiv.textContent = '';
        formStatusMessageDiv.className = 'status-message';
    }

    function hideServerForm() {
        serverFormSection.style.display = 'none';
        serverListSection.style.display = 'block';
        serverIdInput.value = '';
        serverNameInput.value = '';
        clientTypeSelect.value = 'qbittorrent';
        serverUrlInput.value = '';
        serverUsernameInput.value = '';
        serverPasswordInput.value = '';
        rpcPathInput.value = ''; 
        scgiPathInput.value = ''; 
        defaultTagsInput.value = '';
        defaultCategoryInput.value = '';
        addPausedInput.checked = false;
        askForLabelDirOnPageInput.checked = false; // Clear new flag
        formStatusMessageDiv.textContent = '';
        formStatusMessageDiv.className = 'status-message';
        toggleClientSpecificFields('qbittorrent'); 
    }

    function renderServerList() {
        // Show loading state initially
        serverListUl.innerHTML = '<li class="text-gray-500 dark:text-gray-400 italic">Loading server profiles...</li>';

        // The actual rendering will happen once 'servers' data is loaded by loadSettings.
        // This function is called from loadSettings AFTER data is fetched.
        // So, the "Loading..." message will be quickly replaced.
        // If the goal is to show "Loading..." *before* chrome.storage.local.get finishes,
        // then this initial message should be in the HTML or set before calling loadSettings.
        // For now, let's ensure it's cleared and correctly updated.

        serverListUl.innerHTML = ''; // Clear loading message or previous list

        if (servers.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No server profiles configured yet.';
            li.className = 'text-gray-500 dark:text-gray-400 italic p-4 text-center'; // Added padding and centering
            serverListUl.appendChild(li);
            return;
        }
        servers.forEach(server => {
            const li = document.createElement('li');
            // Added explicit background for light mode to differentiate from section background
            li.className = `p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow`;
            if (server.id === activeServerId) {
                li.classList.add('active-server-item'); 
                // For active server, let's ensure a distinct background that works with its text colors
                li.classList.remove('bg-white', 'dark:bg-gray-700'); // remove default
                li.classList.add('bg-blue-50', 'dark:bg-blue-900/30'); // Light blue for active
            }

            const serverInfoDiv = document.createElement('div');
            serverInfoDiv.className = 'grow';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-semibold text-lg text-gray-800 dark:text-white';
            nameSpan.textContent = server.name;
            serverInfoDiv.appendChild(nameSpan);

            if (server.id === activeServerId) {
                const activeBadge = document.createElement('span');
                // Flipped dark mode contrast for badge: darker text on a lighter green background
                activeBadge.className = 'ml-2 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-200 dark:text-green-700 dark:bg-green-300 rounded-full';
                activeBadge.textContent = 'Active';
                nameSpan.appendChild(activeBadge);
            }
            
            const clientTypeSpan = document.createElement('p');
            clientTypeSpan.className = 'text-sm text-gray-500 dark:text-gray-400';
            clientTypeSpan.textContent = `Client: ${server.clientType || 'N/A'}`;
            serverInfoDiv.appendChild(clientTypeSpan);

            const urlSpan = document.createElement('p');
            urlSpan.className = 'text-sm text-gray-500 dark:text-gray-400 break-all';
            urlSpan.textContent = `URL: ${server.url}`;
            serverInfoDiv.appendChild(urlSpan);

            li.appendChild(serverInfoDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions flex space-x-2 shrink-0 mt-2 md:mt-0';
            
            const editButton = document.createElement('button');
            editButton.className = 'edit-button px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-500';
            editButton.dataset.id = server.id;
            editButton.textContent = 'Edit';
            actionsDiv.appendChild(editButton);

            const deleteButton = document.createElement('button');
            // Ensuring delete button has explicit text color for dark mode if needed, though white on red should be fine.
            // The main issue is if bg-red-xxx is not applying. Let's use consistent red shades.
            deleteButton.className = 'delete-button px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700';
            deleteButton.dataset.id = server.id;
            deleteButton.textContent = 'Delete';
            actionsDiv.appendChild(deleteButton);

            li.appendChild(actionsDiv);
            serverListUl.appendChild(li);
        });

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEditServer);
        });
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDeleteServer);
        });
    }

    // --- Event Handlers ---
    showAddServerFormButton.addEventListener('click', () => {
        showServerForm(false);
    });

    cancelEditButton.addEventListener('click', () => {
        hideServerForm();
    });

    saveServerButton.addEventListener('click', () => {
        const id = serverIdInput.value;
        const name = serverNameInput.value.trim();
        const clientType = clientTypeSelect.value;
        const url = serverUrlInput.value.trim();
        const username = serverUsernameInput.value.trim();
        const password = serverPasswordInput.value;
        const rpcPath = rpcPathInput.value.trim();
        const scgiPath = scgiPathInput.value.trim(); 
        const tags = defaultTagsInput.value.trim();
        const category = defaultCategoryInput.value.trim();
        const addPaused = addPausedInput.checked;
        const askForLabelDirOnPage = askForLabelDirOnPageInput.checked; // Get new flag

        if (!name || !url) {
            displayFormStatus('Server Name and URL are required.', 'error');
            return;
        }
        try {
            new URL(url); 
        } catch (e) {
            displayFormStatus('Invalid Server URL format.', 'error');
            return;
        }

        const serverData = { name, clientType, url, username, password, tags, category, addPaused, askForLabelDirOnPage }; // Add new flag
        if (clientType === 'transmission') {
            serverData.rpcPath = rpcPath;
        } else if (clientType === 'rtorrent') {
            serverData.scgiPath = scgiPath; 
        }

        if (id) { 
            const index = servers.findIndex(s => s.id === id);
            if (index > -1) {
                servers[index] = { ...servers[index], ...serverData };
            }
        } else { 
            serverData.id = generateId();
            servers.push(serverData);
            if (servers.length === 1 && !activeServerId) {
                activeServerId = serverData.id;
            }
        }
        
        chrome.permissions.request({ origins: [`${new URL(url).origin}/`] }, (granted) => {
            if (granted) {
                chrome.storage.local.set({ servers, activeServerId }, () => {
                    displayFormStatus(id ? 'Server updated successfully!' : 'Server added successfully!', 'success');
                    loadSettings(); 
                    setTimeout(hideServerForm, 1000); 
                });
            } else {
                displayFormStatus('Host permission denied. Cannot save server that requires new permissions.', 'error');
                if (!id) servers.pop(); 
            }
        });
    });

    function handleEditServer(event) {
        const serverIdToEdit = event.target.dataset.id;
        const serverToEdit = servers.find(s => s.id === serverIdToEdit);
        if (serverToEdit) {
            showServerForm(true, serverToEdit);
        }
    }

    function handleDeleteServer(event) {
        const serverIdToDelete = event.target.dataset.id;
        if (confirm(`Are you sure you want to delete server: ${servers.find(s=>s.id === serverIdToDelete)?.name}?`)) {
            servers = servers.filter(s => s.id !== serverIdToDelete);
            if (activeServerId === serverIdToDelete) {
                activeServerId = servers.length > 0 ? servers[0].id : null; 
            }
            chrome.storage.local.set({ servers, activeServerId }, () => {
                alert('Server deleted.'); 
                loadSettings();
            });
        }
    }
    
    testConnectionButton.addEventListener('click', () => {
        const serverConfig = {
            id: serverIdInput.value, 
            name: serverNameInput.value.trim(),
            clientType: clientTypeSelect.value,
            url: serverUrlInput.value.trim(),
            username: serverUsernameInput.value.trim(),
            password: serverPasswordInput.value,
            rpcPath: clientTypeSelect.value === 'transmission' ? rpcPathInput.value.trim() : undefined,
            scgiPath: clientTypeSelect.value === 'rtorrent' ? scgiPathInput.value.trim() : undefined,
        };

        if (!serverConfig.url && clientTypeSelect.value !== 'rtorrent') { 
            displayFormStatus('Server URL is required to test connection.', 'error');
            return;
        }
        if (clientTypeSelect.value === 'rtorrent' && !serverConfig.scgiPath && !serverConfig.url) {
            displayFormStatus('For rTorrent, either Server URL (for WebUI) or SCGI/HTTPRPC URL is required.', 'error');
            return;
        }
        if (serverConfig.url) {
            try {
                new URL(serverConfig.url);
            } catch (e) {
                displayFormStatus('Invalid Server URL format.', 'error');
                return;
            }
        }
        if (serverConfig.scgiPath) {
             try {
                new URL(serverConfig.scgiPath); 
            } catch (e) {
                if (serverConfig.scgiPath.startsWith('http://') || serverConfig.scgiPath.startsWith('https://') || serverConfig.scgiPath.startsWith('scgi://')) {
                    displayFormStatus('Invalid SCGI/HTTPRPC URL format.', 'error');
                    return;
                }
            }
        }

        if (!serverConfig.clientType) { // This check was duplicated, one is enough
            displayFormStatus('Client Type is required to test connection.', 'error');
            return;
        }

        displayFormStatus('Testing connection...', ''); 

        chrome.permissions.contains({ origins: [`${new URL(serverConfig.url).origin}/`] }, (granted) => {
            if (granted) {
                chrome.runtime.sendMessage(
                    { action: 'testConnection', config: serverConfig }, 
                    (response) => {
                        if (chrome.runtime.lastError) {
                            displayFormStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                        } else if (response) {
                            if (response.success) {
                                displayFormStatus('Connection successful!', 'success');
                            } else {
                                let errorMessage = "Connection failed.";
                                if (response.error && response.error.userMessage) {
                                    errorMessage = `Connection failed: ${response.error.userMessage}`;
                                    if (response.error.technicalDetail) console.error("Technical details for connection failure:", response.error.technicalDetail);
                                } else if (response.message) {
                                    errorMessage = `Connection failed: ${response.message}`;
                                } else if (response.error) { // Fallback if error is not the structured object
                                    errorMessage = `Connection failed: ${JSON.stringify(response.error)}`;
                                }
                                displayFormStatus(errorMessage, 'error');
                            }
                        } else {
                            displayFormStatus('No response from service worker.', 'error');
                        }
                    }
                );
            } else {
                 displayFormStatus('Host permission not granted for this URL. Please save the server configuration first to request permission.', 'error');
            }
        });
    });

    // --- Event Handlers for Global Settings ---
    clientTypeSelect.addEventListener('change', (event) => { 
        toggleClientSpecificFields(event.target.value);
    });

    showAdvancedAddDialogToggle.addEventListener('change', () => {
        globalSettings.showAdvancedAddDialog = showAdvancedAddDialogToggle.checked;
        chrome.storage.local.set({ showAdvancedAddDialog: globalSettings.showAdvancedAddDialog }, () => {
            displayFormStatus('Global settings updated.', 'success'); 
        });
    });

    catchFromPageToggle.addEventListener('change', () => {
        globalSettings.catchfrompage = catchFromPageToggle.checked;
        chrome.storage.local.set({ catchfrompage: globalSettings.catchfrompage }, () => {
            displayFormStatus('Global settings updated.', 'success');
        });
    });

    linksFoundIndicatorToggle.addEventListener('change', () => {
        globalSettings.linksfoundindicator = linksFoundIndicatorToggle.checked;
        chrome.storage.local.set({ linksfoundindicator: globalSettings.linksfoundindicator }, () => {
            displayFormStatus('Global settings updated.', 'success');
        });
    });

    linkMatchesInput.addEventListener('change', () => { 
        globalSettings.linkmatches = linkMatchesInput.value;
        chrome.storage.local.set({ linkmatches: globalSettings.linkmatches }, () => {
            displayFormStatus('Global settings updated.', 'success');
        });
    });

    registerDelayInput.addEventListener('change', () => { 
        globalSettings.registerDelay = parseInt(registerDelayInput.value, 10) || 0;
        chrome.storage.local.set({ registerDelay: globalSettings.registerDelay }, () => {
            displayFormStatus('Global settings updated.', 'success');
        });
    });

    // --- Event Handlers for Backup/Restore ---
    exportSettingsButton.addEventListener('click', () => {
        const settingsToExport = {
            servers,
            activeServerId,
            ...globalSettings, // Spread all global settings
            urlToServerMappings
        };

        const jsonString = JSON.stringify(settingsToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'RemoteTorrentAdder_settings.json'; // Updated filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        displayBackupStatus('Settings exported successfully.', 'success');
    });

    importSettingsButton.addEventListener('click', () => {
        const file = importSettingsFile.files[0];
        if (!file) {
            displayBackupStatus('Please select a file to import.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSettings = JSON.parse(event.target.result);
                
                if (!importedSettings || typeof importedSettings.servers === 'undefined') { 
                    throw new Error('Invalid settings file structure.');
                }

                if (confirm('This will overwrite your current settings. Are you sure you want to import?')) {
                    const newServers = (importedSettings.servers || []).map(s => ({
                        ...s,
                        clientType: s.clientType || 'qbittorrent',
                        askForLabelDirOnPage: s.askForLabelDirOnPage || false // Ensure new flag on import
                    }));
                    let newActiveServerId = importedSettings.activeServerId || null;
                    
                    if (newActiveServerId && !newServers.find(s => s.id === newActiveServerId)) {
                        newActiveServerId = newServers.length > 0 ? newServers[0].id : null;
                    }
                     if (!newActiveServerId && newServers.length > 0) {
                        newActiveServerId = newServers[0].id;
                    }

                    const settingsToSave = {
                        servers: newServers,
                        activeServerId: newActiveServerId,
                        showAdvancedAddDialog: importedSettings.showAdvancedAddDialog || false,
                        enableUrlBasedServerSelection: importedSettings.enableUrlBasedServerSelection || false,
                        urlToServerMappings: importedSettings.urlToServerMappings || [],
                        catchfrompage: importedSettings.catchfrompage || false, 
                        linksfoundindicator: importedSettings.linksfoundindicator || false, 
                        linkmatches: importedSettings.linkmatches || '', 
                        registerDelay: importedSettings.registerDelay || 0 
                    };

                    chrome.storage.local.set(settingsToSave, () => {
                        displayBackupStatus('Settings imported successfully! Reloading...', 'success');
                        loadSettings(); 
                    });
                }
            } catch (e) {
                displayBackupStatus(`Error importing settings: ${e.message}`, 'error');
            }
        };
        reader.readAsText(file);
        importSettingsFile.value = ''; 
    });

    // --- Initialization ---
    function loadSettings() {
        // Populate version in footer
        if (extensionVersionSpan) {
            const manifest = chrome.runtime.getManifest();
            extensionVersionSpan.textContent = manifest.version;
        }
        // TODO: Update developerLink.href when a link is available

        chrome.storage.local.get([
            'servers', 
            'activeServerId', 
            'showAdvancedAddDialog',
            'enableUrlBasedServerSelection', 
            'urlToServerMappings',
            'catchfrompage', 
            'linksfoundindicator', 
            'linkmatches', 
            'registerDelay' 
        ], (result) => {
            servers = (result.servers || []).map(s => ({
                ...s, 
                clientType: s.clientType || 'qbittorrent', 
                url: s.url || s.qbUrl, 
                username: s.username || s.qbUsername,
                password: s.password || s.qbPassword,
                rpcPath: s.rpcPath || (s.clientType === 'transmission' ? '/transmission/rpc' : ''), 
                scgiPath: s.scgiPath || '',
                askForLabelDirOnPage: s.askForLabelDirOnPage || false // Load new flag, default to false
            }));
            activeServerId = result.activeServerId || (servers.length > 0 ? servers[0].id : null);
            
            globalSettings.showAdvancedAddDialog = result.showAdvancedAddDialog || false;
            showAdvancedAddDialogToggle.checked = globalSettings.showAdvancedAddDialog;
            
            globalSettings.enableUrlBasedServerSelection = result.enableUrlBasedServerSelection || false;
            enableUrlBasedServerSelectionToggle.checked = globalSettings.enableUrlBasedServerSelection; 

            urlToServerMappings = result.urlToServerMappings || [];
            toggleMappingListVisibility(); 

            globalSettings.catchfrompage = result.catchfrompage || false; 
            catchFromPageToggle.checked = globalSettings.catchfrompage;

            globalSettings.linksfoundindicator = result.linksfoundindicator || false; 
            linksFoundIndicatorToggle.checked = globalSettings.linksfoundindicator;

            globalSettings.linkmatches = result.linkmatches || '';
            linkMatchesInput.value = globalSettings.linkmatches;

            globalSettings.registerDelay = result.registerDelay || 0; 
            registerDelayInput.value = globalSettings.registerDelay;

            if (activeServerId && !servers.find(s => s.id === activeServerId)) {
                activeServerId = servers.length > 0 ? servers[0].id : null;
            }
             if (!activeServerId && servers.length > 0) { 
                activeServerId = servers[0].id;
            }
            
            renderServerList();
            renderUrlMappingsList();
            populateMapToServerSelect(); 
        });
    }
    
    // --- URL Mapping Functions ---
    function generateMappingId() {
        return `map-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    function toggleMappingListVisibility() {
        mappingsListContainer.style.display = globalSettings.enableUrlBasedServerSelection ? 'block' : 'none';
        if (!globalSettings.enableUrlBasedServerSelection) {
            hideMappingForm(); 
        }
    }

    function populateMapToServerSelect() {
        mapToServerSelect.innerHTML = '<option value="">-- Select Server --</option>';
        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            mapToServerSelect.appendChild(option);
        });
    }

    function renderUrlMappingsList() {
        urlMappingsListUl.innerHTML = '';
        if (!globalSettings.enableUrlBasedServerSelection || urlToServerMappings.length === 0) {
            urlMappingsListUl.innerHTML = '<li>No URL mapping rules configured (or feature disabled).</li>';
            return;
        }
        urlToServerMappings.forEach((mapping, index) => {
            const li = document.createElement('li');
            const serverName = servers.find(s => s.id === mapping.serverId)?.name || 'Unknown Server';
            li.innerHTML = `
                <span>${index + 1}. Pattern: <span class="pattern">${mapping.websitePattern}</span> &rarr; <span class="target-server-name">${serverName}</span></span>
                <span class="actions">
                    <button class="edit-mapping-button" data-id="${mapping.id}">Edit</button>
                    <button class="delete-mapping-button" data-id="${mapping.id}">Delete</button>
                    ${index > 0 ? `<button class="move-mapping-up-button" data-id="${mapping.id}" title="Move Up">&uarr;</button>` : ''}
                    ${index < urlToServerMappings.length - 1 ? `<button class="move-mapping-down-button" data-id="${mapping.id}" title="Move Down">&darr;</button>` : ''}
                </span>
            `;
            urlMappingsListUl.appendChild(li);
        });

        document.querySelectorAll('.edit-mapping-button').forEach(b => b.addEventListener('click', handleEditMapping));
        document.querySelectorAll('.delete-mapping-button').forEach(b => b.addEventListener('click', handleDeleteMapping));
        document.querySelectorAll('.move-mapping-up-button').forEach(b => b.addEventListener('click', handleMoveMappingUp));
        document.querySelectorAll('.move-mapping-down-button').forEach(b => b.addEventListener('click', handleMoveMappingDown));
    }

    function showMappingForm(isEditing = false, mapping = null) {
        mappingFormSection.style.display = 'block';
        mappingFormTitle.textContent = isEditing ? 'Edit URL Rule' : 'Add New URL Rule';
        populateMapToServerSelect(); 

        if (isEditing && mapping) {
            mappingIdInput.value = mapping.id;
            websitePatternInput.value = mapping.websitePattern;
            mapToServerSelect.value = mapping.serverId;
        } else {
            mappingIdInput.value = '';
            websitePatternInput.value = '';
            mapToServerSelect.value = '';
        }
        displayMappingFormStatus('', '');
    }

    function hideMappingForm() {
        mappingFormSection.style.display = 'none';
        mappingIdInput.value = '';
        websitePatternInput.value = '';
        mapToServerSelect.value = '';
        displayMappingFormStatus('', '');
    }
    
    // --- Event Handlers for URL Mappings ---
    enableUrlBasedServerSelectionToggle.addEventListener('change', () => {
        globalSettings.enableUrlBasedServerSelection = enableUrlBasedServerSelectionToggle.checked;
        chrome.storage.local.set({ enableUrlBasedServerSelection: globalSettings.enableUrlBasedServerSelection }, () => {
            displayFormStatus('Global settings updated.', 'success');
            toggleMappingListVisibility();
            renderUrlMappingsList(); 
        });
    });

    showAddMappingFormButton.addEventListener('click', () => showMappingForm(false));
    cancelMappingEditButton.addEventListener('click', hideMappingForm);

    saveMappingButton.addEventListener('click', () => {
        const id = mappingIdInput.value;
        const websitePattern = websitePatternInput.value.trim();
        const serverId = mapToServerSelect.value;

        if (!websitePattern || !serverId) {
            displayMappingFormStatus('Website Pattern and Target Server are required.', 'error');
            return;
        }

        const mappingData = { websitePattern, serverId };

        if (id) { 
            const index = urlToServerMappings.findIndex(m => m.id === id);
            if (index > -1) {
                urlToServerMappings[index] = { ...urlToServerMappings[index], ...mappingData };
            }
        } else { 
            mappingData.id = generateMappingId();
            urlToServerMappings.push(mappingData);
        }
        chrome.storage.local.set({ urlToServerMappings }, () => {
            displayMappingFormStatus(id ? 'Rule updated!' : 'Rule added!', 'success');
            loadSettings(); 
            setTimeout(hideMappingForm, 1000);
        });
    });

    function handleEditMapping(event) {
        const idToEdit = event.target.dataset.id;
        const mappingToEdit = urlToServerMappings.find(m => m.id === idToEdit);
        if (mappingToEdit) showMappingForm(true, mappingToEdit);
    }

    function handleDeleteMapping(event) {
        const idToDelete = event.target.dataset.id;
        const mappingToDelete = urlToServerMappings.find(m => m.id === idToDelete);
        if (confirm(`Delete rule: "${mappingToDelete?.websitePattern}"?`)) {
            urlToServerMappings = urlToServerMappings.filter(m => m.id !== idToDelete);
            chrome.storage.local.set({ urlToServerMappings }, () => {
                displayMappingFormStatus('Rule deleted.', 'success'); 
                loadSettings();
            });
        }
    }
    
    function moveMapping(id, direction) { 
        const index = urlToServerMappings.findIndex(m => m.id === id);
        if (index === -1) return;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= urlToServerMappings.length) return;

        const item = urlToServerMappings.splice(index, 1)[0];
        urlToServerMappings.splice(newIndex, 0, item);
        chrome.storage.local.set({ urlToServerMappings }, () => loadSettings());
    }

    function handleMoveMappingUp(event) { moveMapping(event.target.dataset.id, -1); }
    function handleMoveMappingDown(event) { moveMapping(event.target.dataset.id, 1); }

    loadSettings(); // Initial load
});
