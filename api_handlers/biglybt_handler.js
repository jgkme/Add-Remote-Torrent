import { debug } from '../debug';

// BiglyBT HTML WebUI API Handler

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        torrentFileContentBase64,
    } = torrentOptions;

    if (torrentUrl.startsWith("magnet:")) {
        const url = `http://${serverConfig.host}:${serverConfig.port}/index.tmpl?d=u&upurl=${encodeURIComponent(torrentUrl)}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
            });
            if (!response.ok) {
                return { success: false, error: { userMessage: `BiglyBT API request failed: ${response.status} ${response.statusText}` } };
            }
            const text = await response.text();
            if (text.includes("loaded successfully.")) {
                return { success: true, data: { message: "Torrent added successfully." } };
            } else {
                return { success: false, error: { userMessage: `Server didn't accept data: ${text}` } };
            }
        } catch (error) {
            debug.error('Error adding magnet link to BiglyBT:', error);
            return { success: false, error: { userMessage: `Could not contact BiglyBT: ${error.message}` } };
        }
    } else {
        const url = `http://${serverConfig.host}:${serverConfig.port}/index.tmpl?d=u&local=1`;
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        const formData = new FormData();
        formData.append("upfile_1", blob, "file.torrent");

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) {
                return { success: false, error: { userMessage: `BiglyBT API request failed: ${response.status} ${response.statusText}` } };
            }

            const text = await response.text();
            if (text.includes("loaded successfully.")) {
                return { success: true, data: { message: "Torrent added successfully." } };
            } else {
                return { success: false, error: { userMessage: `Server didn't accept data: ${text}` } };
            }
        } catch (error) {
            debug.error('Error adding torrent file to BiglyBT:', error);
            return { success: false, error: { userMessage: `Could not contact BiglyBT: ${error.message}` } };
        }
    }
}

export async function testConnection(serverConfig) {
    const url = `http://${serverConfig.host}:${serverConfig.port}/index.tmpl`;
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
            return { success: true, data: { message: "Successfully connected to BiglyBT." } };
        } else {
            return { success: false, error: { userMessage: `Failed to connect to BiglyBT: ${response.status} ${response.statusText}` } };
        }
    } catch (error) {
        debug.error('Error testing connection to BiglyBT:', error);
        return { success: false, error: { userMessage: `Could not contact BiglyBT: ${error.message}` } };
    }
}
