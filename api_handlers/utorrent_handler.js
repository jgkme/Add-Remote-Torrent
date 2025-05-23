// uTorrent API Handler
// This file will contain the logic for interacting with the uTorrent WebUI API.

// uTorrent uses a token for CSRF protection, fetched from /gui/token.html
let uTorrentToken = null;
let lastTokenFetchTime = 0;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // Cache token for 5 minutes

async function getCsrfToken(serverConfig) {
    const now = Date.now();
    if (uTorrentToken && (now - lastTokenFetchTime < TOKEN_CACHE_DURATION)) {
        return uTorrentToken;
    }

    const tokenUrl = `${serverConfig.url.replace(/\/$/, '')}/gui/token.html`;
    try {
        // For fetching token, ensure cookies are sent if already set by a previous interaction,
        // and allow browser to store new cookies from this response.
        const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`,
            },
            credentials: 'include', // Ensure cookies are sent and received
        });
        if (!response.ok) {
            // This error will be caught by the catch block below
            throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        const match = /<div id='token' style='display:none;'>([^<]+)<\/div>/.exec(html);
        if (match && match[1]) {
            uTorrentToken = match[1];
            lastTokenFetchTime = now;
            return uTorrentToken; // Success case
        } else {
            // This error will be caught by the catch block below
            throw new Error('CSRF token not found in uTorrent /gui/token.html response.');
        }
    } catch (error) {
        console.error('Error fetching uTorrent CSRF token:', error);
        uTorrentToken = null; 
        // Propagate a structured error. getCsrfToken is called by makeApiRequest,
        // which will then return its own structured error.
        // So, throwing here is fine, or we can return a structured error directly.
        // For consistency, let's make getCsrfToken return null on failure and makeApiRequest handle it.
        // However, the current structure expects getCsrfToken to throw or return token.
        // Let's make it throw a structured-like error message that makeApiRequest can catch.
        throw new Error(`TokenFetchError: ${error.message}`); // Custom error type/message
    }
}

async function makeApiRequest(baseUrl, action, params = {}, serverConfig, method = 'GET') {
    let token;
    try {
        token = await getCsrfToken(serverConfig);
    } catch (tokenError) {
        return { 
            success: false, 
            error: {
                userMessage: "Failed to obtain uTorrent CSRF token. Check credentials and server URL.",
                technicalDetail: tokenError.message, // Contains status from fetch if that failed
                errorCode: "TOKEN_FETCH_FAILED"
            }
        };
    }
    // If getCsrfToken somehow returns null/undefined without throwing (shouldn't happen with current logic)
    if (!token) {
         return { 
            success: false, 
            error: {
                userMessage: "Failed to obtain uTorrent CSRF token (unexpected).",
                errorCode: "TOKEN_UNEXPECTED_FAILURE"
            }
        };
    }

    const queryParams = new URLSearchParams(params);
    queryParams.append('token', token);
    queryParams.append('action', action);
    
    const requestUrl = `${baseUrl.replace(/\/$/, '')}/gui/?${queryParams.toString()}`;

    try {
        const response = await fetch(requestUrl, {
            method: method, // uTorrent add-url is GET
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`,
                // Cookie header is not manually set; rely on 'credentials: "include"'
            },
            credentials: 'include', // Crucial for sending session cookies like GUID
        });

        if (!response.ok) {
            // If token expired (often 401 or 403, though uTorrent might just fail), try to refetch token once.
            if ((response.status === 401 || response.status === 403) && !params.retriedWithNewToken) {
                console.log('uTorrent request failed, possibly stale token. Refetching token and retrying.');
                uTorrentToken = null; // Force refetch
                params.retriedWithNewToken = true;
                return makeApiRequest(baseUrl, action, params, serverConfig, method); // Retry
            }
            const errorText = await response.text();
            return { 
                success: false, 
                error: {
                    userMessage: "uTorrent API request failed.",
                    technicalDetail: `API Error: ${response.status} ${errorText}`,
                    errorCode: (response.status === 401 || response.status === 403) ? "AUTH_ERROR" : "API_REQUEST_FAILED"
                }
            };
        }
        
        // uTorrent API responses are not always JSON.
        // For add-url, a successful response might be empty or non-JSON with 200 OK.
        // For gettorrents (for testing), it's JSON.
        if (action === 'getsettings' || action === 'gettorrents') { // Example actions that return JSON
             const data = await response.json();
             return { success: true, data: data };
        }
        // For add-url, success is implied by 200 OK.
        return { success: true };

    } catch (error) { // Catch network errors or errors from getCsrfToken if it wasn't caught above
        console.error('Error in uTorrent API request:', error);
        // Check if it's a TokenFetchError re-thrown from getCsrfToken
        if (error.message && error.message.startsWith("TokenFetchError:")) {
            return {
                success: false,
                error: {
                    userMessage: "Failed to obtain uTorrent CSRF token. Check credentials and server URL.",
                    technicalDetail: error.message.substring("TokenFetchError: ".length),
                    errorCode: "TOKEN_FETCH_FAILED"
                }
            };
        }
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the uTorrent server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

import bencode from 'bencode'; // For parsing .torrent files to get hash
import { Buffer } from 'buffer';   // For bencode library

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, username, password, clientType }
    // torrentOptions: { downloadDir, paused, labels, selectedFileIndices, totalFileCount }

    const { selectedFileIndices, totalFileCount, paused: userWantsPaused } = torrentOptions;
    const isMagnet = torrentUrl.startsWith('magnet:');
    const useFileSelection = !isMagnet && typeof totalFileCount === 'number' && totalFileCount > 0 && Array.isArray(selectedFileIndices);

    let torrentHash = null;

    if (isMagnet) {
        const match = torrentUrl.match(/btih:([a-fA-F0-9]{40})/);
        if (match && match[1]) {
            torrentHash = match[1].toUpperCase();
        } else {
            // For newer magnet links with base32 hash
            const base32Match = torrentUrl.match(/btih:([a-zA-Z2-7]{32})/);
            if (base32Match && base32Match[1]) {
                // This would require a base32 to hex conversion library.
                // For now, we'll skip hash extraction for base32 magnets if file selection is needed.
                console.warn("uTorrent: Base32 magnet hash detected. File selection might not work without hash conversion.");
                if (useFileSelection) {
                    return { success: false, error: { userMessage: "File selection for Base32 magnet links not yet supported by this handler.", errorCode: "BASE32_HASH_UNSUPPORTED" }};
                }
            }
        }
    } else if (useFileSelection) { // Need hash for .torrent file URL if selecting files
        try {
            const response = await fetch(torrentUrl);
            if (!response.ok) throw new Error(`Failed to fetch .torrent file: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const torrentData = bencode.decode(Buffer.from(arrayBuffer));
            if (torrentData && torrentData.info) {
                // To get the info_hash, we need to bencode just the 'info' dictionary
                // and then SHA1 hash it. This is complex without a crypto library.
                // uTorrent might return the hash on add-url if it's a new torrent.
                // For now, we'll proceed without the hash for .torrent files and hope add-url gives it,
                // or accept that file selection might not work for .torrent URLs if hash isn't returned.
                console.warn("uTorrent: For .torrent file URLs, hash extraction is complex. File selection relies on server returning hash on add.");
            }
        } catch (e) {
            console.error("uTorrent: Error fetching/parsing .torrent for hash:", e);
            if (useFileSelection) {
                return { success: false, error: { userMessage: "Failed to process .torrent file for selection.", technicalDetail: e.message, errorCode: "TORRENT_PROCESS_FAIL" }};
            }
        }
    }
    
    const addParams = { s: torrentUrl };
    if (torrentOptions.downloadDir) addParams.path = torrentOptions.downloadDir;
    if (torrentOptions.labels && torrentOptions.labels.length > 0) addParams.label = torrentOptions.labels[0];

    // Try to add paused if file selection is used, though add-url might not support it.
    // uTorrent's `add-url` doesn't have a direct 'paused' param.
    // We'll add, then try to get hash, then set props and stop/start.

    console.log(`uTorrent: Adding torrent. File selection active: ${useFileSelection}`);
    const addResult = await makeApiRequest(serverConfig.url, 'add-url', addParams, serverConfig, 'GET');

    if (!addResult.success) {
        return addResult;
    }

    // After successful add, try to get all torrents to find the new one if hash wasn't pre-determined
    // This is a common pattern if add-url doesn't return the hash.
    // uTorrent's add-url response is typically empty on success.
    // We need the hash to set file priorities or stop/start.

    if (useFileSelection || userWantsPaused) { // Need hash if we want to modify post-add
        if (!torrentHash) { // If hash wasn't from magnet or .torrent parsing (which we deferred)
            // Attempt to get torrents and find the new one by name/url (less reliable) or assume last added.
            // This is difficult and error-prone with uTorrent's API.
            // A common workaround is to fetch the list, get the 'cid' (cache ID), add, then fetch again
            // and look for torrents not in the old 'cid' list.
            // For now, we'll log a warning if hash is needed but not available.
            console.warn(`uTorrent: Torrent added. Hash not available for post-add operations (file selection/pause). Manual adjustment in uTorrent may be needed.`);
            if (useFileSelection) {
                 return { success: true, data: { warning: "Torrent added, but file priorities could not be set as hash was not identified." } };
            }
        }

        if (torrentHash && useFileSelection) {
            console.log(`uTorrent: Torrent hash ${torrentHash}. Setting file priorities.`);
            const allFileIndices = Array.from({ length: totalFileCount }, (_, i) => i);
            
            for (const index of allFileIndices) {
                const priority = selectedFileIndices.includes(index) ? 2 : 0; // 0: Don't Download, 2: Normal
                const prioParams = { hash: torrentHash, s: 'priority', f: index, v: priority };
                const prioResult = await makeApiRequest(serverConfig.url, 'setprops', prioParams, serverConfig, 'GET');
                if (!prioResult.success) {
                    console.warn(`uTorrent: Failed to set priority for file ${index} of torrent ${torrentHash}.`);
                    // Continue trying for other files
                }
            }
            console.log(`uTorrent: File priorities set for ${torrentHash}.`);
        }

        if (torrentHash && typeof userWantsPaused === 'boolean') {
            const action = userWantsPaused ? 'stop' : 'start';
            console.log(`uTorrent: Setting paused state to ${userWantsPaused} for ${torrentHash} via action ${action}.`);
            const pauseResult = await makeApiRequest(serverConfig.url, action, { hash: torrentHash }, serverConfig, 'GET');
            if (!pauseResult.success) {
                console.warn(`uTorrent: Failed to ${action} torrent ${torrentHash}.`);
            }
        }
    }
    
    return { success: true }; // Base add was successful
}

export async function testConnection(serverConfig) {
    // Test by fetching the torrent list.
    try {
        // First, ensure token can be fetched, which also tests basic auth.
        await getCsrfToken(serverConfig); 
        // Then, try to get the list of torrents.
        // The 'list=1' parameter is often needed.
        const result = await makeApiRequest(serverConfig.url, 'gettorrents', { list: '1' }, serverConfig, 'GET');
        
        if (result.success && result.data && typeof result.data.torrents !== 'undefined') {
            return { success: true, data: { build: result.data.build, torrents_count: result.data.torrents.length } }; 
        }
        // If makeApiRequest returned success:false, result.error is already the structured error object
        return { 
            success: false, 
            error: result.error || {
                userMessage: "Failed to get torrents list or parse response from uTorrent.",
                technicalDetail: "gettorrents action did not return expected data.",
                errorCode: "TEST_CONN_INVALID_RESPONSE"
            }
        };
    } catch (error) { // This catch is primarily for errors thrown by getCsrfToken directly if not handled by makeApiRequest
        return { 
            success: false, 
            error: {
                userMessage: "Connection test failed for uTorrent.",
                technicalDetail: error.message,
                errorCode: "TEST_CONN_EXCEPTION"
            }
        };
    }
}
