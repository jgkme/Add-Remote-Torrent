import { debug } from '../debug';
import { Buffer } from 'buffer';

// uTorrent (Old) API Handler
// This handler is for very old versions of uTorrent (e.g., 2.0.4) that do not use a CSRF token.

async function makeApiRequest(serverUrl, action, params = {}, serverConfig, method = 'GET', body = null) {
    try {
        const queryParams = new URLSearchParams(params);
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
            const errorText = await response.text();
            return { success: false, error: { userMessage: "uTorrent API request failed.", technicalDetail: `API Error: ${response.status} ${errorText}`, errorCode: (response.status === 401 || response.status === 403) ? "AUTH_ERROR" : "API_REQUEST_FAILED" } };
        }

        // For old uTorrent, a successful add-url might return a non-JSON response.
        // A successful getsettings should return JSON.
        if (action === 'getsettings') {
            const json = await response.json();
            return { success: true, data: json };
        }

        return { success: true };

    } catch (error) {
        debug.error('Error in uTorrent (Old) API request:', error);
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
