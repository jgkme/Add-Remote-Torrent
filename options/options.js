import '../css/input.css';
import { debug } from '../debug'; // Import Tailwind CSS entry point

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { debugEnabled } = await chrome.storage.local.get('bgDebugEnabled');
        debug.setEnabled(debugEnabled);
    } catch (error) {
        debug.setEnabled(true);
    }

    document.getElementById('accordion-1').addEventListener('click', (e) => {
        const index = 1;
        const content = document.getElementById(`content-${index}`);
        const icon = document.getElementById(`icon-${index}`);

        // Toggle the content's max-height for smooth opening and closing
        if (content.style.maxHeight && content.style.maxHeight !== '0px') {
            content.style.maxHeight = '0';
            icon.classList.remove('rotate-180');
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.classList.add('rotate-180');
        }
    })

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
    const ruTorrentPathGroup = document.getElementById('ruTorrentPathGroup');
    const ruTorrentPathInput = document.getElementById('ruTorrentPath');
    const ruTorrentOptions = document.getElementById('ruTorrentOptions');
    const rutorrentdontaddnamepathInput = document.getElementById('rutorrentdontaddnamepath');
    const rutorrentalwaysurlInput = document.getElementById('rutorrentalwaysurl');
    const defaultTagsInput = document.getElementById('defaultTags');
    const defaultCategoryInput = document.getElementById('defaultCategory');
    const categoriesInput = document.getElementById('categories');
    const addPausedInput = document.getElementById('addPaused');
    const askForLabelDirOnPageInput = document.getElementById('askForLabelDirOnPage'); 
    const saveServerButton = document.getElementById('saveServerButton');
    const testConnectionButton = document.getElementById('testConnectionButton');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const formStatusMessageDiv = document.getElementById('formStatusMessage');

    // Server list elements
    const serverListSection = document.getElementById('serverListSection');
    const serverListUl = document.getElementById('serverList');
    const showAddServerFormButton = document.getElementById('showAddServerFormButton');

    // Global settings elements
    const advancedAddDialogInput = document.getElementById('advancedAddDialogInput');
    const enableUrlBasedServerSelectionToggle = document.getElementById('enableUrlBasedServerSelectionToggle');
    const catchFromPageToggle = document.getElementById('catchFromPageToggle'); 
    const linksFoundIndicatorToggle = document.getElementById('linksFoundIndicatorToggle'); 
    const linkMatchesInput = document.getElementById('linkMatchesInput'); 
    const registerDelayInput = document.getElementById('registerDelayInput'); 
    const enableSoundNotificationsToggle = document.getElementById('enableSoundNotificationsToggle');
    const enableServerSpecificContextMenuToggle = document.getElementById('enableServerSpecificContextMenuToggle'); 

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

    // Tracker URL Rule elements
    const trackerUrlRulesSection = document.getElementById('trackerUrlRulesSection');
    const trackerRulesListContainer = document.getElementById('trackerRulesListContainer');
    const trackerUrlRulesListUl = document.getElementById('trackerUrlRulesList');
    const showAddTrackerRuleFormButton = document.getElementById('showAddTrackerRuleFormButton');
    const trackerRuleFormSection = document.getElementById('trackerRuleFormSection');
    const trackerRuleFormTitle = document.getElementById('trackerRuleFormTitle');
    const trackerRuleIdInput = document.getElementById('trackerRuleId');
    const trackerUrlPatternInput = document.getElementById('trackerUrlPatternInput');
    const trackerRuleLabelInput = document.getElementById('trackerRuleLabelInput');
    const trackerRuleDirectoryInput = document.getElementById('trackerRuleDirectoryInput');
    const saveTrackerRuleButton = document.getElementById('saveTrackerRuleButton');
    const cancelTrackerRuleEditButton = document.getElementById('cancelTrackerRuleEditButton');
    const trackerRuleFormStatusMessageDiv = document.getElementById('trackerRuleFormStatusMessage');

    // Backup/Restore elements
    const exportSettingsButton = document.getElementById('exportSettingsButton');
    const importSettingsFile = document.getElementById('importSettingsFile');
    const importSettingsButton = document.getElementById('importSettingsButton');
    const backupStatusMessageDiv = document.getElementById('backupStatusMessage');

    // Specific field groups for dynamic visibility (ensure these are defined if not already)
    const usernameGroup = document.getElementById('usernameGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const serverUrlLabel = document.querySelector('label[for="qbUrl"]'); // qbUrl is the ID of serverUrlInput

    // Debug & Log elements
    const contentDebugEnabled_log = document.getElementById('contentDebugEnabled_log');
    const contentDebugEnabled_warn = document.getElementById('contentDebugEnabled_warn');
    const contentDebugEnabled_error = document.getElementById('contentDebugEnabled_error');
    const contentDebugEnabled_default = document.getElementById('contentDebugEnabled_default');
    const bgDebugEnabled_log = document.getElementById('bgDebugEnabled_log');
    const bgDebugEnabled_warn = document.getElementById('bgDebugEnabled_warn');
    const bgDebugEnabled_error = document.getElementById('bgDebugEnabled_error');
    const bgDebugEnabled_default = document.getElementById('bgDebugEnabled_default');

    // Footer elements
    const extensionVersionSpan = document.getElementById('extensionVersion');
    const developerLink = document.getElementById('developerLink');

    let servers = [];
    let activeServerId = null;
    let globalSettings = {
        advancedAddDialog: 'never',
        enableUrlBasedServerSelection: false,
        catchfrompage: false, 
        linksfoundindicator: false, 
        linkmatches: '', 
        registerDelay: 0,
        enableSoundNotifications: false,
        enableServerSpecificContextMenu: false,
        contentDebugEnabled: ['error'], // Default error logging enabled in content scripts
        bgDebugEnabled: ['log', 'warn', 'error'] // Default to all enabled in background
    };
    let urlToServerMappings = [];
    let trackerUrlRules = []; 

    // --- Utility Functions ---
    function generateId(prefix = 'server') { 
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    function displayFormStatus(message, type) {
        formStatusMessageDiv.textContent = message;
        formStatusMessageDiv.className = 'mt-4 text-sm p-3 rounded-md border'; 
        if (type === 'success') {
            formStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            formStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else { 
            formStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                formStatusMessageDiv.textContent = '';
                formStatusMessageDiv.className = 'mt-4 text-sm'; 
            }, 5000);
        } else if (!message) {
             formStatusMessageDiv.className = 'mt-4 text-sm'; 
        }
    }
    
    function displayMappingFormStatus(message, type) {
        mappingFormStatusMessageDiv.textContent = message;
        mappingFormStatusMessageDiv.className = 'mt-3 text-sm p-3 rounded-md border'; 
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

    function displayTrackerRuleFormStatus(message, type) {
        trackerRuleFormStatusMessageDiv.textContent = message;
        trackerRuleFormStatusMessageDiv.className = 'mt-3 text-sm p-3 rounded-md border'; 
        if (type === 'success') {
            trackerRuleFormStatusMessageDiv.classList.add('bg-green-100', 'dark:bg-green-800', 'border-green-500', 'dark:border-green-600', 'text-green-700', 'dark:text-green-200');
        } else if (type === 'error') {
            trackerRuleFormStatusMessageDiv.classList.add('bg-red-100', 'dark:bg-red-800', 'border-red-500', 'dark:border-red-600', 'text-red-700', 'dark:text-red-200');
        } else {
            trackerRuleFormStatusMessageDiv.classList.add('bg-blue-100', 'dark:bg-blue-800', 'border-blue-500', 'dark:border-blue-600', 'text-blue-700', 'dark:text-blue-200');
        }
        if (message && (type === 'success' || type === 'error')) {
            setTimeout(() => {
                trackerRuleFormStatusMessageDiv.textContent = '';
                trackerRuleFormStatusMessageDiv.className = 'mt-3 text-sm';
            }, 5000);
        } else if (!message) {
            trackerRuleFormStatusMessageDiv.className = 'mt-3 text-sm';
        }
    }

    function displayBackupStatus(message, type) {
        backupStatusMessageDiv.textContent = message;
        backupStatusMessageDiv.className = 'mt-4 text-sm p-3 rounded-md border'; 
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
        // Ensure elements exist before trying to set style or textContent
        const rpcPathGrp = document.getElementById('rpcPathGroup');
        const scgiPathGrp = document.getElementById('scgiPathGroup');
        const userGroup = document.getElementById('usernameGroup');
        const passGroup = document.getElementById('passwordGroup');
        const urlLabel = document.querySelector('label[for="qbUrl"]');
        const userInput = document.getElementById('qbUsername'); // Assuming this is serverUsernameInput
        const userLabel = document.querySelector('label[for="qbUsername"]');

        // Default visibility and labels
        if(rpcPathGrp) rpcPathGrp.style.display = 'none';
        if(scgiPathGrp) scgiPathGrp.style.display = 'none';
        if(ruTorrentPathGroup) ruTorrentPathGroup.style.display = 'none';
        if(ruTorrentOptions) ruTorrentOptions.style.display = 'none';
        if(userGroup) userGroup.style.display = 'block'; 
        if(passGroup) passGroup.style.display = 'block'; 
        
        serverUrlInput.placeholder = 'http://localhost:8080';
        if (urlLabel) urlLabel.textContent = 'Server URL:';
        
        if (userLabel) userLabel.textContent = 'Username:';
        if (userInput) userInput.placeholder = ''; // Reset placeholder

        switch (clientType) {
            case 'transmission':
                if(rpcPathGrp) rpcPathGrp.style.display = 'block';
                serverUrlInput.placeholder = 'http://localhost:9091';
                if (urlLabel) urlLabel.textContent = 'Server URL (e.g., http://localhost:9091):';
                break;
            case 'rtorrent':
                if(scgiPathGrp) scgiPathGrp.style.display = 'block';
                if (urlLabel) urlLabel.textContent = 'rTorrent Web UI URL (e.g., ruTorrent, optional if SCGI direct):';
                serverUrlInput.placeholder = 'http://localhost/rutorrent';
                break;
            case 'rutorrent':
                if(ruTorrentPathGroup) ruTorrentPathGroup.style.display = 'block';
                if(ruTorrentOptions) ruTorrentOptions.style.display = 'block';
                if (urlLabel) urlLabel.textContent = 'ruTorrent URL:';
                serverUrlInput.placeholder = 'http://localhost/rutorrent';
                break;
            case 'deluge':
                if (userLabel) userLabel.textContent = 'Username (optional for WebUI):';
                if (userInput) userInput.placeholder = '(Usually not needed for WebUI)';
                serverUrlInput.placeholder = 'http://localhost:8112';
                break;
            case 'utorrent':
            case 'bittorrent':
                serverUrlInput.placeholder = 'http://localhost:8080/gui/';
                break;
            case 'kodi_elementum':
                if (userGroup) userGroup.style.display = 'none';
                if (passGroup) passGroup.style.display = 'none';
                serverUrlInput.placeholder = 'http://localhost:65220';
                break;
            case 'synology_download_station':
            case 'qnap_download_station':
                serverUrlInput.placeholder = 'http://<NAS_IP_OR_HOSTNAME>:<PORT>';
                break;
            default:
                // Defaults are already set above
                break;
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
            ruTorrentPathInput.value = server.ruTorrentrelativepath || '';
            rutorrentdontaddnamepathInput.checked = server.rutorrentdontaddnamepath || false;
            rutorrentalwaysurlInput.checked = server.rutorrentalwaysurl || false;
            defaultTagsInput.value = server.tags || '';
            defaultCategoryInput.value = server.category || '';
            categoriesInput.value = server.categories || '';
            addPausedInput.checked = server.addPaused || false;
            askForLabelDirOnPageInput.checked = server.askForLabelDirOnPage || false; 
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
            ruTorrentPathInput.value = '';
            rutorrentdontaddnamepathInput.checked = false;
            rutorrentalwaysurlInput.checked = false;
            defaultTagsInput.value = '';
            defaultCategoryInput.value = '';
            categoriesInput.value = '';
            addPausedInput.checked = false;
            askForLabelDirOnPageInput.checked = false; 
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
        categoriesInput.value = '';
        addPausedInput.checked = false;
        askForLabelDirOnPageInput.checked = false; 
        formStatusMessageDiv.textContent = '';
        formStatusMessageDiv.className = 'status-message';
        toggleClientSpecificFields('qbittorrent'); 
    }

    function renderServerList() {
        serverListUl.innerHTML = ''; 
        if (servers.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No server profiles configured yet.';
            li.className = 'text-gray-500 dark:text-gray-400 italic p-4 text-center'; 
            serverListUl.appendChild(li);
            return;
        }
        servers.forEach(server => {
            const li = document.createElement('li');
            li.className = `p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow`;
            if (server.id === activeServerId) {
                li.classList.add('active-server-item'); 
                li.classList.remove('bg-white', 'dark:bg-gray-700'); 
                li.classList.add('bg-blue-50', 'dark:bg-blue-900/30'); 
            }
            const serverInfoDiv = document.createElement('div');
            serverInfoDiv.className = 'grow';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'font-semibold text-lg text-gray-800 dark:text-white';
            nameSpan.textContent = server.name;
            serverInfoDiv.appendChild(nameSpan);
            if (server.id === activeServerId) {
                const activeBadge = document.createElement('span');
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
        const ruTorrentrelativepath = ruTorrentPathInput.value.trim();
        const rutorrentdontaddnamepath = rutorrentdontaddnamepathInput.checked;
        const rutorrentalwaysurl = rutorrentalwaysurlInput.checked;
        const tags = defaultTagsInput.value.trim();
        const category = defaultCategoryInput.value.trim();
        const categories = document.getElementById('categories').value.trim(); // Add this line
        const addPaused = addPausedInput.checked;
        const askForLabelDirOnPage = askForLabelDirOnPageInput.checked; 
        
        if (!name || !url) {
            displayFormStatus('Server Name and URL are required.', 'error');
            return;
        }
        try { new URL(url); } catch (e) {
            displayFormStatus('Invalid Server URL format.', 'error');
            return;
        }
        
        const serverData = { 
            name, 
            clientType, 
            url, 
            username, 
            password, 
            tags, 
            category, 
            categories,
            addPaused, 
            askForLabelDirOnPage,
            ruTorrentrelativepath,
            rutorrentdontaddnamepath,
            rutorrentalwaysurl
        }; 
        
        if (clientType === 'transmission') serverData.rpcPath = rpcPath;
        else if (clientType === 'rtorrent') serverData.scgiPath = scgiPath;
        if (id) { 
            const index = servers.findIndex(s => s.id === id);
            if (index > -1) servers[index] = { ...servers[index], ...serverData };
        } else { 
            serverData.id = generateId();
            servers.push(serverData);
            if (servers.length === 1 && !activeServerId) activeServerId = serverData.id;
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
        if (serverToEdit) showServerForm(true, serverToEdit);
    }
    function handleDeleteServer(event) {
        const serverIdToDelete = event.target.dataset.id;
        if (confirm(`Are you sure you want to delete server: ${servers.find(s=>s.id === serverIdToDelete)?.name}?`)) {
            servers = servers.filter(s => s.id !== serverIdToDelete);
            if (activeServerId === serverIdToDelete) activeServerId = servers.length > 0 ? servers[0].id : null; 
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
            ruTorrentrelativepath: clientTypeSelect.value === 'rutorrent' ? ruTorrentPathInput.value.trim() : undefined,
        };
        if (!serverConfig.url && clientTypeSelect.value !== 'rtorrent') { 
            displayFormStatus('Server URL is required to test connection.', 'error'); return;
        }
        if (clientTypeSelect.value === 'rtorrent' && !serverConfig.scgiPath && !serverConfig.url) {
            displayFormStatus('For rTorrent, either Server URL (for WebUI) or SCGI/HTTPRPC URL is required.', 'error'); return;
        }
        if (serverConfig.url) { try { new URL(serverConfig.url); } catch (e) { displayFormStatus('Invalid Server URL format.', 'error'); return; } }
        if (serverConfig.scgiPath) { try { new URL(serverConfig.scgiPath); } catch (e) { if (serverConfig.scgiPath.startsWith('http://') || serverConfig.scgiPath.startsWith('https://') || serverConfig.scgiPath.startsWith('scgi://')) { displayFormStatus('Invalid SCGI/HTTPRPC URL format.', 'error'); return; } } }
        if (!serverConfig.clientType) { displayFormStatus('Client Type is required to test connection.', 'error'); return; }
        displayFormStatus('Testing connection...', ''); 
        chrome.permissions.contains({ origins: [`${new URL(serverConfig.url).origin}/`] }, (granted) => {
            if (granted) {
                chrome.runtime.sendMessage({ action: 'testConnection', config: serverConfig }, (response) => {
                    if (chrome.runtime.lastError) displayFormStatus(`Error: ${chrome.runtime.lastError.message}`, 'error');
                    else if (response) {
                        if (response.success) displayFormStatus('Connection successful!', 'success');
                        else {
                            let errorMessage = "Connection failed.";
                            if (response.error && response.error.userMessage) errorMessage = `Connection failed: ${response.error.userMessage}`;
                            else if (response.message) errorMessage = `Connection failed: ${response.message}`;
                            else if (response.error) errorMessage = `Connection failed: ${JSON.stringify(response.error)}`;
                            displayFormStatus(errorMessage, 'error');
                        }
                    } else displayFormStatus('No response from service worker.', 'error');
                });
            } else displayFormStatus('Host permission not granted for this URL. Please save the server configuration first to request permission.', 'error');
        });
    });

    // --- Event Handlers for Global Settings ---
    clientTypeSelect.addEventListener('change', (event) => { toggleClientSpecificFields(event.target.value); });
    advancedAddDialogInput.addEventListener('change', () => {
        globalSettings.advancedAddDialog = advancedAddDialogInput.value || 'never';
        chrome.storage.local.set({ advancedAddDialog: globalSettings.advancedAddDialog }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    catchFromPageToggle.addEventListener('change', () => {
        globalSettings.catchfrompage = catchFromPageToggle.checked;
        chrome.storage.local.set({ catchfrompage: globalSettings.catchfrompage }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    linksFoundIndicatorToggle.addEventListener('change', () => {
        globalSettings.linksfoundindicator = linksFoundIndicatorToggle.checked;
        chrome.storage.local.set({ linksfoundindicator: globalSettings.linksfoundindicator }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    linkMatchesInput.addEventListener('change', () => { 
        globalSettings.linkmatches = linkMatchesInput.value;
        chrome.storage.local.set({ linkmatches: globalSettings.linkmatches }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    registerDelayInput.addEventListener('change', () => { 
        globalSettings.registerDelay = parseInt(registerDelayInput.value, 10) || 0;
        chrome.storage.local.set({ registerDelay: globalSettings.registerDelay }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableSoundNotificationsToggle.addEventListener('change', () => {
        globalSettings.enableSoundNotifications = enableSoundNotificationsToggle.checked;
        chrome.storage.local.set({ enableSoundNotifications: globalSettings.enableSoundNotifications }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });
    enableServerSpecificContextMenuToggle.addEventListener('change', () => {
        globalSettings.enableServerSpecificContextMenu = enableServerSpecificContextMenuToggle.checked;
        chrome.storage.local.set({ enableServerSpecificContextMenu: globalSettings.enableServerSpecificContextMenu }, () => { displayFormStatus('Global settings updated.', 'success'); });
    });

    // --- Event Handlers for Backup/Restore ---
    exportSettingsButton.addEventListener('click', () => {
        const settingsToExport = {
            servers, activeServerId, ...globalSettings, urlToServerMappings, trackerUrlRules 
        };
        const jsonString = JSON.stringify(settingsToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Add Remote Torrent_settings.json'; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        displayBackupStatus('Settings exported successfully.', 'success');
    });
    importSettingsButton.addEventListener('click', () => {
        const file = importSettingsFile.files[0];
        if (!file) { displayBackupStatus('Please select a file to import.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSettings = JSON.parse(event.target.result);
                if (!importedSettings || typeof importedSettings.servers === 'undefined') throw new Error('Invalid settings file structure.');
                if (confirm('This will overwrite your current settings. Are you sure you want to import?')) {
                    const newServers = (importedSettings.servers || []).map(s => ({ ...s, clientType: s.clientType || 'qbittorrent', askForLabelDirOnPage: s.askForLabelDirOnPage || false }));
                    let newActiveServerId = importedSettings.activeServerId || null;
                    if (newActiveServerId && !newServers.find(s => s.id === newActiveServerId)) newActiveServerId = newServers.length > 0 ? newServers[0].id : null;
                    if (!newActiveServerId && newServers.length > 0) newActiveServerId = newServers[0].id;
                    const settingsToSave = {
                        servers: newServers, activeServerId: newActiveServerId,
                        advancedAddDialog: importedSettings.advancedAddDialog || importedSettings.showAdvancedAddDialog && 'manual' || 'never',  // Migrate showAdvancedAddDialog -> advancedAddDialog
                        enableUrlBasedServerSelection: importedSettings.enableUrlBasedServerSelection || false,
                        urlToServerMappings: importedSettings.urlToServerMappings || [],
                        catchfrompage: importedSettings.catchfrompage || false, 
                        linksfoundindicator: importedSettings.linksfoundindicator || false, 
                        linkmatches: importedSettings.linkmatches || '', 
                        registerDelay: importedSettings.registerDelay || 0,
                        enableSoundNotifications: importedSettings.enableSoundNotifications || false,
                        enableServerSpecificContextMenu: importedSettings.enableServerSpecificContextMenu || false,
                        trackerUrlRules: importedSettings.trackerUrlRules || [],
                        contentDebugEnabled: Array.isArray(importedSettings.contentDebugEnabled) && importedSettings.contentDebugEnabled || ['error'],
                        bgDebugEnabled: Array.isArray(importedSettings.bgDebugEnabled) && importedSettings.bgDebugEnabled || ['log', 'warn', 'error'],
                    };
                    chrome.storage.local.set(settingsToSave, () => {
                        displayBackupStatus('Settings imported successfully! Reloading...', 'success');
                        loadSettings(); 
                    });
                }
            } catch (e) { displayBackupStatus(`Error importing settings: ${e.message}`, 'error'); }
        };
        reader.readAsText(file);
        importSettingsFile.value = ''; 
    });

    // --- Event Handlers for Debug/Log ---
    const debugChangeHandlerFactory = (settingName, method) => (event) => {
        globalSettings[settingName] = Array.isArray(globalSettings[settingName]) && globalSettings[settingName] || [];
        const enable = event.target.checked;
        const alreadyEnabled = globalSettings[settingName].includes(method);
        if (enable && !alreadyEnabled) {
            globalSettings[settingName].push(method);
        } else if (!enable && alreadyEnabled) {
            globalSettings[settingName] = globalSettings[settingName].filter(m => m !== method);
        }
        chrome.storage.local.set({ [settingName]: globalSettings[settingName] }, () => { displayFormStatus('Global settings updated.', 'success'); });
    };

    contentDebugEnabled_log.addEventListener('change', debugChangeHandlerFactory('contentDebugEnabled', 'log'));
    contentDebugEnabled_warn.addEventListener('change', debugChangeHandlerFactory('contentDebugEnabled', 'warn'));
    contentDebugEnabled_error.addEventListener('change', debugChangeHandlerFactory('contentDebugEnabled', 'error'));
    contentDebugEnabled_default.addEventListener('click', (e) => {
        e.preventDefault();
        globalSettings.contentDebugEnabled = ['error'];
        chrome.storage.local.set({ contentDebugEnabled: globalSettings.contentDebugEnabled }, () => { displayFormStatus('Global settings updated.', 'success'); });
        renderDebugSettings();
    });

    bgDebugEnabled_log.addEventListener('change', debugChangeHandlerFactory('bgDebugEnabled', 'log'));
    bgDebugEnabled_warn.addEventListener('change', debugChangeHandlerFactory('bgDebugEnabled', 'warn'));
    bgDebugEnabled_error.addEventListener('change', debugChangeHandlerFactory('bgDebugEnabled', 'error'));
    bgDebugEnabled_default.addEventListener('click', (e) => {
        e.preventDefault();
        globalSettings.bgDebugEnabled = ['log', 'warn', 'error'];
        chrome.storage.local.set({ bgDebugEnabled: globalSettings.bgDebugEnabled }, () => { displayFormStatus('Global settings updated.', 'success'); });
        renderDebugSettings();
    });

    // --- Initialization ---
    function loadSettings() {
        if (extensionVersionSpan) {
            const manifest = chrome.runtime.getManifest();
            extensionVersionSpan.textContent = manifest.version;
        }
        chrome.storage.local.get([
            'servers', 'activeServerId', 'showAdvancedAddDialog', 'advancedAddDialog', 'enableUrlBasedServerSelection',
            'urlToServerMappings', 'catchfrompage', 'linksfoundindicator', 'linkmatches', 
            'registerDelay', 'enableSoundNotifications', 'enableServerSpecificContextMenu', 'trackerUrlRules', 'contentDebugEnabled', 'bgDebugEnabled'
        ], (result) => {
            servers = (result.servers || []).map(s => ({ ...s, clientType: s.clientType || 'qbittorrent', url: s.url || s.qbUrl, username: s.username || s.qbUsername, password: s.password || s.qbPassword, rpcPath: s.rpcPath || (s.clientType === 'transmission' ? '/transmission/rpc' : ''), scgiPath: s.scgiPath || '', askForLabelDirOnPage: s.askForLabelDirOnPage || false }));
            activeServerId = result.activeServerId || (servers.length > 0 ? servers[0].id : null);
            globalSettings.advancedAddDialog = (result.advancedAddDialog || result.showAdvancedAddDialog && 'manual' || 'never'); // Migrate showAdvancedAddDialog -> advancedAddDialog
            advancedAddDialogInput.value = globalSettings.advancedAddDialog;
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
            globalSettings.enableSoundNotifications = result.enableSoundNotifications || false; 
            enableSoundNotificationsToggle.checked = globalSettings.enableSoundNotifications;
            globalSettings.enableServerSpecificContextMenu = result.enableServerSpecificContextMenu || false; 
            enableServerSpecificContextMenuToggle.checked = globalSettings.enableServerSpecificContextMenu;
            trackerUrlRules = result.trackerUrlRules || [];
            if (activeServerId && !servers.find(s => s.id === activeServerId)) activeServerId = servers.length > 0 ? servers[0].id : null;
            if (!activeServerId && servers.length > 0) activeServerId = servers[0].id;
            globalSettings.contentDebugEnabled = (Array.isArray(result.contentDebugEnabled) ? result.contentDebugEnabled : ['error']);
            globalSettings.bgDebugEnabled = (Array.isArray(result.bgDebugEnabled) ? result.bgDebugEnabled : ['log', 'warn', 'error']);
            renderDebugSettings()
            renderServerList();
            renderUrlMappingsList();
            populateMapToServerSelect(); 
            renderTrackerUrlRulesList(); 
        });
    }
    
    // --- URL Mapping Functions ---
    function generateMappingId() { 
        return `map-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    function toggleMappingListVisibility() {
        mappingsListContainer.style.display = globalSettings.enableUrlBasedServerSelection ? 'block' : 'none';
        if (!globalSettings.enableUrlBasedServerSelection) hideMappingForm(); 
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
            li.innerHTML = `<span>${index + 1}. Pattern: <span class="pattern">${mapping.websitePattern}</span> &rarr; <span class="target-server-name">${serverName}</span></span> <span class="actions"> <button class="edit-mapping-button" data-id="${mapping.id}">Edit</button> <button class="delete-mapping-button" data-id="${mapping.id}">Delete</button> ${index > 0 ? `<button class="move-mapping-up-button" data-id="${mapping.id}" title="Move Up">&uarr;</button>` : ''} ${index < urlToServerMappings.length - 1 ? `<button class="move-mapping-down-button" data-id="${mapping.id}" title="Move Down">&darr;</button>` : ''} </span>`;
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
        if (!websitePattern || !serverId) { displayMappingFormStatus('Website Pattern and Target Server are required.', 'error'); return; }
        const mappingData = { websitePattern, serverId };
        if (id) { 
            const index = urlToServerMappings.findIndex(m => m.id === id);
            if (index > -1) urlToServerMappings[index] = { ...urlToServerMappings[index], ...mappingData };
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

    // --- Tracker URL Rule Functions ---
    function generateTrackerRuleId() {
        return `trackerRule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    function renderTrackerUrlRulesList() {
        trackerUrlRulesListUl.innerHTML = '';
        if (trackerUrlRules.length === 0) {
            trackerUrlRulesListUl.innerHTML = '<li>No tracker URL rules configured.</li>';
            return;
        }
        trackerUrlRules.forEach((rule, index) => {
            const li = document.createElement('li');
            li.className = 'p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center';
            
            let ruleText = `<span>${index + 1}. Tracker Pattern: <strong class="text-indigo-600 dark:text-indigo-400">${rule.trackerUrlPattern}</strong>`;
            if (rule.label) ruleText += ` &rarr; Label: <strong class="text-purple-600 dark:text-purple-400">${rule.label}</strong>`;
            if (rule.directory) ruleText += ` &rarr; Dir: <strong class="text-teal-600 dark:text-teal-400">${rule.directory}</strong>`;
            ruleText += `</span>`;

            li.innerHTML = `
                <div>${ruleText}</div>
                <div class="actions flex space-x-2">
                    <button class="edit-tracker-rule-button px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md" data-id="${rule.id}">Edit</button>
                    <button class="delete-tracker-rule-button px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md" data-id="${rule.id}">Delete</button>
                </div>
            `;
            trackerUrlRulesListUl.appendChild(li);
        });

        document.querySelectorAll('.edit-tracker-rule-button').forEach(b => b.addEventListener('click', handleEditTrackerRule));
        document.querySelectorAll('.delete-tracker-rule-button').forEach(b => b.addEventListener('click', handleDeleteTrackerRule));
    }

    function showTrackerRuleForm(isEditing = false, rule = null) {
        trackerRuleFormSection.style.display = 'block';
        trackerRuleFormTitle.textContent = isEditing ? 'Edit Tracker Rule' : 'Add New Tracker Rule';
        if (isEditing && rule) {
            trackerRuleIdInput.value = rule.id;
            trackerUrlPatternInput.value = rule.trackerUrlPattern;
            trackerRuleLabelInput.value = rule.label || '';
            trackerRuleDirectoryInput.value = rule.directory || '';
        } else {
            trackerRuleIdInput.value = '';
            trackerUrlPatternInput.value = '';
            trackerRuleLabelInput.value = '';
            trackerRuleDirectoryInput.value = '';
        }
        displayTrackerRuleFormStatus('', '');
    }

    function hideTrackerRuleForm() {
        trackerRuleFormSection.style.display = 'none';
        trackerRuleIdInput.value = '';
        trackerUrlPatternInput.value = '';
        trackerRuleLabelInput.value = '';
        trackerRuleDirectoryInput.value = '';
        displayTrackerRuleFormStatus('', '');
    }

    showAddTrackerRuleFormButton.addEventListener('click', () => showTrackerRuleForm(false));
    cancelTrackerRuleEditButton.addEventListener('click', hideTrackerRuleForm);

    saveTrackerRuleButton.addEventListener('click', () => {
        const id = trackerRuleIdInput.value;
        const trackerUrlPattern = trackerUrlPatternInput.value.trim();
        const label = trackerRuleLabelInput.value.trim();
        const directory = trackerRuleDirectoryInput.value.trim();

        if (!trackerUrlPattern) {
            displayTrackerRuleFormStatus('Tracker URL Pattern is required.', 'error');
            return;
        }
        if (!label && !directory) {
            displayTrackerRuleFormStatus('Either a Label or a Directory (or both) must be specified.', 'error');
            return;
        }

        const ruleData = { 
            id: id || generateTrackerRuleId(),
            trackerUrlPattern,
            label,
            directory
        };

        if (id) {
            const index = trackerUrlRules.findIndex(r => r.id === id);
            if (index > -1) {
                trackerUrlRules[index] = ruleData;
            }
        } else {
            trackerUrlRules.push(ruleData);
        }
        chrome.storage.local.set({ trackerUrlRules }, () => {
            displayTrackerRuleFormStatus(id ? 'Tracker rule updated!' : 'Tracker rule added!', 'success');
            loadSettings(); 
            setTimeout(hideTrackerRuleForm, 1000);
        });
    });

    function handleEditTrackerRule(event) {
        const idToEdit = event.target.dataset.id;
        const ruleToEdit = trackerUrlRules.find(r => r.id === idToEdit);
        if (ruleToEdit) showTrackerRuleForm(true, ruleToEdit);
    }

    function handleDeleteTrackerRule(event) {
        const idToDelete = event.target.dataset.id;
        const ruleToDelete = trackerUrlRules.find(r => r.id === idToDelete);
        if (confirm(`Delete tracker rule for "${ruleToDelete?.trackerUrlPattern}"?`)) {
            trackerUrlRules = trackerUrlRules.filter(r => r.id !== idToDelete);
            chrome.storage.local.set({ trackerUrlRules }, () => {
                displayTrackerRuleFormStatus('Tracker rule deleted.', 'success');
                loadSettings();
            });
        }
    }

    function renderDebugSettings() {
        contentDebugEnabled_log.checked = globalSettings.contentDebugEnabled.includes('log');
        contentDebugEnabled_warn.checked = globalSettings.contentDebugEnabled.includes('warn');
        contentDebugEnabled_error.checked = globalSettings.contentDebugEnabled.includes('error');
        bgDebugEnabled_log.checked = globalSettings.bgDebugEnabled.includes('log');
        bgDebugEnabled_warn.checked = globalSettings.bgDebugEnabled.includes('warn');
        bgDebugEnabled_error.checked = globalSettings.bgDebugEnabled.includes('error');
    }

    loadSettings(); // Initial load
});
