import { debug } from '../debug';

// Vuze HTML WebUI API Handler

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
                return { success: false, error: { userMessage: `Vuze API request failed: ${response.status} ${response.statusText}` } };
            }
            const text = await response.text();
            if (text.includes("loaded successfully.")) {
                return { success: true, data: { message: "Torrent added successfully." } };
            } else {
                return { success: false, error: { userMessage: `Server didn't accept data: ${text}` } };
            }
        } catch (error) {
            debug.error('Error adding magnet link to Vuze:', error);
            return { success: false, error: { userMessage: `Could not contact Vuze: ${error.message}` } };
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
                return { success: false, error: { userMessage: `Vuze API request failed: ${response.status} ${response.statusText}` } };
            }

            const text = await response.text();
            if (text.includes("loaded successfully.")) {
                return { success: true, data: { message: "Torrent added successfully." } };
            } else {
                return { success: false, error: { userMessage: `Server didn't accept data: ${text}` } };
            }
        } catch (error) {
            debug.error('Error adding torrent file to Vuze:', error);
            return { success: false, error: { userMessage: `Could not contact Vuze: ${error.message}` } };
        }
    }
}

export async function testConnection(serverConfig) {
    const url = `http://${serverConfig.host}:${serverConfig.port}/index.tmpl`;
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
            return { success: true, data: { message: "Successfully connected to Vuze." } };
        } else {
            return { success: false, error: { userMessage: `Failed to connect to Vuze: ${response.status} ${response.statusText}` } };
        }
    } catch (error) {
        debug.error('Error testing connection to Vuze:', error);
        return { success: false, error: { userMessage: `Could not contact Vuze: ${error.message}` } };
    }
}
