import { debug } from '../debug';

// Deluge API Handler
// This file will contain the logic for interacting with the Deluge WebUI API (JSON-RPC).

// Deluge uses a session cookie. We'll need to manage this.
// This is a simplified placeholder; actual cookie management might be more complex
// depending on how Chrome extension service workers handle cookies with fetch.
let delugeSessionCookie = null;
let delugeRequestId = 1; // For JSON-RPC id

async function makeRpcRequest(url, method, params, serverConfig, isLogin = false) {
    const apiUrl = `${url.replace(/\/$/, '')}/json`;
    const payload = {
        method: method,
        params: params,
        id: delugeRequestId++,
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (delugeSessionCookie && !isLogin) {
        headers['Cookie'] = delugeSessionCookie;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            credentials: 'include', // Ensure cookies are sent and received
        });

        if (isLogin && response.headers.has('set-cookie')) {
            // Attempt to capture the session cookie.
            // Note: Service workers have limitations with direct cookie manipulation.
            // This might need to be handled by the browser's cookie store automatically
            // if the request is made from the extension's domain with appropriate permissions,
            // or we might need a more robust way if 'credentials: include' is not enough.
            // For now, we'll assume 'credentials: "include"' might work or that the cookie
            // is httpOnly and managed by the browser. This is a known complexity.
            const rawCookies = response.headers.get('set-cookie');
            // Simplistic parsing, might need refinement
            if (rawCookies) {
                const sessionCookiePart = rawCookies.split(';').find(part => part.trim().startsWith('_session_id='));
                if (sessionCookiePart) {
                    delugeSessionCookie = sessionCookiePart.trim();
                }
            }
        }

        if (!response.ok) {
            // Deluge might return 401 or 403 for auth issues, or other errors.
             const errorText = await response.text();
            debug.error(`Deluge API error: ${response.status} ${errorText}`);
            let errorCode = "API_ERROR";
            if (response.status === 401 || response.status === 403) errorCode = "AUTH_FAILED_SESSION";
            return { 
                success: false, 
                error: {
                    userMessage: "Deluge API request failed.",
                    technicalDetail: `API Error: ${response.status} ${errorText}`,
                    errorCode: errorCode
                },
                status: response.status // Keep status for potential retry logic
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
                    errorCode: "RPC_ERROR"
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
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

async function login(serverConfig) {
    const loginResult = await makeRpcRequest(
        serverConfig.url,
        'auth.login',
        [serverConfig.password], // Deluge typically uses only a password for the web UI
        serverConfig,
        true
    );
    // The makeRpcRequest handles setting delugeSessionCookie if login is successful
    // and set-cookie header is present.
    // auth.login returns true on success.
    if (loginResult.success && loginResult.data === true) {
        // Check if cookie was actually set (this is tricky from service worker)
        return { success: true };
    }
    // loginResult.error here would already be the standardized error object from makeRpcRequest
    return { 
        success: false, 
        error: loginResult.error || { 
            userMessage: "Deluge login failed or cookie not set.", 
            errorCode: "LOGIN_FAILED" 
        } 
    };
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, password, clientType, ... }
    // torrentOptions: { downloadDir, paused, category, tags, selectedFileIndices, totalFileCount, torrentFileContentBase64, originalTorrentUrl }
    // Note: `torrentUrl` parameter here is `originalTorrentUrl` from background.js

    const { 
        selectedFileIndices, 
        totalFileCount, 
        paused: userWantsPaused,
        torrentFileContentBase64,
        // originalTorrentUrl is already passed as torrentUrl parameter
    } = torrentOptions;

    const isMagnet = torrentUrl.startsWith('magnet:');
    const useFileSelection = !isMagnet && typeof totalFileCount === 'number' && totalFileCount > 0 && Array.isArray(selectedFileIndices);

    if (!delugeSessionCookie) {
        const loginAttempt = await login(serverConfig);
        if (!loginAttempt.success) {
            // loginAttempt.error is already the standardized error object
            return { 
                success: false, 
                error: loginAttempt.error || { // Fallback, though login() should always provide error obj
                    userMessage: "Deluge login required and failed.",
                    errorCode: "LOGIN_REQUIRED_FAILED"
                }
            };
        }
    }

    // Ensure logged in - Deluge needs a session.
    if (!delugeSessionCookie && !serverConfig.isRetryingLogin) { // Add isRetryingLogin to prevent infinite loops
        serverConfig.isRetryingLogin = true; // Mark that we are attempting a login sequence
        const loginAttempt = await login(serverConfig);
        serverConfig.isRetryingLogin = false; // Reset flag
        if (!loginAttempt.success) {
            return { success: false, error: loginAttempt.error || { userMessage: "Deluge login required and failed.", errorCode: "LOGIN_REQUIRED_FAILED" }};
        }
    }

    let rpcMethod;
    let rpcParams;
    const addOptions = {};

    if (torrentOptions.downloadDir) {
        addOptions.download_location = torrentOptions.downloadDir;
    }

    const addPausedEffective = useFileSelection ? true : userWantsPaused;
    if (typeof addPausedEffective === 'boolean') {
        addOptions.add_paused = addPausedEffective;
    }

    if (torrentFileContentBase64 && !isMagnet) {
        rpcMethod = 'core.add_torrent_file';
        let fileName = 'file.torrent';
        if (torrentUrl) { // torrentUrl is originalTorrentUrl here
            try {
                const urlPath = new URL(torrentUrl).pathname;
                const nameFromPath = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                if (nameFromPath && nameFromPath.toLowerCase().endsWith('.torrent')) {
                    fileName = nameFromPath;
                }
            } catch (e) { /* ignore, use default */ }
        }
        rpcParams = [fileName, torrentFileContentBase64, addOptions];
        debug.log(`Deluge: Adding torrent using file content (core.add_torrent_file). Filename: ${fileName}. Effective paused: ${addOptions.add_paused}. File selection active: ${useFileSelection}`);
    } else {
        rpcMethod = 'web.add_torrents';
        const webAddParams = { path: torrentUrl, options: addOptions };
        rpcParams = [[webAddParams]]; // web.add_torrents expects an array of torrent objects
        debug.log(`Deluge: Adding torrent using URL (web.add_torrents). URL: ${torrentUrl}. Effective paused: ${addOptions.add_paused}. File selection active: ${useFileSelection}`);
    }
    
    const addResult = await makeRpcRequest(serverConfig.url, rpcMethod, rpcParams, serverConfig);

    if (!addResult.success) {
        if (addResult.error && addResult.error.errorCode === "AUTH_FAILED_SESSION" && !serverConfig.retriedLoginOnAdd) {
            delugeSessionCookie = null;
            serverConfig.retriedLoginOnAdd = true; // Prevent infinite retry for add
            const loginAttempt = await login(serverConfig);
            if (loginAttempt.success) {
                return addTorrent(torrentUrl, serverConfig, torrentOptions); // Retry addTorrent
            } else {
                return { success: false, error: loginAttempt.error || { userMessage: "Deluge re-login attempt failed during add.", errorCode: "RELOGIN_FAILED_ON_ADD" }};
            }
        }
        return { success: false, error: addResult.error || { userMessage: 'Failed to add torrent to Deluge or unexpected response.', errorCode: "ADD_FAILED_UNKNOWN" }};
    }
    
    // web.add_torrents returns an array of results, one for each torrent.
    // Example success: [[true, "torrent_id_hash"]]
    // Example failure: [[false, "Error message"]]
    if (!addResult.data || !Array.isArray(addResult.data) || addResult.data.length === 0 || !Array.isArray(addResult.data[0]) || addResult.data[0].length < 2) {
        return { success: false, error: { userMessage: "Deluge add torrent response format unexpected.", technicalDetail: JSON.stringify(addResult.data), errorCode: "ADD_UNEXPECTED_RESPONSE_FORMAT" }};
    }

    const [successFlag, torrentIdOrError] = addResult.data[0];

    if (!successFlag) {
        return { success: false, error: { userMessage: "Deluge reported an error adding the torrent.", technicalDetail: torrentIdOrError, errorCode: "ADD_RPC_ERROR" }};
    }

    const torrentId = torrentIdOrError; // This is the hash

    if (useFileSelection && torrentId) {
        try {
            debug.log(`Deluge: Torrent added with ID ${torrentId}, proceeding with file selection.`);
            const filePriorities = new Array(totalFileCount).fill(0); // 0: Do Not Download
            selectedFileIndices.forEach(index => {
                if (index >= 0 && index < totalFileCount) {
                    filePriorities[index] = 1; // 1: Normal Priority
                }
            });

            const setPrioOptions = { file_priorities: filePriorities };
            const setPrioResult = await makeRpcRequest(serverConfig.url, 'core.set_torrent_options', [[torrentId], setPrioOptions], serverConfig);

            if (!setPrioResult.success) {
                debug.warn(`Deluge: Failed to set file priorities for ${torrentId}. Error: ${setPrioResult.error?.technicalDetail || 'Unknown'}`);
                // Continue, but torrent might download all files or respect only initial paused state.
            } else {
                debug.log(`Deluge: File priorities set for ${torrentId}. Priorities: ${filePriorities.join(',')}`);
            }

            if (userWantsPaused === false) { // If user originally wanted it started
                const resumeResult = await makeRpcRequest(serverConfig.url, 'core.resume_torrent', [[torrentId]], serverConfig);
                if (resumeResult.success) {
                    debug.log(`Deluge: Resumed torrent ${torrentId}.`);
                } else {
                    debug.warn(`Deluge: Failed to resume torrent ${torrentId} after setting priorities.`);
                }
            }
        } catch (prioError) {
            debug.error(`Deluge: Error during post-add file priority setting for ${torrentId}:`, prioError);
            // Return success for add, but with a warning about file selection
             return { success: true, data: { id: torrentId, name: torrentId, warning: `Torrent added, but an error occurred setting file priorities: ${prioError.message}` } };
        }
    }
    
    return { success: true, data: { id: torrentId, name: torrentId } }; // Deluge add_torrents returns the ID (hash) as the "name" in this context
}

export async function testConnection(serverConfig) {
    const loginAttempt = await login(serverConfig);
    if (!loginAttempt.success) {
        // loginAttempt.error is already standardized
        return { 
            success: false, 
            error: loginAttempt.error || { // Fallback
                userMessage: "Deluge login failed during connection test.",
                errorCode: "TEST_LOGIN_FAILED"
            }
        };
    }
    
    const sessionCheckResult = await makeRpcRequest(serverConfig.url, 'auth.check_session', [], serverConfig);
    if (sessionCheckResult.success && sessionCheckResult.data === true) { 
        return { success: true, data: { message: "Deluge session is valid." } };
    }
    
    delugeSessionCookie = null; 
    return { 
        success: false, 
        error: sessionCheckResult.error || { // sessionCheckResult.error should be standardized
            userMessage: 'Deluge session check failed after login.',
            errorCode: "SESSION_CHECK_FAILED"
        }
    };
}
