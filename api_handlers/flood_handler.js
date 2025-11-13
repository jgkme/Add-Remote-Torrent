import { debug } from '../debug';

// Flood API Handler

async function authenticate(serverConfig) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api/auth/authenticate`;
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
    };

    // Add basic auth header if enabled (for reverse proxy setups)
    if (serverConfig.useBasicAuth && serverConfig.basicAuthUsername && serverConfig.basicAuthPassword) {
        const authString = btoa(`${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`);
        headers['Authorization'] = `Basic ${authString}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
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
    const authResult = await authenticate(serverConfig);
    if (!authResult.success) {
        return authResult;
    }

    const {
        paused,
        torrentFileContentBase64,
        downloadDir,
        labels,
    } = torrentOptions;

    if (torrentUrl.startsWith("magnet:")) {
        const body = {
            urls: [torrentUrl],
            start: !paused,
            destination: downloadDir,
            tags: labels || [],
            isBasePath: false,
            isCompleted: false
        };
        return makeApiRequest(serverConfig, '/torrents/add-urls', body);
    } else {
        const body = {
            files: [torrentFileContentBase64],
            start: !paused,
            destination: downloadDir,
            tags: labels || [],
            isBasePath: false,
            isCompleted: false
        };
        return makeApiRequest(serverConfig, '/torrents/add-files', body);
    }
}

export async function testConnection(serverConfig) {
    return authenticate(serverConfig);
}
