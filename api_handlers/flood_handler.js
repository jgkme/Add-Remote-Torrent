import { debug } from '../debug';

// Flood API Handler

async function authenticate(serverConfig) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/auth/authenticate`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
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

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        paused,
        torrentFileContentBase64,
        downloadDir,
    } = torrentOptions;

    const authResult = await authenticate(serverConfig);
    if (!authResult.success) {
        return authResult;
    }

    if (torrentUrl.startsWith("magnet:")) {
        const url = `${serverConfig.url.replace(/\/$/, '')}/api/client/add`;
        const body = {
            urls: [torrentUrl],
            start: !paused,
            destination: downloadDir || undefined,
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                return { success: false, error: { userMessage: `Flood API request failed: ${response.status} ${response.statusText}` } };
            }
            return { success: true, data: { message: "Torrent added successfully." } };
        } catch (error) {
            debug.error('Error adding magnet link to Flood:', error);
            return { success: false, error: { userMessage: `Could not contact Flood: ${error.message}` } };
        }
    } else {
        const url = `${serverConfig.url.replace(/\/$/, '')}/api/client/add-files`;
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        const formData = new FormData();
        formData.append("torrents", blob, "file.torrent");
        if (downloadDir) {
            formData.append("destination", downloadDir);
        }
        formData.append("start", !paused);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                return { success: false, error: { userMessage: `Flood API request failed: ${response.status} ${response.statusText}` } };
            }
            return { success: true, data: { message: "Torrent added successfully." } };
        } catch (error) {
            debug.error('Error adding torrent file to Flood:', error);
            return { success: false, error: { userMessage: `Could not contact Flood: ${error.message}` } };
        }
    }
}

export async function testConnection(serverConfig) {
    return authenticate(serverConfig);
}
