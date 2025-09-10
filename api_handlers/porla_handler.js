import { debug } from '../debug';

// Porla API Handler

async function authenticateForToken(serverConfig) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api/v1/auth/login`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                username: serverConfig.username,
                password: serverConfig.password,
            }),
        });
        const json = await response.json();
        if (json.error) {
            throw new Error(json.error);
        }
        return json.token;
    } catch (error) {
        debug.error('Error authenticating with Porla:', error);
        throw error;
    }
}

async function makeApiRequest(serverConfig, method, params = {}, token) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api/v1/jsonrpc`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

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
    try {
        const token = await authenticateForToken(serverConfig);
        const params = {};

        if (torrentUrl.startsWith("magnet:")) {
            params.magnet_uri = torrentUrl;
        } else {
            params.ti = torrentOptions.torrentFileContentBase64;
        }

        if (torrentOptions.downloadDir) {
            params.save_path = torrentOptions.downloadDir;
        }
        if (torrentOptions.paused) {
            params.paused = true;
        }

        return makeApiRequest(serverConfig, 'torrents.add', params, token);
    } catch (error) {
        return { success: false, error: { userMessage: `Failed to add torrent to Porla: ${error.message}` } };
    }
}

export async function testConnection(serverConfig) {
    try {
        const token = await authenticateForToken(serverConfig);
        const result = await makeApiRequest(serverConfig, 'sys.versions', {}, token);
        if (result.success && result.data) {
            return {
                success: true,
                data: {
                    message: 'Successfully connected to Porla.',
                    version: result.data.porla
                }
            };
        }
        return result;
    } catch (error) {
        return { success: false, error: { userMessage: `Failed to connect to Porla: ${error.message}` } };
    }
}
