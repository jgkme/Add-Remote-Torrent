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
    const fileSelectionSection = document.getElementById('fileSelectionSection');
    const selectFilesToggle = document.getElementById('selectFilesToggle');
    const fileListContainer = document.getElementById('fileListContainer');
    const fileActionsContainer = document.getElementById('fileActionsContainer');
    const selectAllFilesButton = document.getElementById('selectAllFilesButton');
    const deselectAllFilesButton = document.getElementById('deselectAllFilesButton');

    let torrentUrl = '';
    let activeServerId = '';
    let activeServer = null;

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
        debug.log("[ART ConfirmAdd] Is a magnet link, file selection section remains hidden.");
    }


    if (!torrentUrl || !activeServerId) {
        debug.error("[ART ConfirmAdd] Error: Missing torrent URL or server ID. Params were:", 
            "url:", torrentUrl, "serverId:", activeServerId);
        document.body.innerHTML = '<p class="p-4 text-red-600 dark:text-red-400">Error: Missing torrent URL or server ID. Please close this window and try again. Check console for details.</p>';
        return;
    }
    chrome.storage.local.get(['servers'], (result) => {
        const servers = result.servers || [];
        activeServer = servers.find(s => s.id === activeServerId);

        if (activeServer) {
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
        } else {
            const errorPara = document.createElement('p');
      errorPara.textContent = `Error: Could not find server with ID ${activeServerId}. Please close this window.`;
      document.body.innerHTML = '';
      document.body.appendChild(errorPara);
        }
    });

    selectFilesToggle.addEventListener('change', async () => {
        if (selectFilesToggle.checked && !isMagnetLink) {
            fileActionsContainer.style.display = 'block'; // Show action buttons
            fileListContainer.style.display = 'block';
            fileListContainer.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">Fetching torrent file info...</p>';
            
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
                    fileListContainer.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400">No files found in torrent or unable to parse file list.</p>';
                }

            } catch (error) {
                debug.error("Error fetching, parsing, or displaying .torrent file list:", error);
                fileListContainer.innerHTML = `<p class="text-xs text-red-500 dark:text-red-400">Error: Could not load torrent file details. ${error.message}</p>`;
                fileActionsContainer.style.display = 'none'; // Hide actions if error
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
            server: activeServer, 
            tags: tagsInput.value.trim(),
            category: categoryInput.value, // No need to trim since it's a selected value from dropdown
            downloadDir: directoryInput.value,
            addPaused: pausedInput.checked,
            selectedFileIndices: (!isMagnetLink && selectFilesToggle.checked) ? selectedFileIndices : undefined,
            totalFileCount: (!isMagnetLink && selectFilesToggle.checked && totalFileCount > 0) ? totalFileCount : undefined,
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
