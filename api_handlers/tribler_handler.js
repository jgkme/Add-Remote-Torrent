import { debug } from '../debug';

// Tribler API Handler

async function makeApiRequest(serverConfig, method, endpoint, body) {
    const url = `${serverConfig.url.replace(/\/$/, '')}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Api-Key': serverConfig.apiKey,
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Tribler API request failed: ${response.status} ${response.statusText}` } };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        debug.error(`Error communicating with Tribler at ${endpoint}:`, error);
        return { success: false, error: { userMessage: `Could not contact Tribler: ${error.message}` } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        torrentFileContentBase64,
        downloadDir,
        isPaused,
    } = torrentOptions;

    const body = {
        uri: torrentUrl,
        destination: downloadDir,
        anon_hops: 2, // Default to 2 hops for anonymity
        safe_seeding: true,
    };

    if (torrentUrl.startsWith("magnet:")) {
        return makeApiRequest(serverConfig, 'PUT', '/api/downloads', body);
    } else {
        const endpoint = '/api/downloads';
        const url = `${serverConfig.url.replace(/\/$/, '')}${endpoint}`;
        const headers = {
            'Content-Type': 'applications/x-bittorrent',
            'X-Api-Key': serverConfig.apiKey,
        };

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: Buffer.from(torrentFileContentBase64, 'base64'),
            });

            if (!response.ok) {
                return { success: false, error: { userMessage: `Tribler API request failed: ${response.status} ${response.statusText}` } };
            }

            return { success: true, data: await response.json() };
        } catch (error) {
            debug.error('Error adding torrent file to Tribler:', error);
            return { success: false, error: { userMessage: `Could not contact Tribler: ${error.message}` } };
        }
    }
}

export async function testConnection(serverConfig) {
    return makeApiRequest(serverConfig, 'GET', '/api/downloads', undefined);
}
