// Buffalo LinkStation (BitTorrent Client) API Handler
// Assumed to be a modified uTorrent WebUI.

let buffaloToken = null;
let lastTokenFetchTimeBuffalo = 0;
const TOKEN_CACHE_DURATION_BUFFALO = 5 * 60 * 1000; // Cache token for 5 minutes

async function getCsrfTokenBuffalo(serverConfig) {
    const now = Date.now();
    if (buffaloToken && (now - lastTokenFetchTimeBuffalo < TOKEN_CACHE_DURATION_BUFFALO)) {
        return buffaloToken;
    }

    const tokenUrl = `${serverConfig.url.replace(/\/$/, '')}/gui/token.html`;
    try {
        const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`,
            },
            credentials: 'include', 
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch Buffalo CSRF token: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        const match = /<div id='token' style='display:none;'>([^<]+)<\/div>/.exec(html);
        if (match && match[1]) {
            buffaloToken = match[1];
            lastTokenFetchTimeBuffalo = now;
            return buffaloToken;
        } else {
            throw new Error('Buffalo CSRF token not found in response.');
        }
    } catch (error) {
        console.error('Error fetching Buffalo CSRF token:', error);
        buffaloToken = null; 
        throw new Error(`TokenFetchErrorBuffalo: ${error.message}`);
    }
}

async function makeApiRequestBuffalo(baseUrl, action, params = {}, serverConfig, method = 'GET') {
    let token;
    try {
        token = await getCsrfTokenBuffalo(serverConfig);
    } catch (tokenError) {
        return {
            success: false,
            error: {
                userMessage: "Failed to obtain Buffalo CSRF token. Check credentials and server URL.",
                technicalDetail: tokenError.message,
                errorCode: "TOKEN_FETCH_FAILED"
            }
        };
    }
    if (!token) {
        return {
            success: false,
            error: {
                userMessage: "Failed to obtain Buffalo CSRF token (unexpected).",
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
            method: method,
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            if ((response.status === 401 || response.status === 403) && !params.retriedWithNewToken) {
                console.log('Buffalo request failed, possibly stale token. Refetching token and retrying.');
                buffaloToken = null; 
                params.retriedWithNewToken = true;
                return makeApiRequestBuffalo(baseUrl, action, params, serverConfig, method); // Retry
            }
            const errorText = await response.text();
            return {
                success: false,
                error: {
                    userMessage: "Buffalo API request failed.",
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
        console.error('Error in Buffalo API request:', error);
        if (error.message && error.message.startsWith("TokenFetchErrorBuffalo:")) {
            return {
                success: false,
                error: {
                    userMessage: "Failed to obtain Buffalo CSRF token. Check credentials and server URL.",
                    technicalDetail: error.message.substring("TokenFetchErrorBuffalo: ".length),
                    errorCode: "TOKEN_FETCH_FAILED"
                }
            };
        }
        return {
            success: false,
            error: {
                userMessage: "A network error occurred or the Buffalo server could not be reached.",
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

    // Buffalo variant requires 'dir=' for download path.
    if (torrentOptions.downloadDir) {
        params.dir = encodeURIComponent(torrentOptions.downloadDir); // Ensure URL encoding
    } else {
        // If dir is strictly required and not provided, this might be an issue.
        // For now, we'll proceed without it if not specified by user.
        console.warn("Buffalo: downloadDir not specified. Default path will be used by the client.");
    }
    
    if (torrentOptions.labels && torrentOptions.labels.length > 0) {
        params.label = torrentOptions.labels[0]; // Assuming similar label support to uTorrent
    }
    
    // Paused state not directly supported by add-url for uTorrent-like APIs.
    const result = await makeApiRequestBuffalo(serverConfig.url, 'add-url', params, serverConfig, 'GET');
    
    if (result.success && torrentOptions.paused) {
        console.warn("Buffalo 'add paused' requested but not implemented via add-url. Torrent will be active.");
    }
    
    return result;
}

export async function testConnection(serverConfig) {
    try {
        await getCsrfTokenBuffalo(serverConfig); 
        const result = await makeApiRequestBuffalo(serverConfig.url, 'gettorrents', { list: '1' }, serverConfig, 'GET');
        
        if (result.success && result.data && typeof result.data.torrents !== 'undefined') {
            return { success: true, data: { build: result.data.build, torrents_count: result.data.torrents.length } }; 
        }
        return {
            success: false,
            error: result.error || {
                userMessage: "Failed to get torrents list or parse response for Buffalo.",
                technicalDetail: "gettorrents action did not return expected data.",
                errorCode: "TEST_CONN_INVALID_RESPONSE"
            }
        };
    } catch (error) {
        return {
            success: false,
            error: {
                userMessage: "Connection test failed for Buffalo.",
                technicalDetail: error.message,
                errorCode: "TEST_CONN_EXCEPTION"
            }
        };
    }
}
