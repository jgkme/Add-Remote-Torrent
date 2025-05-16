// BitTorrent API Handler
// This file will contain the logic for interacting with the BitTorrent WebUI API.
// It is often very similar to uTorrent's API.

// Re-use or adapt uTorrent's token logic if applicable.
// For now, this will be a simplified placeholder.
let bitTorrentToken = null; 
let lastTokenFetchTimeBt = 0;
const TOKEN_CACHE_DURATION_BT = 5 * 60 * 1000;

async function getCsrfTokenBt(serverConfig) {
    const now = Date.now();
    if (bitTorrentToken && (now - lastTokenFetchTimeBt < TOKEN_CACHE_DURATION_BT)) {
        return bitTorrentToken;
    }

    const tokenUrl = `${serverConfig.url.replace(/\/$/, '')}/gui/token.html`;
    try {
        const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`,
            },
            credentials: 'include', // Ensure cookies are sent and received
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch BitTorrent CSRF token: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        const match = /<div id='token' style='display:none;'>([^<]+)<\/div>/.exec(html);
        if (match && match[1]) {
            bitTorrentToken = match[1];
            lastTokenFetchTimeBt = now;
            return bitTorrentToken;
        } else {
            throw new Error('BitTorrent CSRF token not found in response.');
        }
    } catch (error) {
        console.error('Error fetching BitTorrent CSRF token:', error);
        bitTorrentToken = null;
        throw new Error(`TokenFetchErrorBt: ${error.message}`); // Custom error for makeApiRequestBt to catch
    }
}


async function makeApiRequestBt(baseUrl, action, params = {}, serverConfig, method = 'GET') {
    let token;
    try {
        token = await getCsrfTokenBt(serverConfig);
    } catch (tokenError) {
        return {
            success: false,
            error: {
                userMessage: "Failed to obtain BitTorrent CSRF token. Check credentials and server URL.",
                technicalDetail: tokenError.message,
                errorCode: "TOKEN_FETCH_FAILED"
            }
        };
    }
    if (!token) { // Should be caught by the try/catch, but as a safeguard
        return {
            success: false,
            error: {
                userMessage: "Failed to obtain BitTorrent CSRF token (unexpected).",
                errorCode: "TOKEN_UNEXPECTED_FAILURE"
            }
        };
    }

    const queryParams = new URLSearchParams(params);
    queryParams.append('token', token);
    queryParams.append('action', action);
    // BitTorrent might use 'list=1' for gettorrents, needs verification.
    if (action === 'gettorrents') queryParams.append('list', '1');
    
    const requestUrl = `${baseUrl.replace(/\/$/, '')}/gui/?${queryParams.toString()}`;

    try {
        const response = await fetch(requestUrl, {
            method: method,
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`,
                // Cookie header is not manually set; rely on 'credentials: "include"'
            },
            credentials: 'include', // Crucial for sending session cookies like GUID
        });

        if (!response.ok) {
            if ((response.status === 401 || response.status === 403) && !params.retriedWithNewToken) {
                console.log('BitTorrent request failed, possibly stale token. Refetching token and retrying.');
                bitTorrentToken = null; 
                params.retriedWithNewToken = true;
                return makeApiRequestBt(baseUrl, action, params, serverConfig, method); // Retry
            }
            const errorText = await response.text();
            return {
                success: false,
                error: {
                    userMessage: "BitTorrent API request failed.",
                    technicalDetail: `API Error: ${response.status} ${errorText}`,
                    errorCode: (response.status === 401 || response.status === 403) ? "AUTH_ERROR" : "API_REQUEST_FAILED"
                }
            };
        }
        
        if (action === 'getsettings' || action === 'gettorrents') {
             const data = await response.json();
             return { success: true, data: data };
        }
        return { success: true };

    } catch (error) {
        console.error('Error in BitTorrent API request:', error);
        if (error.message && error.message.startsWith("TokenFetchErrorBt:")) {
            return {
                success: false,
                error: {
                    userMessage: "Failed to obtain BitTorrent CSRF token. Check credentials and server URL.",
                    technicalDetail: error.message.substring("TokenFetchErrorBt: ".length),
                    errorCode: "TOKEN_FETCH_FAILED"
                }
            };
        }
        return {
            success: false,
            error: {
                userMessage: "A network error occurred or the BitTorrent server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}


export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const params = {
        s: torrentUrl,
    };
    if (torrentOptions.downloadDir) {
        params.path = torrentOptions.downloadDir; // Add path parameter
    }
    if (torrentOptions.labels && torrentOptions.labels.length > 0) {
        params.label = torrentOptions.labels[0];
    }
    // Paused similar to uTorrent - likely post-add actions or specific configs.
    
    const result = await makeApiRequestBt(serverConfig.url, 'add-url', params, serverConfig, 'GET');
    
    if (result.success && torrentOptions.paused) {
        console.warn("BitTorrent 'add paused' requested but not implemented via add-url. Torrent will be active.");
    }
    return result;
}

export async function testConnection(serverConfig) {
    try {
        await getCsrfTokenBt(serverConfig); 
        const result = await makeApiRequestBt(serverConfig.url, 'gettorrents', { list: '1' }, serverConfig, 'GET');
        if (result.success && result.data && typeof result.data.torrents !== 'undefined') {
            return { success: true, data: { build: result.data.build, torrents_count: result.data.torrents.length } };
        }
        return {
            success: false,
            error: result.error || { // result.error should be structured if it came from makeApiRequestBt
                userMessage: "Failed to get torrents list or parse response from BitTorrent.",
                technicalDetail: "gettorrents action did not return expected data.",
                errorCode: "TEST_CONN_INVALID_RESPONSE"
            }
        };
    } catch (error) { // Catches errors from getCsrfTokenBt if not handled by makeApiRequestBt
        return {
            success: false,
            error: {
                userMessage: "Connection test failed for BitTorrent.",
                technicalDetail: error.message,
                errorCode: "TEST_CONN_EXCEPTION"
            }
        };
    }
}
