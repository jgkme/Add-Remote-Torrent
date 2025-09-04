import { debug } from '../debug';

// Elementum API Handler

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/playuri`;
    const formData = new FormData();
    formData.append("uri", torrentUrl);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Elementum API request failed: ${response.status} ${response.statusText}` } };
        }

        return { success: true, data: { message: "Torrent added successfully to Elementum." } };
    } catch (error) {
        debug.error('Error adding torrent to Elementum:', error);
        return { success: false, error: { userMessage: `Could not contact Elementum: ${error.message}` } };
    }
}

export async function testConnection(serverConfig) {
    const url = `${serverConfig.url.replace(/\/$/, '')}/`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            return { success: true, data: { message: "Successfully connected to Elementum." } };
        } else {
            return { success: false, error: { userMessage: `Failed to connect to Elementum: ${response.status} ${response.statusText}` } };
        }
    } catch (error) {
        debug.error('Error testing connection to Elementum:', error);
        return { success: false, error: { userMessage: `Could not contact Elementum: ${error.message}` } };
    }
}
