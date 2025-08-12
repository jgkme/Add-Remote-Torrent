import { debug } from '../debug';

// BiglyBT API Handler

async function makeRpcRequest(serverConfig, body) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/transmission/rpc`;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (serverConfig.sessionId) {
        headers['X-Transmission-Session-Id'] = serverConfig.sessionId;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });

        if (response.status === 409) {
            const newSessionId = response.headers.get('X-Transmission-Session-Id');
            if (newSessionId) {
                serverConfig.sessionId = newSessionId;
                return makeRpcRequest(serverConfig, body);
            }
        }

        if (!response.ok) {
            return { success: false, error: { userMessage: `BiglyBT API request failed: ${response.status} ${response.statusText}` } };
        }

        return { success: true, data: await response.json() };
    } catch (error) {
        debug.error('Error communicating with BiglyBT:', error);
        return { success: false, error: { userMessage: `Could not contact BiglyBT: ${error.message}` } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        torrentFileContentBase64,
        isPaused,
        tags,
    } = torrentOptions;

    const body = {
        method: 'torrent-add',
        arguments: {
            paused: isPaused,
            "vuze_tags": tags,
        },
    };

    if (torrentUrl.startsWith("magnet:")) {
        body.arguments.filename = torrentUrl;
    } else {
        body.arguments.metainfo = torrentFileContentBase64;
    }

    return makeRpcRequest(serverConfig, body);
}

export async function testConnection(serverConfig) {
    const body = {
        method: 'session-get',
    };
    return makeRpcRequest(serverConfig, body);
}
