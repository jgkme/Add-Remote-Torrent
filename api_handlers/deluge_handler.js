import { debug } from '../debug';

// Deluge API Handler
// This file will contain the logic for interacting with the Deluge WebUI API (JSON-RPC).

const delugeSessions = new Map(); // Stores session info keyed by server URL
let delugeRequestId = 1;

// Centralized RPC call function with session management and retry logic.
async function makeAuthenticatedRpcCall(serverConfig, method, params = []) {
    // 1. Try the request. It will use an existing cookie if available.
    let result = await _makeRpcRequest(serverConfig, method, params);

    // 2. If it fails with an auth error, our session is invalid.
    if (result.status === 401 || result.status === 403) {
        debug.log(`Deluge: Session for ${serverConfig.url} is invalid or expired. Re-authenticating.`);
        delugeSessions.delete(serverConfig.url); // Clear the invalid cookie

        // 3. Attempt to log in to get a new session.
        const loginSuccess = await _login(serverConfig);
        if (loginSuccess) {
            debug.log(`Deluge: Re-login successful. Retrying original request: ${method}`);
            // 4. Retry the original request once more with the new session.
            result = await _makeRpcRequest(serverConfig, method, params);
        } else {
            // If login fails, return a clear error.
            return { 
                success: false, 
                error: {
                    userMessage: "Deluge authentication failed. Please check your password.",
                    errorCode: "AUTH_FAILED"
                }
            };
        }
    }
    
    return result;
}

// Internal login function. Returns true on success, false on failure.
async function _login(serverConfig) {
    const loginResult = await _makeRpcRequest(
        serverConfig,
        'auth.login',
        [serverConfig.password],
        true // isLogin = true
    );
    return loginResult.success && loginResult.data === true;
}

// Internal raw RPC request function.
async function _makeRpcRequest(serverConfig, method, params, isLogin = false) {
    const apiUrl = `${serverConfig.url.replace(/\/$/, '')}/json`;
    const payload = {
        method: method,
        params: params,
        id: delugeRequestId++,
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const sessionCookie = delugeSessions.get(serverConfig.url);
    if (sessionCookie && !isLogin) {
        headers['Cookie'] = sessionCookie;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            credentials: 'include',
        });

        if (isLogin && response.headers.has('set-cookie')) {
            const rawCookies = response.headers.get('set-cookie');
            if (rawCookies) {
                const sessionCookiePart = rawCookies.split(';').find(part => part.trim().startsWith('_session_id='));
                if (sessionCookiePart) {
                    delugeSessions.set(serverConfig.url, sessionCookiePart.trim());
                    debug.log(`Deluge: Stored new session cookie for ${serverConfig.url}`);
                }
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            debug.error(`Deluge API error: ${response.status} ${errorText}`);
            return { 
                success: false, 
                error: {
                    userMessage: "Deluge API request failed.",
                    technicalDetail: `API Error: ${response.status} ${errorText}`,
                },
                status: response.status 
            };
        }

        const result = await response.json();
        if (result.error) {
            debug.error('Deluge RPC error:', result.error);
            return { 
                success: false, 
                error: {
                    userMessage: "Deluge server reported an error.",
                    technicalDetail: `RPC Error: ${result.error.message} (Code: ${result.error.code})`,
                }
            };
        }
        return { success: true, data: result.result };

    } catch (error) {
        debug.error('Error in Deluge RPC request:', error);
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the Deluge server could not be reached.",
                technicalDetail: error.message,
            }
        };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const { 
        selectedFileIndices, 
        totalFileCount, 
        paused: userWantsPaused,
        torrentFileContentBase64,
    } = torrentOptions;

    const isMagnet = torrentUrl.startsWith('magnet:');
    const useFileSelection = !isMagnet && typeof totalFileCount === 'number' && totalFileCount > 0 && Array.isArray(selectedFileIndices);

    const addOptions = {};
    if (torrentOptions.downloadDir) addOptions.download_location = torrentOptions.downloadDir;
    if (serverConfig.delugeDownloadSpeedLimit) addOptions.max_download_speed = Number(serverConfig.delugeDownloadSpeedLimit);
    if (serverConfig.delugeUploadSpeedLimit) addOptions.max_upload_speed = Number(serverConfig.delugeUploadSpeedLimit);
    if (serverConfig.delugeMaxConnections) addOptions.max_connections = Number(serverConfig.delugeMaxConnections);
    if (serverConfig.delugeMaxUploadSlots) addOptions.max_upload_slots = Number(serverConfig.delugeMaxUploadSlots);
    if (serverConfig.delugeStopRatio) {
        addOptions.stop_at_ratio = true;
        addOptions.stop_ratio = Number(serverConfig.delugeStopRatio);
        if (serverConfig.delugeRemoveAtRatio) addOptions.remove_at_ratio = true;
    }
    if (torrentOptions.moveCompleted && torrentOptions.moveCompletedPath) {
        addOptions.move_completed = true;
        addOptions.move_completed_path = torrentOptions.moveCompletedPath;
    } else if (serverConfig.delugeMoveCompletedPath) {
        addOptions.move_completed = true;
        addOptions.move_completed_path = serverConfig.delugeMoveCompletedPath;
    }
    if (serverConfig.delugeSequentialDownload) addOptions.sequential_download = true;
    if (serverConfig.delugePrioritizeFirstLast) addOptions.prioritize_first_last_pieces = true;
    if (serverConfig.delugePreAllocate) addOptions.pre_allocate_storage = true;
    
    const addPausedEffective = useFileSelection ? true : userWantsPaused;
    if (typeof addPausedEffective === 'boolean') {
        addOptions.add_paused = addPausedEffective;
    }

    let rpcMethod;
    let rpcParams;

    if (torrentFileContentBase64 && !isMagnet) {
        rpcMethod = 'core.add_torrent_file';
        let fileName = 'file.torrent';
        try {
            const urlPath = new URL(torrentUrl).pathname;
            const nameFromPath = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            if (nameFromPath && nameFromPath.toLowerCase().endsWith('.torrent')) fileName = nameFromPath;
        } catch (e) { /* ignore */ }
        rpcParams = [fileName, torrentFileContentBase64, addOptions];
    } else {
        rpcMethod = 'web.add_torrents';
        rpcParams = [[{ path: torrentUrl, options: addOptions }]];
    }
    
    const addResult = await makeAuthenticatedRpcCall(serverConfig, rpcMethod, rpcParams);

    if (!addResult.success) {
        return { success: false, error: addResult.error };
    }
    
    let torrentId = null;
    if (typeof addResult.data === 'string') {
        torrentId = addResult.data;
    } else if (Array.isArray(addResult.data) && addResult.data.length > 0 && Array.isArray(addResult.data[0])) {
        const [successFlag, torrentIdOrError] = addResult.data[0];
        if (!successFlag) return { success: false, error: { userMessage: "Deluge reported an error adding the torrent.", technicalDetail: torrentIdOrError }};
        torrentId = torrentIdOrError;
    } else if (addResult.data === true) {
        return { success: true, data: { message: "Torrent added successfully (hash not returned)." } };
    }

    if (!torrentId) {
        return { success: false, error: { userMessage: "Torrent hash missing from Deluge response.", technicalDetail: JSON.stringify(addResult.data) } };
    }

    if (useFileSelection) {
        const filePriorities = new Array(totalFileCount).fill(0);
        selectedFileIndices.forEach(index => {
            if (index >= 0 && index < totalFileCount) filePriorities[index] = 1;
        });
        const setPrioOptions = { file_priorities: filePriorities };
        const setPrioResult = await makeAuthenticatedRpcCall(serverConfig, 'core.set_torrent_options', [[torrentId], setPrioOptions]);
        if (!setPrioResult.success) debug.warn(`Deluge: Failed to set file priorities for ${torrentId}.`);
        if (userWantsPaused === false) {
            const resumeResult = await makeAuthenticatedRpcCall(serverConfig, 'core.resume_torrent', [[torrentId]]);
            if (!resumeResult.success) debug.warn(`Deluge: Failed to resume torrent ${torrentId}.`);
        }
    }
    
    return { success: true, data: { id: torrentId, name: torrentId } };
}

export async function testConnection(serverConfig) {
    const loginSuccess = await _login(serverConfig);
    if (!loginSuccess) {
        return { success: false, error: { userMessage: "Deluge login failed. Please check your password." } };
    }
    
    const [sessionStatusResult, freeSpaceResult] = await Promise.all([
        makeAuthenticatedRpcCall(serverConfig, 'core.get_session_status', [[]]),
        makeAuthenticatedRpcCall(serverConfig, 'core.get_free_space', [])
    ]);

    if (sessionStatusResult.success && sessionStatusResult.data) {
        const stats = sessionStatusResult.data;
        return {
            success: true,
            data: {
                message: 'Successfully connected to Deluge.',
                version: stats.libtorrent_version,
                freeSpace: freeSpaceResult.success ? freeSpaceResult.data : -1,
                torrentsInfo: {
                    total: stats.num_torrents,
                    downloadSpeed: stats.payload_download_rate,
                    uploadSpeed: stats.payload_upload_rate,
                }
            }
        };
    }

    return { success: false, error: sessionStatusResult.error || { userMessage: 'Failed to get session status from Deluge.' } };
}

export async function getTorrentsInfo(serverConfig, hashes) {
    if (!hashes || hashes.length === 0) return [];
    
    const fields = ['name', 'progress', 'state'];
    const getTorrentsResult = await makeAuthenticatedRpcCall(serverConfig, 'core.get_torrents_status', [{ id: hashes }, fields]);

    if (!getTorrentsResult.success) return [];

    const torrents = getTorrentsResult.data;
    return Object.entries(torrents).map(([hash, details]) => ({
        hash: hash,
        name: details.name,
        progress: details.progress / 100, // Deluge progress is 0-100
        isCompleted: details.state === 'Seeding' || details.progress === 100,
    }));
}
