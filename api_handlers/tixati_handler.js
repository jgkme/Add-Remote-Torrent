import { debug } from '../debug';

// Tixati API Handler

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        paused,
        torrentFileContentBase64,
    } = torrentOptions;

    const url = `http${serverConfig.hostsecure ? 's' : ''}://${serverConfig.host}:${serverConfig.port}/transfers/action`;
    const formData = new FormData();

    if (paused) {
        formData.append("noautostart", "1");
    } else {
        formData.append("noautostart", "0");
    }

    if (torrentUrl.startsWith("magnet:")) {
        formData.append("addlinktext", torrentUrl);
        formData.append("addlink", "Add");
    } else {
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        formData.append("metafile", blob, "file.torrent");
        formData.append("addmetafile", "Add");
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `Tixati API request failed: ${response.status} ${response.statusText}` } };
        }

        return { success: true, data: { message: "Torrent added successfully." } };
    } catch (error) {
        debug.error('Error adding torrent to Tixati:', error);
        return { success: false, error: { userMessage: `Could not contact Tixati: ${error.message}` } };
    }
}

export async function testConnection(serverConfig) {
    const url = `http${serverConfig.hostsecure ? 's' : ''}://${serverConfig.host}:${serverConfig.port}/transfers`;
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
            return { success: true, data: { message: "Successfully connected to Tixati." } };
        } else {
            return { success: false, error: { userMessage: `Failed to connect to Tixati: ${response.status} ${response.statusText}` } };
        }
    } catch (error) {
        debug.error('Error testing connection to Tixati:', error);
        return { success: false, error: { userMessage: `Could not contact Tixati: ${error.message}` } };
    }
}
