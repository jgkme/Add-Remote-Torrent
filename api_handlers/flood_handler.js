import { debug } from '../debug';

// Flood API Handler

async function makeApiRequest(serverConfig, endpoint, body) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api${endpoint}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            return { success: false, error: { userMessage: `Flood API request failed: ${response.status} ${response.statusText}` } };
        }
        return { success: true, data: await response.json() };
    } catch (error) {
        debug.error(`Error communicating with Flood at ${endpoint}:`, error);
        return { success: false, error: { userMessage: `Could not contact Flood: ${error.message}` } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        isPaused,
        torrentFileContentBase64,
        downloadDir,
        tags,
    } = torrentOptions;

    if (torrentUrl.startsWith("magnet:")) {
        const body = {
            urls: [torrentUrl],
            start: !isPaused,
            destination: downloadDir,
            tags: tags || [],
            isBasePath: false,
            isCompleted: false,
            isSequential: false,
            isInitialSeeding: false,
        };
        return makeApiRequest(serverConfig, '/torrents/add-urls', body);
    } else {
        const body = {
            files: [torrentFileContentBase64],
            start: !isPaused,
            destination: downloadDir,
            tags: tags || [],
            isBasePath: false,
            isCompleted: false,
            isSequential: false,
            isInitialSeeding: false,
        };
        return makeApiRequest(serverConfig, '/torrents/add-files', body);
    }
}

export async function testConnection(serverConfig) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/auth/authenticate`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({ username: serverConfig.username, password: serverConfig.password }),
        });
        if (!response.ok) {
            return { success: false, error: { userMessage: `Flood authentication failed: ${response.status} ${response.statusText}` } };
        }
        const json = await response.json();
        if (!json.success) {
            return { success: false, error: { userMessage: 'Flood login failed. Check credentials.' } };
        }
        return { success: true };
    } catch (error) {
        debug.error('Error authenticating with Flood:', error);
        return { success: false, error: { userMessage: `Could not contact Flood: ${error.message}` } };
    }
}
