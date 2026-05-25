import { debug } from '../debug';

// Flood API Handler

async function authenticate(serverConfig) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api/auth/authenticate`;
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
    };

    if (serverConfig.useBasicAuth && serverConfig.basicAuthUsername && serverConfig.basicAuthPassword) {
        const authString = btoa(`${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`);
        headers['Authorization'] = `Basic ${authString}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ username: serverConfig.username, password: serverConfig.password }),
            credentials: 'include',
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
    const headers = { 'Content-Type': 'application/json' };
    if (serverConfig.useBasicAuth && serverConfig.basicAuthUsername && serverConfig.basicAuthPassword) {
        headers['Authorization'] = `Basic ${btoa(`${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`)}`;
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(body),
        });
        const text = await response.text();
        let data = null;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (_) {
                data = { raw: text };
            }
        }
        if (!response.ok) {
            const msg =
                data?.error?.message ||
                data?.message ||
                `Flood API request failed: ${response.status} ${response.statusText}`;
            if (response.status === 409 || /already|duplicate/i.test(String(msg))) {
                return { success: true, duplicate: true, data: { message: msg } };
            }
            return { success: false, error: { userMessage: msg, technicalDetail: text } };
        }
        return { success: true, data };
    } catch (error) {
        debug.error(`Error communicating with Flood at ${endpoint}:`, error);
        return { success: false, error: { userMessage: `Could not contact Flood: ${error.message}` } };
    }
}

function buildFloodTags(torrentOptions, serverConfig) {
    const tags = [];
    if (Array.isArray(torrentOptions.labels) && torrentOptions.labels.length > 0) {
        tags.push(...torrentOptions.labels.map(String));
    } else if (torrentOptions.category && String(torrentOptions.category).trim()) {
        tags.push(String(torrentOptions.category).trim());
    }
    return tags;
}

function buildFloodAddBody(torrentOptions, serverConfig, base) {
    const body = { ...base };
    const tags = buildFloodTags(torrentOptions, serverConfig);
    if (tags.length > 0) body.tags = tags;
    if (torrentOptions.downloadDir) body.destination = torrentOptions.downloadDir;
    if (typeof torrentOptions.paused === 'boolean') {
        body.start = !torrentOptions.paused;
    }
    if (torrentOptions.sequential === true || serverConfig.floodSequentialDownload) {
        body.isSequential = true;
    }
    if (torrentOptions.cookies && typeof torrentOptions.cookies === 'object') {
        body.cookies = torrentOptions.cookies;
    }
    return body;
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const authResult = await authenticate(serverConfig);
    if (!authResult.success) {
        return authResult;
    }

    const { torrentFileContentBase64 } = torrentOptions;

    if (torrentUrl.startsWith('magnet:')) {
        const body = buildFloodAddBody(
            torrentOptions,
            serverConfig,
            {
                urls: [torrentUrl],
                isBasePath: false,
                isCompleted: false,
            }
        );
        return makeApiRequest(serverConfig, '/torrents/add-urls', body);
    }

    const body = buildFloodAddBody(
        torrentOptions,
        serverConfig,
        {
            files: [torrentFileContentBase64],
            isBasePath: false,
            isCompleted: false,
        }
    );
    return makeApiRequest(serverConfig, '/torrents/add-files', body);
}

export async function testConnection(serverConfig) {
    return authenticate(serverConfig);
}
