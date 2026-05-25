import bencode from 'bencode'; // Changed from 'bencode-js'
import { Buffer } from 'buffer'; // Import Buffer polyfill
import { debug } from '../debug';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { debugEnabled } = await chrome.storage.local.get('bgDebugEnabled');
        debug.setEnabled(debugEnabled);
    } catch (error) {
        debug.setEnabled(true);
    }

    debug.log("[ART ConfirmAdd] DOMContentLoaded triggered.");
    const serverNameDisplay = document.getElementById('serverNameDisplay');
    const torrentUrlDisplay = document.getElementById('torrentUrlDisplay');
    const tagsInput = document.getElementById('tagsInput');
    const categoryInput = document.getElementById('categoryInput');
    const directoryInput = document.getElementById('directoryInput');
    const pausedInput = document.getElementById('pausedInput');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    const qbittorrentOptions = document.getElementById('qbittorrentOptions');
    const contentLayoutInput = document.getElementById('contentLayoutInput');
    const forceStartInput = document.getElementById('forceStartInput');
    const skipCheckingInput = document.getElementById('skipCheckingInput');
    const sequentialDownloadInput = document.getElementById('sequentialDownloadInput');
    const firstLastPiecePrioInput = document.getElementById('firstLastPiecePrioInput');
    const renameInput = document.getElementById('renameInput');
    const qbitFreeSpaceHint = document.getElementById('qbitFreeSpaceHint');
    const transmissionOptions = document.getElementById('transmissionOptions');
    const bandwidthPriorityInput = document.getElementById('bandwidthPriorityInput');
    const delugeOptions = document.getElementById('delugeOptions');
    const moveCompletedInput = document.getElementById('moveCompletedInput');
    const moveCompletedPathInput = document.getElementById('moveCompletedPathInput');
    const fileSelectionSection = document.getElementById('fileSelectionSection');
    const selectFilesToggle = document.getElementById('selectFilesToggle');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileActionsContainer = document.getElementById('fileActionsContainer');
    const selectAllFilesButton = document.getElementById('selectAllFilesButton');
    const deselectAllFilesButton = document.getElementById('deselectAllFilesButton');

    let torrentUrl = '';
    let activeServerId = '';
    let activeServer = null;
    let labelDirectoryMap = {};

    function parseLabelDirectoryMap(rawMapping) {
        if (!rawMapping || typeof rawMapping !== 'string') return {};
        return rawMapping
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && line.includes('='))
            .reduce((acc, line) => {
                const [label, ...rest] = line.split('=');
                const key = (label || '').trim();
                const value = rest.join('=').trim();
                if (key && value) acc[key] = value;
                return acc;
            }, {});
    }

    debug.log("[ART ConfirmAdd] window.location.search:", window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    const rawUrlParam = urlParams.get('url');
    const rawServerIdParam = urlParams.get('serverId');
    debug.log("[ART ConfirmAdd] Raw params - url:", rawUrlParam, "serverId:", rawServerIdParam);

    torrentUrl = decodeURIComponent(rawUrlParam || '');
    activeServerId = rawServerIdParam;
    debug.log("[ART ConfirmAdd] Decoded params - torrentUrl:", torrentUrl, "activeServerId:", activeServerId);

    torrentUrlDisplay.textContent = torrentUrl || 'N/A';

    const isMagnetLink = torrentUrl.startsWith('magnet:');
    if (!isMagnetLink && torrentUrl) {
        debug.log("[ART ConfirmAdd] Not a magnet link, showing file selection section.");
        fileSelectionSection.style.display = 'block';
    } else if (isMagnetLink) {
        debug.log("[ART ConfirmAdd] Magnet link — file selection available only via qBittorrent fetchMetadata.");
    }


    if (!torrentUrl || !activeServerId) {
        debug.error("[ART ConfirmAdd] Error: Missing torrent URL or server ID. Params were:", 
            "url:", torrentUrl, "serverId:", activeServerId);
        document.body.innerHTML = '<div class="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">Missing torrent URL or server ID. Close this window and try again from the popup or context menu.</div>';
        return;
    }
    chrome.storage.local.get(['servers'], (result) => {
        const servers = result.servers || [];
        activeServer = servers.find(s => s.id === activeServerId);

        if (activeServer) {
            labelDirectoryMap = parseLabelDirectoryMap(activeServer.labelDirectoryMap);
            serverNameDisplay.textContent = activeServer.name;
            
            // Handle tags input - use defaultTags from the server config
            tagsInput.value = activeServer.defaultTags || '';
            
            // Handle category dropdown - populate from comma-separated 'categories' field
            if (activeServer.categories) {
                const categoryOptions = activeServer.categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
                
                // Clear existing options except the first placeholder
                categoryInput.innerHTML = '<option value="">Select a category...</option>';
                
                // Add options from comma-separated categories
                categoryOptions.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryInput.appendChild(option);
                });
                
            // Set default selection if defaultCategory is defined and exists in the dropdown
            const defaultCat = activeServer.defaultCategory || activeServer.category;
            if (defaultCat && categoryOptions.includes(defaultCat.trim())) {
                categoryInput.value = defaultCat.trim();
            }
        } else {
            // If no categories defined, just keep the placeholder
            categoryInput.innerHTML = '<option value="">Select a category...</option>';
        }

        // Handle directory dropdown
        if (activeServer.downloadDirectories) {
            const directoryOptions = activeServer.downloadDirectories.split(',').map(dir => dir.trim()).filter(dir => dir.length > 0);
            directoryInput.innerHTML = '<option value="">Default Directory</option>';
            directoryOptions.forEach(dir => {
                const option = document.createElement('option');
                option.value = dir;
                option.textContent = dir;
                directoryInput.appendChild(option);
            });
        } else {
            directoryInput.innerHTML = '<option value="">Default Directory</option>';
        }
        
        pausedInput.checked = activeServer.addPaused || false;

            if (activeServer.clientType === 'qbittorrent') {
                qbittorrentOptions.style.display = 'block';
                forceStartInput.checked = !!activeServer.forceStart;
                if (isMagnetLink && webApiAtLeast(activeServer.webApiVersion, '2.11.9')) {
                    fileSelectionSection.style.display = 'block';
                    const label = fileSelectionSection.querySelector('label[for="selectFilesToggle"]');
                    if (label) {
                        label.textContent =
                            'Select files to download (qBittorrent metadata — may take a moment)';
                    }
                }
            } else if (activeServer.clientType === 'transmission') {
                transmissionOptions.style.display = 'block';
                // Set default value from server config if it exists
                if (activeServer.transmissionBandwidthPriority) {
                    bandwidthPriorityInput.value = activeServer.transmissionBandwidthPriority;
                }
            } else if (activeServer.clientType === 'deluge') {
                delugeOptions.style.display = 'block';
                moveCompletedInput.addEventListener('change', () => {
                    moveCompletedPathInput.style.display = moveCompletedInput.checked ? 'block' : 'none';
                });
                // Set default values from server config
                if (activeServer.delugeMoveCompletedPath) {
                    moveCompletedInput.checked = true;
                    moveCompletedPathInput.style.display = 'block';
                    moveCompletedPathInput.value = activeServer.delugeMoveCompletedPath;
                }
            }
        } else {
            const errorPara = document.createElement('p');
      errorPara.textContent = `Could not find server with ID ${activeServerId}. Re-open this dialog from popup/options after selecting a valid server.`;
      document.body.innerHTML = '';
      document.body.appendChild(errorPara);
        }
    });

    categoryInput.addEventListener('change', () => {
        const selectedCategory = categoryInput.value;
        if (selectedCategory && labelDirectoryMap[selectedCategory]) {
            directoryInput.value = labelDirectoryMap[selectedCategory];
        }
        updateQbitFreeSpaceHint();
    });

    function webApiAtLeast(version, min) {
        if (!version) return false;
        const a = String(version).split('.').map((n) => parseInt(n, 10) || 0);
        const b = min.split('.').map((n) => parseInt(n, 10) || 0);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const x = a[i] || 0;
            const y = b[i] || 0;
            if (x > y) return true;
            if (x < y) return false;
        }
        return true;
    }

    let freeSpaceTimer = null;
    function updateQbitFreeSpaceHint() {
        if (!qbitFreeSpaceHint || !activeServer || activeServer.clientType !== 'qbittorrent') return;
        const path = directoryInput.value.trim();
        if (!path) {
            qbitFreeSpaceHint.style.display = 'none';
            return;
        }
        if (!activeServer.webApiVersion) {
            qbitFreeSpaceHint.textContent =
                'Free space: run Test connection in Options to detect Web API version.';
            qbitFreeSpaceHint.style.display = 'block';
            return;
        }
        if (!webApiAtLeast(activeServer.webApiVersion, '2.15.2')) {
            qbitFreeSpaceHint.textContent =
                'Free space requires qBittorrent Web API 2.15.2+ (upgrade qBittorrent or check version).';
            qbitFreeSpaceHint.style.display = 'block';
            return;
        }
        clearTimeout(freeSpaceTimer);
        freeSpaceTimer = setTimeout(() => {
            chrome.runtime.sendMessage(
                { action: 'getQbitFreeSpace', serverId: activeServer.id, path },
                (response) => {
                    if (response?.success && typeof response.freeSpace === 'number') {
                        qbitFreeSpaceHint.textContent = `Free space at path: ${formatBytes(response.freeSpace)}`;
                        qbitFreeSpaceHint.style.display = 'block';
                    } else {
                        qbitFreeSpaceHint.style.display = 'none';
                    }
                }
            );
        }, 400);
    }
    directoryInput.addEventListener('input', updateQbitFreeSpaceHint);

    async function renderFileListFromMetadata(files) {
        if (!files.length) {
            fileListContainer.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">No file list in metadata.</p>';
            return;
        }
        fileListContainer.innerHTML = files.map((file) => `
            <div class="py-1">
                <label class="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded">
                    <input type="checkbox" 
                           class="art-file-select-checkbox h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-500" 
                           data-file-index="${file.index}" 
                           data-file-path="${escapeHtml(file.name)}" 
                           checked>
                    <span class="truncate" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                    <span class="ml-auto text-gray-500 dark:text-gray-400 whitespace-nowrap">(${formatBytes(file.size)})</span>
                </label>
            </div>
        `).join('');
    }

    selectFilesToggle.addEventListener('change', async () => {
        if (selectFilesToggle.checked && isMagnetLink) {
            if (
                !activeServer ||
                activeServer.clientType !== 'qbittorrent' ||
                !webApiAtLeast(activeServer.webApiVersion, '2.11.9')
            ) {
                fileListContainer.innerHTML =
                    '<p class="text-xs text-amber-600 dark:text-amber-400">Magnet file lists need qBittorrent Web API 2.11.9+. Run Test connection in Options.</p>';
                fileListContainer.style.display = 'block';
                fileActionsContainer.style.display = 'none';
                selectFilesToggle.checked = false;
                return;
            }
            fileActionsContainer.style.display = 'block';
            fileListContainer.style.display = 'block';
            fileListContainer.innerHTML =
                '<p class="text-xs text-gray-500 dark:text-gray-400">Fetching metadata from qBittorrent (may take up to a minute)…</p>';
            chrome.runtime.sendMessage(
                { action: 'fetchQbitTorrentMetadata', serverId: activeServer.id, url: torrentUrl },
                (response) => {
                    if (response?.success && response.files?.length) {
                        renderFileListFromMetadata(response.files);
                    } else {
                        const errText =
                            response?.error?.userMessage || response?.error || 'Metadata fetch failed.';
                        fileListContainer.innerHTML = `<p class="text-xs text-red-500 dark:text-red-400">${escapeHtml(errText)}</p>`;
                        fileActionsContainer.style.display = 'none';
                    }
                }
            );
            return;
        }
        if (selectFilesToggle.checked && !isMagnetLink) {
            fileActionsContainer.style.display = 'block'; // Show action buttons
            fileListContainer.style.display = 'block';
            fileListContainer.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">Preparing file list... this can take a moment for large torrents.</p>';
            
            try {
                debug.log("[ART ConfirmAdd] Attempting to fetch .torrent file from URL:", torrentUrl);
                const response = await fetch(torrentUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch .torrent file: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                debug.log("[ART ConfirmAdd] Fetched ArrayBuffer.byteLength:", arrayBuffer.byteLength);
                
                if (arrayBuffer.byteLength === 0) {
                    throw new Error("Fetched .torrent file is empty.");
                }
                
                // Convert ArrayBuffer to Buffer for 'bencode' library
                const buffer = Buffer.from(arrayBuffer);
                debug.log("[ART ConfirmAdd] Created Buffer object (first few bytes):", buffer.slice(0, 20)); // Log a slice to avoid huge output
                debug.log("[ART ConfirmAdd] Is 'buffer' an instance of Buffer?:", buffer instanceof Buffer);
                
                // Decode. Even with 'utf8' option, values might still be Buffers/Uint8Arrays, so we'll .toString() them.
                const torrentData = bencode.decode(buffer); // Using default decode, will handle toString below
                debug.log("[ART ConfirmAdd] Decoded torrent data (raw):", torrentData);

                let files = [];
                if (torrentData && torrentData.info) {
                    const info = torrentData.info;
                    const decoder = new TextDecoder('utf-8'); // Use TextDecoder for Uint8Array
                    
                    const toUtf8String = (val) => {
                        if (val instanceof Uint8Array) {
                            return decoder.decode(val);
                        }
                        // Fallback for other Buffer-like objects that might have a Buffer polyfill's toString
                        if (val && typeof val.toString === 'function' && val.toString !== Array.prototype.toString && val.toString !== Object.prototype.toString) {
                            try {
                                // Check if it's a polyfilled Buffer by trying to call toString with encoding
                                const str = val.toString('utf-8');
                                // If it doesn't throw and returns a string, it's likely a polyfilled Buffer
                                if (typeof str === 'string') return str;
                            } catch (e) {
                                // Not a polyfilled Buffer, or toString doesn't take encoding
                            }
                        }
                        // If still not a string, and has a generic toString, use it. Otherwise empty.
                        return (val && typeof val.toString === 'function') ? val.toString() : '';
                    };

                    if (info.files && Array.isArray(info.files)) { // Multi-file torrent
                        files = info.files.map((fileEntry, idx) => {
                            let filePathString = "Unknown File"; 
                            if (fileEntry && fileEntry.path && Array.isArray(fileEntry.path) && fileEntry.path.length > 0) {
                                filePathString = fileEntry.path
                                    .map(p => toUtf8String(p)) 
                                    .filter(pStr => pStr && pStr.length > 0) // Ensure pStr is truthy before checking length
                                    .join('/');
                            } else if (fileEntry && fileEntry.path) { 
                                filePathString = toUtf8String(fileEntry.path);
                            }
                            
                            if (!filePathString) {
                                filePathString = "Unnamed File";
                            }

                            return {
                                name: filePathString,
                                size: (typeof fileEntry.length === 'number') ? fileEntry.length : 0,
                                index: idx
                            };
                        });
                    } else if (info.name && typeof info.length === 'number') { // Single file torrent
                        files = [{
                            name: toUtf8String(info.name), 
                            size: info.length,
                            index: 0
                        }];
                    }
                }

                if (files.length > 0) {
                    fileListContainer.innerHTML = files.map((file) => `
                        <div class="py-1">
                            <label class="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded">
                                <input type="checkbox" 
                                       class="art-file-select-checkbox h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-500" 
                                       data-file-index="${file.index}" 
                                       data-file-path="${escapeHtml(file.name)}" 
                                       checked>
                                <span class="truncate" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                                <span class="ml-auto text-gray-500 dark:text-gray-400 whitespace-nowrap">(${formatBytes(file.size)})</span>
                            </label>
                        </div>
                    `).join('');
                } else {
                    fileListContainer.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">No file list found in this torrent metadata.</p>';
                }

            } catch (error) {
                debug.error("Error fetching, parsing, or displaying .torrent file list:", error);
                if (activeServer && activeServer.clientType === 'qbittorrent') {
                    fileListContainer.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">Trying qBittorrent metadata API…</p>';
                    chrome.runtime.sendMessage(
                        { action: 'fetchQbitTorrentMetadata', serverId: activeServer.id, url: torrentUrl },
                        (response) => {
                            if (response?.success && response.files?.length) {
                                renderFileListFromMetadata(response.files);
                                fileActionsContainer.style.display = 'block';
                            } else {
                                const errText =
                                    response?.error?.userMessage || response?.error || error.message;
                                fileListContainer.innerHTML = `<p class="text-xs text-red-500 dark:text-red-400">Could not load file list. ${escapeHtml(errText)}</p>`;
                                fileActionsContainer.style.display = 'none';
                            }
                        }
                    );
                } else {
                    fileListContainer.innerHTML = `<p class="text-xs text-red-500 dark:text-red-400">Error: Could not load torrent file details. ${error.message}</p>`;
                    fileActionsContainer.style.display = 'none';
                }
            }

        } else {
            fileListContainer.style.display = 'none';
            fileActionsContainer.style.display = 'none'; // Hide action buttons
        }
    });

    selectAllFilesButton.addEventListener('click', () => {
        const checkboxes = fileListContainer.querySelectorAll('.art-file-select-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
    });

    deselectAllFilesButton.addEventListener('click', () => {
        const checkboxes = fileListContainer.querySelectorAll('.art-file-select-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
    });

    confirmButton.addEventListener('click', () => {
        if (!activeServer) return; 

        const selectedFileIndices = [];
        let totalFileCount = 0;

        if (!isMagnetLink && selectFilesToggle.checked) {
            const fileCheckboxes = fileListContainer.querySelectorAll('.art-file-select-checkbox');
            totalFileCount = fileCheckboxes.length;
            fileCheckboxes.forEach(cb => {
                if (cb.checked) {
                    selectedFileIndices.push(parseInt(cb.dataset.fileIndex, 10));
                }
            });
            debug.log("Selected file indices:", selectedFileIndices, "Total files:", totalFileCount);
        }

        const finalParams = {
            url: torrentUrl,
            serverId: activeServer.id, 
            tags: tagsInput.value.trim(),
            category: categoryInput.value, // No need to trim since it's a selected value from dropdown
            downloadDir: directoryInput.value,
            addPaused: pausedInput.checked,
            selectedFileIndices: (!isMagnetLink && selectFilesToggle.checked) ? selectedFileIndices : undefined,
            totalFileCount: (!isMagnetLink && selectFilesToggle.checked && totalFileCount > 0) ? totalFileCount : undefined,
            contentLayout: contentLayoutInput.value,
            bandwidthPriority: bandwidthPriorityInput.value,
            moveCompleted: moveCompletedInput.checked,
            moveCompletedPath: moveCompletedPathInput.value,
            forceStart: forceStartInput.checked,
            skipChecking: skipCheckingInput?.checked || false,
            sequentialDownload: sequentialDownloadInput?.checked || false,
            firstLastPiecePrio: firstLastPiecePrioInput?.checked || false,
            rename: renameInput?.value?.trim() || '',
        };
        
        chrome.runtime.sendMessage({ action: 'addTorrentWithCustomParams', params: finalParams }, (response) => {
            if (chrome.runtime.lastError) {
                debug.error("Error sending message from confirmAdd:", chrome.runtime.lastError.message);
            }
            window.close(); 
        });
    });

    cancelButton.addEventListener('click', () => {
        window.close(); 
    });
});

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
         .replace(/&/g, "&#38;")
         .replace(/</g, "&#60;")
         .replace(/>/g, "&#62;")
         .replace(/"/g, "&#34;")
         .replace(/'/g, "&#39;");
}
