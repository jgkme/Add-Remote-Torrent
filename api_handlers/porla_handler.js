import { debug } from '../debug';

// Porla API Handler

async function makeApiRequest(serverConfig, method, params = {}) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api/jsonrpc`;
    let headers = {
        'Content-Type': 'application/json'
    };

    // JWT token would be handled here if needed, but initial connection test might not require it.
    // This will need to be expanded based on auth requirements.

    const body = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Porla API request failed: ${response.status} ${response.statusText}` } };
        }

        const json = await response.json();
        if (json.error) {
            return { success: false, error: { userMessage: `Porla API Error: ${json.error.message} (Code: ${json.error.code})` } };
        }

        return { success: true, data: json.result };
    } catch (error) {
        debug.error(`Error communicating with Porla at ${method}:`, error);
        return { success: false, error: { userMessage: `Could not contact Porla: ${error.message}` } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // Placeholder - needs implementation based on Porla's specific 'add' method
    const params = {
        uri: torrentUrl,
        // Other options like save path, paused state, etc., will go here.
    };
    if (torrentOptions.downloadDir) {
        params.save_path = torrentOptions.downloadDir;
    }
    if (torrentOptions.paused) {
        params.paused = true;
    }
    // ... and so on for other options.

    return makeApiRequest(serverConfig, 'torrents.add', params);
}

export async function testConnection(serverConfig) {
    // A simple, non-authenticated method is best for testing connection.
    // 'porla.ping' seems like a good candidate.
    return makeApiRequest(serverConfig, 'porla.ping');
}
