import { debug } from '../debug';

// Transmission API Handler
// Improved for robust session ID negotiation, file selection, directory/label support, and error feedback.

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
	const headers = {
		...options.headers,
	};
	if (serverConfig.username && serverConfig.password) {
		headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
	}
	if (transmissionSessionId) {
		headers['X-Transmission-Session-Id'] = transmissionSessionId;
	}
	const finalOptions = { ...options, headers };
	const response = await fetch(url, finalOptions);
	if (response.status === 409 && !options.retryAttempted) {
		transmissionSessionId = response.headers.get('X-Transmission-Session-Id');
		if (transmissionSessionId) {
			headers['X-Transmission-Session-Id'] = transmissionSessionId;
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
		throw {
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
	return result.arguments;
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
	const {
		selectedFileIndices,
		torrentFileContentBase64,
	} = torrentOptions;

	const isMagnet = torrentUrl.startsWith('magnet:');
	const isTorrentFileExtension = torrentUrl.toLowerCase().endsWith('.torrent');
	const path = serverConfig.rpcPath || '/transmission/rpc';
	const rpcUrl = `${serverConfig.url.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

	let addArguments = {};
	const originalPausedState = torrentOptions.paused;

	if (torrentFileContentBase64) {
		debug.log('Transmission: Using pre-fetched torrent file content (base64).');
		addArguments.metainfo = torrentFileContentBase64;
	} else if (isTorrentFileExtension) {
		debug.warn(`Transmission: torrentFileContentBase64 not provided. Attempting to fetch ${torrentUrl} directly.`);
		try {
			debug.log(`Transmission: Fetching .torrent file content from: ${torrentUrl}`);
			const response = await fetch(torrentUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch .torrent file directly: ${response.status} ${response.statusText}`);
			}
			const arrayBuffer = await response.arrayBuffer();
			const byteArray = new Uint8Array(arrayBuffer);
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
		addArguments.filename = torrentUrl;
	}

	if (torrentOptions.downloadDir) {
		addArguments['download-dir'] = torrentOptions.downloadDir;
	}
	if (torrentOptions.labels && torrentOptions.labels.length > 0) {
		addArguments.labels = torrentOptions.labels;
	}
	// If file selection is active for a .torrent file, always add paused initially
	if (!isMagnet && selectedFileIndices && Array.isArray(selectedFileIndices)) {
		addArguments.paused = true;
	} else if (typeof torrentOptions.paused === 'boolean') {
		addArguments.paused = torrentOptions.paused;
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
				const clientFiles = torrentDetails.torrents[0].files;
				if (selectedFileIndices.length === 0) {
					filesToSetWanted = [];
				} else {
					filesToSetWanted = selectedFileIndices.filter(idx => idx < clientFiles.length);
				}
				const setArgs = { ids: [torrentId] };
				if (filesToSetWanted.length < clientFiles.length) {
					if (filesToSetWanted.length === 0) {
						const allIndices = Array.from({ length: clientFiles.length }, (_, i) => i);
						setArgs['files-unwanted'] = allIndices;
					} else {
						setArgs['files-wanted'] = filesToSetWanted;
					}
					await makeRpcCall(rpcUrl, 'torrent-set', setArgs, serverConfig);
					debug.log(`Transmission: Set file selection for torrent ${torrentId}: wanted indices ${filesToSetWanted.join(',')}`);
				}
			}
			// Resume torrent if it was not originally meant to be paused
			if (originalPausedState === false) {
				await makeRpcCall(rpcUrl, 'torrent-start-now', { ids: [torrentId] }, serverConfig);
				debug.log(`Transmission: Resumed torrent ${torrentId} after file selection.`);
			}
		}

		return { success: true, data: addResult || { message: "Torrent added successfully." } };

	} catch (error) {
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
			error: {
				userMessage: error.userMessage || "Network error or Transmission server not reachable.",
				technicalDetail: error.technicalDetail || error.message,
				errorCode: error.errorCode || "NETWORK_ERROR"
			}
		};
	}
}
