// tTorrent API Handler

// tTorrent API Handler

// tTorrent is primarily an Android client. Accessing its WebUI (if enabled and available)
// from a desktop browser extension is speculative and relies on unofficial/fork-specific implementations.
// The following is based on common patterns found in some WebUIs for mobile torrent apps.

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig.url should point to the tTorrent WebUI base address.
    // Authentication is often none or basic, not explicitly covered in the summary for /api/add.
    
    if (!torrentUrl.startsWith("magnet:")) {
        console.warn("tTorrent handler: Received non-magnet URI. tTorrent WebUI might only support magnet links via this method.");
        // Depending on strictness, could return an error here.
        // For now, will attempt to send it, but it might fail.
    }

    const apiUrl = `${serverConfig.url.replace(/\/$/, '')}/api/add`; // Assumed endpoint
    const formData = new FormData();
    formData.append('url', torrentUrl); // For magnet URI

    // Other options like downloadDir, paused, labels are highly speculative for tTorrent WebUI.
    if (torrentOptions.downloadDir) {
        console.warn("tTorrent: downloadDir parameter is unknown for this unofficial API.");
        // formData.append('download_dir', torrentOptions.downloadDir); // Example if known
    }
    if (torrentOptions.paused) {
        console.warn("tTorrent: paused parameter is unknown for this unofficial API.");
        // formData.append('paused', 'true'); // Example if known
    }

    try {
        const headers = {};
        if (serverConfig.username && serverConfig.password) {
            headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers, // Basic Auth if provided
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { 
                success: false, 
                error: {
                    userMessage: "tTorrent API request failed.",
                    technicalDetail: `API Error: ${response.status} ${errorText}`,
                    errorCode: "TTORRENT_API_ERROR" // Generic code due to speculative API
                }
            };
        }
        return { success: true, data: { message: "Torrent submitted to tTorrent (actual status unknown)." } };

    } catch (error) {
        console.error('Error adding torrent to tTorrent:', error);
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the tTorrent server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

export async function testConnection(serverConfig) {
    const testUrl = `${serverConfig.url.replace(/\/$/, '')}/`; 

    try {
        const headers = {};
        if (serverConfig.username && serverConfig.password) {
            headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
        }

        const response = await fetch(testUrl, { method: 'GET', headers: headers });
        if (response.ok) {
            // Changed 'message' to 'data.message' for consistency with other testConnection successes
            return { success: true, data: { message: "tTorrent server responded to base URL. API functionality is speculative." } };
        }
        return { 
            success: false, 
            error: {
                userMessage: "tTorrent server responded with an error to base URL check.",
                technicalDetail: `HTTP Status: ${response.status}`,
                errorCode: "TTORRENT_BASE_URL_ERROR"
            }
        };
    } catch (error) {
        return { 
            success: false, 
            error: {
                userMessage: "Failed to connect to tTorrent server.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}
