import { debug } from '../debug';

// ruTorrent API Handler

function getruTorrentUrl(serverConfig) {
    let url = serverConfig.url.replace(/\/$/, '');
    // Only append relative path if the main URL doesn't already end with it,
    // to support users entering the full path in the URL field.
    if (serverConfig.ruTorrentrelativepath) {
        const relative = serverConfig.ruTorrentrelativepath.replace(/^\/|\/$/g, '');
        if (relative && !url.endsWith(`/${relative}`)) {
            url += `/${relative}`;
        }
    }
    return url;
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    const {
        paused,
        torrentFileContentBase64,
        downloadDir,
        labels,
    } = torrentOptions;

    let url = getruTorrentUrl(serverConfig) + "/php/addtorrent.php?";
    if (downloadDir) {
        url += `dir_edit=${encodeURIComponent(downloadDir)}&`;
    }
    if (labels && labels.length > 0) {
        url += `label=${encodeURIComponent(labels.join(','))}&`;
    }
    if (paused) {
        url += "torrents_start_stopped=1&";
    }
    if (serverConfig.rutorrentdontaddnamepath) {
        url += "not_add_path=1&";
    }

    let body;
    const headers = {};
    if (torrentUrl.startsWith("magnet:") || serverConfig.rutorrentalwaysurl) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = `url=${encodeURIComponent(torrentUrl)}`;
    } else {
        const formData = new FormData();
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        formData.append("torrent_file", blob, "file.torrent");
        body = formData;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
            credentials: 'include'
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `ruTorrent API request failed: ${response.status} ${response.statusText}` } };
        }

        if (response.url.includes("result[]=Success")) {
            return { success: true, data: { message: "Torrent added successfully." } };
        }
        const text = await response.text();
        if (text.includes("addTorrentSuccess")) {
            return { success: true, data: { message: "Torrent added successfully." } };
        } else {
            return { success: false, error: { userMessage: `Server didn't accept data: ${text}` } };
        }
    } catch (error) {
        debug.error('Error adding torrent to ruTorrent:', error);
        return { success: false, error: { userMessage: `Could not contact ruTorrent: ${error.message}` } };
    }
}

export async function testConnection(serverConfig) {
    const url = getruTorrentUrl(serverConfig) + "/php/addtorrent.php";
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
            return { success: true, data: { message: "Successfully connected to ruTorrent." } };
        } else {
            return { success: false, error: { userMessage: `Failed to connect to ruTorrent: ${response.status} ${response.statusText}` } };
        }
    } catch (error) {
        debug.error('Error testing connection to ruTorrent:', error);
        return { success: false, error: { userMessage: `Could not contact ruTorrent: ${error.message}` } };
    }
}
