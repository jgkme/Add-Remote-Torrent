import { debug } from '../debug';

// Transmission API Handler
// This file will contain the logic for interacting with the Transmission RPC API.

// Placeholder for X-Transmission-Session-Id
let transmissionSessionId = null;

// b64_encode function provided by user
function b64_encode(input) {
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	while (i < input.length) {
		chr1 = input[i++];
		chr2 = input[i++];
		chr3 = input[i++];

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output +
		_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
		_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
	}
	return output;
}


async function fetchWithAuth(url, options, serverConfig) {
    // Implement common fetch logic with Basic Auth and X-Transmission-Session-Id handling
    // This will be more fleshed out later.
    const headers = {
        ...options.headers,
    };

    if (serverConfig.username && serverConfig.password) {
        headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
    }

    if (transmissionSessionId) {
        headers['X-Transmission-Session-Id'] = transmissionSessionId;
    }
    // Add 'credentials: include' if not already present, for cross-origin cookie handling if needed by some setups
    const finalOptions = { ...options, headers };
    if (!finalOptions.credentials) {
        // finalOptions.credentials = 'include'; // Might be needed if session is cookie-based and not just header
    }


    const response = await fetch(url, finalOptions);

    if (response.status === 409 && !options.retryAttempted) { // Add retryAttempted to prevent infinite loops
        transmissionSessionId = response.headers.get('X-Transmission-Session-Id');
        if (transmissionSessionId) {
            headers['X-Transmission-Session-Id'] = transmissionSessionId;
            // Retry the request with the new session ID
            return fetch(url, { ...options, headers, retryAttempted: true });
        }
    }
    return response;
}

async function makeRpcCall(rpcUrl, method, callArguments, serverConfig) {
    const payload = { method, arguments: callArguments };
    const response = await fetchWithAuth(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }, serverConfig);

    if (!response.ok) {
        const errorText = await response.text();
        let errorCode = "RPC_CALL_FAILED";
        if (response.status === 401) errorCode = "AUTH_FAILED_SESSION";
        debug.error(`Transmission API error for method ${method}: ${response.status} ${errorText}`);
        throw { // Throw an object that can be caught and processed
            userMessage: `Transmission API call '${method}' failed.`,
            technicalDetail: `API Error: ${response.status} ${errorText}`,
            errorCode: errorCode
        };
    }
    const result = await response.json();
    if (result.result !== 'success') {
        debug.error(`Transmission RPC error for method ${method}:`, result);
        throw {
            userMessage: `Transmission server reported an error for '${method}'.`,
            technicalDetail: `RPC response: ${result.result}`,
            errorCode: "RPC_ERROR"
        };
    }
    return result.arguments; // Return the 'arguments' part of the response
}


export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, username, password, clientType, rpcPath, ... }
    // torrentOptions: { downloadDir, paused, labels (array), selectedFileIndices, torrentFileContentBase64, originalTorrentUrl }
    // Note: `torrentUrl` parameter here is `originalTorrentUrl` from background.js

    const { 
        selectedFileIndices, 
        torrentFileContentBase64, 
        // originalTorrentUrl is already passed as torrentUrl parameter
    } = torrentOptions;

    const isMagnet = torrentUrl.startsWith('magnet:');
    const isTorrentFileExtension = torrentUrl.toLowerCase().endsWith('.torrent');

    const path = serverConfig.rpcPath || '/transmission/rpc';
    const rpcUrl = `${serverConfig.url.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
    
    let addArguments = {};
    const originalPausedState = torrentOptions.paused; // Store original intent

    if (torrentFileContentBase64) {
        debug.log('Transmission: Using pre-fetched torrent file content (base64).');
        addArguments.metainfo = torrentFileContentBase64;
    } else if (isTorrentFileExtension) {
        // Fallback: If background didn't provide content, try fetching it directly (less likely to work for private trackers)
        debug.warn(`Transmission: torrentFileContentBase64 not provided. Attempting to fetch ${torrentUrl} directly.`);
        try {
            debug.log(`Transmission: Fetching .torrent file content from: ${torrentUrl}`);
            const response = await fetch(torrentUrl); // This fetch won't have user's browser cookies
            if (!response.ok) {
                throw new Error(`Failed to fetch .torrent file directly: ${response.status} ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const byteArray = new Uint8Array(arrayBuffer); // b64_encode expects Uint8Array
            addArguments.metainfo = b64_encode(byteArray); 
            debug.log('Transmission: Successfully fetched and encoded .torrent file directly.');
        } catch (fetchError) {
            debug.error(`Transmission: Error processing .torrent file URL directly: ${fetchError.message}`);
            return { 
                success: false, 
                error: {
                    userMessage: "Failed to fetch or process the .torrent file URL.",
                    technicalDetail: fetchError.message,
                    errorCode: "TORRENT_FILE_FETCH_FAILED"
                }
            };
        }
    } else {
        // Assume it's a magnet link or other URL that Transmission handles directly
        addArguments.filename = torrentUrl;
    }

    if (torrentOptions.downloadDir) {
        addArguments['download-dir'] = torrentOptions.downloadDir;
    }
    
    // If file selection is active for a .torrent file, always add paused initially
    if (!isMagnet && selectedFileIndices && Array.isArray(selectedFileIndices)) {
        addArguments.paused = true; 
    } else if (typeof torrentOptions.paused === 'boolean') {
        addArguments.paused = torrentOptions.paused;
    }

    if (torrentOptions.labels && torrentOptions.labels.length > 0) {
        addArguments.labels = torrentOptions.labels;
    }

    try {
        const addResult = await makeRpcCall(rpcUrl, 'torrent-add', addArguments, serverConfig);
        let torrentId = null;
        let isDuplicate = false;

        if (addResult && addResult['torrent-added']) {
            torrentId = addResult['torrent-added'].id || addResult['torrent-added'].hashString;
        } else if (addResult && addResult['torrent-duplicate']) {
            torrentId = addResult['torrent-duplicate'].id || addResult['torrent-duplicate'].hashString;
            isDuplicate = true;
            // If it's a duplicate and we intended to select files, we might not be able to modify it easily.
            // For now, just return duplicate status.
            return { success: true, duplicate: true, data: addResult['torrent-duplicate'] };
        }

        if (!torrentId) {
            throw { userMessage: "Torrent added, but ID was not returned.", technicalDetail: "No torrent ID in add response.", errorCode: "ADD_NO_ID" };
        }

        // Handle file selection if applicable
        if (!isMagnet && selectedFileIndices && Array.isArray(selectedFileIndices) && torrentId) {
            const getArgs = { ids: [torrentId], fields: ["id", "files"] };
            const torrentDetails = await makeRpcCall(rpcUrl, 'torrent-get', getArgs, serverConfig);
            
            let filesToSetWanted = [];
            if (torrentDetails && torrentDetails.torrents && torrentDetails.torrents.length > 0 && torrentDetails.torrents[0].files) {
                const clientFiles = torrentDetails.torrents[0].files; // Array of {name, length, bytesCompleted}
                // We assume selectedFileIndices from our dialog match the order from clientFiles
                if (selectedFileIndices.length === 0) { // User deselected all
                    filesToSetWanted = []; // This will effectively mean files-unwanted: all
                } else {
                    filesToSetWanted = selectedFileIndices.filter(idx => idx < clientFiles.length);
                }

                const setArgs = { ids: [torrentId] };
                if (filesToSetWanted.length < clientFiles.length) { // Only set if not all files are wanted
                    if (filesToSetWanted.length === 0) {
                         // Create an array of all indices from 0 to clientFiles.length - 1
                        const allIndices = Array.from({ length: clientFiles.length }, (_, i) => i);
                        setArgs['files-unwanted'] = allIndices;
                    } else {
                        setArgs['files-wanted'] = filesToSetWanted;
                        // To be more precise, we could also calculate files-unwanted
                        // const allClientIndices = Array.from({ length: clientFiles.length }, (_, i) => i);
                        // setArgs['files-unwanted'] = allClientIndices.filter(idx => !filesToSetWanted.includes(idx));
                    }
                    await makeRpcCall(rpcUrl, 'torrent-set', setArgs, serverConfig);
                    debug.log(`Transmission: Set file selection for torrent ${torrentId}: wanted indices ${filesToSetWanted.join(',')}`);
                }
            }

            // Resume torrent if it was not originally meant to be paused
            if (originalPausedState === false) { // Check original user intent
                await makeRpcCall(rpcUrl, 'torrent-start-now', { ids: [torrentId] }, serverConfig);
                debug.log(`Transmission: Resumed torrent ${torrentId} after file selection.`);
            }
        }
        
        return { success: true, data: addResult || { message: "Torrent added successfully." } };

    } catch (error) {
        // Error object from makeRpcCall or other network issues
        debug.error('Error adding torrent to Transmission or setting files:', error);
        const errDetail = typeof error === 'object' ? error.technicalDetail || error.message : String(error);
        const errCode = typeof error === 'object' ? error.errorCode || "NETWORK_ERROR" : "NETWORK_ERROR";
        const usrMsg = typeof error === 'object' ? error.userMessage || "Failed to add torrent or set files." : "Failed to add torrent or set files.";
        
        return { 
            success: false, 
            error: {
                userMessage: usrMsg,
                technicalDetail: errDetail,
                errorCode: errCode
            }
        };
    }
}

export async function testConnection(serverConfig) {
    const path = serverConfig.rpcPath || '/transmission/rpc';
    const rpcUrl = `${serverConfig.url.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
    
    try {
        const resultArgs = await makeRpcCall(rpcUrl, 'session-get', { fields: ['version'] }, serverConfig);
        return { success: true, data: resultArgs };
    } catch (error) {
         return { 
            success: false, 
            error: { // Ensure error object structure
                userMessage: error.userMessage || "Network error or Transmission server not reachable.",
                technicalDetail: error.technicalDetail || error.message,
                errorCode: error.errorCode || "NETWORK_ERROR"
            }
        };
    }
}
