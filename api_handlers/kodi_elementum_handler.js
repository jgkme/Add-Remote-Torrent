// Kodi Elementum API Handler

// Kodi's JSON-RPC doesn't typically use session IDs in the same way as web UIs.
// Auth is usually Basic for remote, or none if local.

async function makeKodiJsonRpcRequest(serverConfig, methodName, params = {}) {
    // serverConfig.url should be the Kodi JSON-RPC endpoint 
    // (e.g., http://kodi_ip:port/jsonrpc)
    
    const payload = {
        jsonrpc: "2.0",
        method: methodName,
        params: params,
        id: "torrentAdder" // Or a unique ID
    };

    const headers = {
        'Content-Type': 'application/json',
    };
    if (serverConfig.username && serverConfig.password) {
        headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
    }

    try {
        const response = await fetch(serverConfig.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorCode = "API_ERROR";
            if (response.status === 401) errorCode = "AUTH_FAILED";
            return { 
                success: false, 
                error: {
                    userMessage: "Kodi API request failed.",
                    technicalDetail: `API Error: ${response.status} ${response.statusText}`,
                    errorCode: errorCode
                }
            };
        }

        const data = await response.json();
        if (data.error) {
            console.error('Kodi JSON-RPC error:', data.error);
            return { 
                success: false, 
                error: {
                    userMessage: "Kodi server reported an error.",
                    technicalDetail: `Kodi JSON-RPC Error: ${data.error.message} (Code: ${data.error.code})`,
                    errorCode: `KODI_RPC_ERR_${data.error.code || 'UNKNOWN'}`
                }
            };
        }
        return { success: true, data: data.result };

    } catch (error) {
        console.error('Error in Kodi JSON-RPC request:', error);
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the Kodi server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, username, password, clientType }
    // torrentOptions: { downloadDir (N/A), paused (N/A), labels (N/A) }

    // Elementum uses Addons.ExecuteAddon with specific params for playing/adding.
    // The primary action is to "play" the magnet link.
    if (!torrentUrl.startsWith("magnet:")) {
        return { 
            success: false, 
            error: {
                userMessage: "Kodi Elementum handler currently only supports magnet links.",
                technicalDetail: "Non-magnet URI provided.",
                errorCode: "INVALID_INPUT_NON_MAGNET"
            }
        };
    }

    const params = {
        addonid: "plugin.video.elementum",
        // The inner params should be a string as per the new documentation
        params: `action=play&uri=${encodeURIComponent(torrentUrl)}`
    };
    
    // Download directory, paused state, labels are not typically applicable here
    // as Elementum is geared towards streaming.
    if (torrentOptions.downloadDir) console.warn("Kodi Elementum: downloadDir option is not applicable.");
    if (torrentOptions.paused) console.warn("Kodi Elementum: paused option is not applicable.");
    if (torrentOptions.labels && torrentOptions.labels.length > 0) console.warn("Kodi Elementum: labels/tags/category are not applicable.");

    return makeKodiJsonRpcRequest(serverConfig, 'Addons.ExecuteAddon', params);
}

export async function testConnection(serverConfig) {
    // Test by calling a simple, non-intrusive Kodi JSON-RPC method.
    // JSONRPC.Ping is a good candidate.
    const result = await makeKodiJsonRpcRequest(serverConfig, 'JSONRPC.Ping', {});
    if (result.success && result.data === "pong") {
        return { success: true, data: { message: "Kodi connection successful (ping successful)." } };
    }
    // result.error should be the structured error from makeKodiJsonRpcRequest
    return { 
        success: false, 
        error: result.error || {
            userMessage: "Kodi ping failed or returned an unexpected response.",
            errorCode: "TEST_CONN_PING_FAILED"
        }
    };
}
