import { debug } from '../debug';

// Hadouken API Handler

async function makeRpcRequest(serverConfig, method, params) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/api`;
    const message = {
        id: 1,
        jsonrpc: "2.0",
        method: method,
        params: params,
    };

    const headers = {
        'Content-Type': 'application/json',
    };
    if (serverConfig.username && serverConfig.password) {
        headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Hadouken API request failed: ${response.status} ${response.statusText}` } };
        }

        const json = await response.json();
        if (json.error) {
            return { success: false, error: { userMessage: `Hadouken API error: ${json.error.message}` } };
        }

        return { success: true, data: json.result };
    } catch (error) {
        debug.error('Error communicating with Hadouken:', error);
        return { success: false, error: { userMessage: `Could not contact Hadouken: ${error.message}` } };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        torrentFileContentBase64,
        isPaused,
        labels,
        tags,
        sequential,
    } = torrentOptions;

    const rpcOptions = {
        paused: isPaused,
        sequentialDownload: sequential,
        label: labels && labels.length > 0 ? labels[0] : undefined,
        tags: tags,
    };

    // Clean up undefined values
    Object.keys(rpcOptions).forEach(key => rpcOptions[key] === undefined && delete rpcOptions[key]);

    let params;
    if (torrentUrl.startsWith("magnet:")) {
        params = ["url", torrentUrl, rpcOptions];
    } else {
        params = ["file", torrentFileContentBase64, rpcOptions];
    }

    return makeRpcRequest(serverConfig, 'webui.addTorrent', params);
}

export async function testConnection(serverConfig) {
    const result = await makeRpcRequest(serverConfig, 'core.getSystemInfo', []);
    if (result.success && result.data && result.data.versions) {
        return { 
            success: true, 
            data: { 
                version: result.data.versions.hadouken,
                message: "Successfully connected to Hadouken."
            } 
        };
    }
    return {
        success: false,
        error: result.error || {
            userMessage: "Failed to get system info from Hadouken.",
            errorCode: "TEST_CONN_FAILED"
        }
    };
}
