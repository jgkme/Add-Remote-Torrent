import { debug } from '../debug';

// uTorrent (Old) API Handler

let csrfToken = null;
let lastTokenFetch = 0;

async function getCsrfToken(serverConfig) {
    const now = Date.now();
    if (csrfToken && now - lastTokenFetch < 300000) { // Cache token for 5 minutes
        return csrfToken;
    }

    const tokenUrl = `${serverConfig.url.replace(/\/$/, '')}/gui/token.html`;
    try {
        const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        const tokenMatch = /<div id='token' style='display:none;'>([^<]+)<\/div>/.exec(responseText);
        if (tokenMatch && tokenMatch[1]) {
            csrfToken = tokenMatch[1];
            lastTokenFetch = now;
            return csrfToken;
        } else {
            throw new Error('CSRF token not found in uTorrent /gui/token.html response.');
        }
    } catch (error) {
        debug.error('Error fetching uTorrent CSRF token:', error);
        csrfToken = null;
        throw new Error(`TokenFetchError: ${error.message}`);
    }
}

async function makeApiRequest(serverUrl, action, params = {}, serverConfig, method = 'GET', body = null) {
    try {
        const token = await getCsrfToken(serverConfig);
        if (!token) {
            return { success: false, error: { userMessage: "Failed to obtain uTorrent CSRF token. Check credentials and server URL.", errorCode: "TOKEN_FETCH_FAILED" } };
        }

        const queryParams = new URLSearchParams(params);
        queryParams.append('token', token);
        queryParams.append('action', action);

        const url = `${serverUrl.replace(/\/$/, '')}/gui/?${queryParams.toString()}`;
        const fetchOptions = {
            method: method,
            headers: {
                'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`
            },
            credentials: 'include'
        };

        if (body) {
            fetchOptions.body = body;
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            if ((response.status === 401 || response.status === 403) && !params.retriedWithNewToken) {
                debug.log("uTorrent request failed, possibly stale token. Refetching token and retrying.");
                csrfToken = null;
                params.retriedWithNewToken = true;
                return makeApiRequest(serverUrl, action, params, serverConfig, method, body);
            }
            const errorText = await response.text();
            return { success: false, error: { userMessage: "uTorrent API request failed.", technicalDetail: `API Error: ${response.status} ${errorText}`, errorCode: (response.status === 401 || response.status === 403) ? "AUTH_ERROR" : "API_REQUEST_FAILED" } };
        }

        if (action === 'getsettings' || action === 'gettorrents') {
            const json = await response.json();
            return { success: true, data: json };
        }

        return { success: true };

    } catch (error) {
        debug.error('Error in uTorrent API request:', error);
        if (error.message && error.message.startsWith('TokenFetchError:')) {
            return { success: false, error: { userMessage: "Failed to obtain uTorrent CSRF token. Check credentials and server URL.", technicalDetail: error.message.substring(17), errorCode: "TOKEN_FETCH_FAILED" } };
        }
        return { success: false, error: { userMessage: "A network error occurred or the uTorrent server could not be reached.", technicalDetail: error.message, errorCode: "NETWORK_ERROR" } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const { torrentFileContentBase64 } = torrentOptions;

    if (torrentUrl.startsWith("magnet:")) {
        return makeApiRequest(serverConfig.url, 'add-url', { s: torrentUrl }, serverConfig, 'GET');
    } else {
        const formData = new FormData();
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        formData.append("torrent_file", blob, "file.torrent");
        return makeApiRequest(serverConfig.url, 'add-file', {}, serverConfig, 'POST', formData);
    }
}

export async function testConnection(serverConfig) {
    const result = await makeApiRequest(serverConfig.url, 'getsettings', {}, serverConfig, 'GET');
    if (result.success && result.data && result.data.settings) {
        return { success: true, data: { message: "Successfully connected to uTorrent." } };
    }
    return { success: false, error: result.error || { userMessage: "Failed to get settings or parse response from uTorrent.", errorCode: "TEST_CONN_INVALID_RESPONSE" } };
}
