import { debug } from '../debug';

// BiglyBT API Handler (using Transmission RPC)

let sessionId = null;

async function makeRpcRequest(serverConfig, method, args = {}) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/transmission/rpc`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`
    };

    if (sessionId) {
        headers['X-Transmission-Session-Id'] = sessionId;
    }

    const body = {
        method: method,
        arguments: args
    };

    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.status === 409) {
            sessionId = response.headers.get('X-Transmission-Session-Id');
            headers['X-Transmission-Session-Id'] = sessionId;
            response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
        }

        if (!response.ok) {
            return { success: false, error: { userMessage: `BiglyBT API request failed: ${response.status} ${response.statusText}` } };
        }

        const json = await response.json();
        if (json.result !== 'success') {
            return { success: false, error: { userMessage: `BiglyBT RPC Error: ${json.result}` } };
        }

        return { success: true, data: json.arguments };

    } catch (error) {
        debug.error('Error communicating with BiglyBT:', error);
        return { success: false, error: { userMessage: `Could not contact BiglyBT: ${error.message}` } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        torrentFileContentBase64,
        paused,
        labels
    } = torrentOptions;

    const args = {
        paused: paused
    };

    if (labels && labels.length > 0) {
        args.labels = labels;
    }

    if (torrentUrl.startsWith("magnet:")) {
        args.filename = torrentUrl;
    } else {
        args.metainfo = torrentFileContentBase64;
    }

    return makeRpcRequest(serverConfig, 'torrent-add', args);
}

export async function testConnection(serverConfig) {
    const result = await makeRpcRequest(serverConfig, 'session-get', {
        fields: ["version", "rpc-version", "download-dir-free-space"]
    });

    if (result.success && result.data) {
        const { version, "rpc-version": rpcVersion, "download-dir-free-space": freeSpace } = result.data;
        return {
            success: true,
            data: {
                message: 'Successfully connected to BiglyBT.',
                version: version,
                rpcVersion: rpcVersion,
                freeSpace: freeSpace
            }
        };
    }
    return result; // Return original result if it failed
}
