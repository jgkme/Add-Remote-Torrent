// Vuze (Azureus) API Handler
// Leverages Transmission-compatible RPC API via Vuze Web Remote plugin.

// Placeholder for X-Transmission-Session-Id (used by Vuze in this mode)
let vuzeSessionId = null;

async function fetchWithAuth(url, options, serverConfig) {
    // Implements common fetch logic with Basic Auth and X-Transmission-Session-Id handling
    const headers = {
        ...options.headers,
    };

    // Vuze Web Remote might not use Basic Auth if mimicking Transmission purely,
    // but it's included for robustness if some setups have it layered.
    if (serverConfig.username && serverConfig.password) {
        headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
    }

    if (vuzeSessionId) {
        headers['X-Transmission-Session-Id'] = vuzeSessionId;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 409) { // Handle session ID challenge
        vuzeSessionId = response.headers.get('X-Transmission-Session-Id');
        if (!vuzeSessionId) {
            // This case should be rare if server behaves like Transmission.
            // Returning a structured error directly from fetchWithAuth if this specific path is hit.
            // However, the main error handling will be in the calling functions (addTorrent, testConnection).
            // For now, let's make this specific return structured.
            return { 
                success: false, 
                error: {
                    userMessage: "Vuze (as Transmission) session ID challenge failed.",
                    technicalDetail: "API returned 409 but no X-Transmission-Session-Id header was found.",
                    errorCode: "SESSION_ID_MISSING_ON_409"
                }, 
                status: 409, // Keep status for context
                ok: false, 
                text: async () => response.text() // Keep original text method for callers if needed
            };
        }
        headers['X-Transmission-Session-Id'] = vuzeSessionId;
        return fetch(url, { ...options, headers }); // Retry with the new session ID
    }
    return response;
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, username, password, clientType, rpcPath (optional, defaults to /transmission/rpc) }
    // torrentOptions: { downloadDir, paused, labels (array) }

    // Vuze Web Remote plugin mimics Transmission's RPC path.
    const path = serverConfig.rpcPath || '/transmission/rpc'; 
    const rpcUrl = `${serverConfig.url.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
    
    const payload = {
        method: 'torrent-add',
        arguments: {
            filename: torrentUrl, // Magnet or .torrent URL
        },
    };

    if (torrentOptions.downloadDir) {
        payload.arguments['download-dir'] = torrentOptions.downloadDir;
    }
    if (torrentOptions.paused) {
        payload.arguments.paused = torrentOptions.paused;
    }
    // Assuming Vuze (in Transmission compatibility mode) supports 'labels' like Transmission.
    if (torrentOptions.labels && torrentOptions.labels.length > 0) {
        payload.arguments.labels = torrentOptions.labels;
    }

    try {
        const response = await fetchWithAuth(rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }, serverConfig);

        if (!response.ok) {
            const errorText = await response.text();
            let errorCode = "ADD_FAILED";
            // The 409 should be handled by fetchWithAuth, but if it somehow propagates or another auth error occurs:
            if (response.status === 401 || response.status === 403) errorCode = "AUTH_ERROR"; 
            console.error(`Vuze (as Transmission) API error: ${response.status} ${errorText}`);
            return { 
                success: false, 
                error: {
                    userMessage: "Failed to add torrent to Vuze (as Transmission).",
                    technicalDetail: `API Error: ${response.status} ${errorText}`,
                    errorCode: errorCode
                }
            };
        }

        const result = await response.json();

        if (result.result === 'success') {
            if (result.arguments && result.arguments['torrent-added']) {
                return { success: true, data: result.arguments['torrent-added'] };
            } else if (result.arguments && result.arguments['torrent-duplicate']) {
                return { success: true, duplicate: true, data: result.arguments['torrent-duplicate'] };
            }
            return { success: true, data: result.arguments || { message: "Torrent added successfully (no specific details returned)." } }; 
        } else {
            console.error('Vuze (as Transmission) RPC error:', result);
            return { 
                success: false, 
                error: {
                    userMessage: "Vuze (as Transmission) server reported an error.",
                    technicalDetail: `RPC response: ${result.result}`,
                    errorCode: "RPC_ERROR"
                }
            };
        }
    } catch (error) {
        console.error('Error adding torrent to Vuze (as Transmission):', error);
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the Vuze server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

export async function testConnection(serverConfig) {
    // Test connection by fetching session arguments, similar to Transmission.
    const path = serverConfig.rpcPath || '/transmission/rpc';
    const rpcUrl = `${serverConfig.url.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
    
    const payload = {
        method: 'session-get',
        arguments: {
            fields: ['version', 'rpc-version'], // Requesting fields common to Transmission
        },
    };

    try {
        const response = await fetchWithAuth(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }, serverConfig);

        if (!response.ok) {
            let errorCode = "CONNECTION_FAILED";
            if (response.status === 401 || response.status === 403) errorCode = "AUTH_ERROR";
            // The 409 for session ID should be handled by fetchWithAuth.
            return { 
                success: false, 
                error: {
                    userMessage: "Vuze (as Transmission) connection test failed.",
                    technicalDetail: `API Error: ${response.status} ${await response.text()}`,
                    errorCode: errorCode
                }
            };
        }
        const result = await response.json();
        if (result.result === 'success' && result.arguments) {
            return { success: true, data: result.arguments };
        }
        return { 
            success: false, 
            error: {
                userMessage: "Vuze (as Transmission) connection test reported an error.",
                technicalDetail: `RPC response: ${result.result}`,
                errorCode: "RPC_ERROR"
            }
        };
    } catch (error) {
        return { 
            success: false, 
            error: {
                userMessage: "Network error or Vuze server not reachable.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}
