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
        params: params,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
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

function buildPorlaAddParams(torrentUrl, torrentOptions, serverConfig) {
    const params = {};

    if (torrentUrl.startsWith('magnet:')) {
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

    const category =
        (typeof torrentOptions.category === 'string' && torrentOptions.category.trim()) ||
        '';
    if (category) {
        params.category = category.trim();
    }

    const tagList = [];
    if (Array.isArray(torrentOptions.labels) && torrentOptions.labels.length > 0) {
        tagList.push(...torrentOptions.labels.map((t) => String(t).trim()).filter(Boolean));
    } else if (typeof torrentOptions.tags === 'string' && torrentOptions.tags.trim()) {
        tagList.push(
            ...torrentOptions.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
        );
    }
    if (tagList.length > 0) {
        params.tags = tagList;
    }

    const preset = (serverConfig.porlaPreset || '').trim();
    if (preset) {
        params.preset = preset;
    }

    if (serverConfig.porlaDownloadLimit > 0) {
        params.download_limit = Number(serverConfig.porlaDownloadLimit);
    }
    if (serverConfig.porlaUploadLimit > 0) {
        params.upload_limit = Number(serverConfig.porlaUploadLimit);
    }

    return params;
}

async function addTorrentWithParams(serverConfig, params, token) {
    let result = await makeApiRequest(serverConfig, 'torrents.add', params, token);
    if (result.success) {
        return result;
    }

    const errMsg = String(result.error?.userMessage || '');
    const optionalKeys = ['category', 'tags', 'preset', 'download_limit', 'upload_limit'];
    if (!optionalKeys.some((k) => k in params)) {
        return result;
    }

    debug.warn('Porla: Retrying torrents.add without optional params:', errMsg);
    const minimal = { ...params };
    for (const key of optionalKeys) {
        delete minimal[key];
    }
    return makeApiRequest(serverConfig, 'torrents.add', minimal, token);
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    try {
        const token = await authenticateForToken(serverConfig);
        const params = buildPorlaAddParams(torrentUrl, torrentOptions, serverConfig);
        return addTorrentWithParams(serverConfig, params, token);
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
                    version: result.data.porla,
                },
            };
        }
        return result;
    } catch (error) {
        return { success: false, error: { userMessage: `Failed to connect to Porla: ${error.message}` } };
    }
}
