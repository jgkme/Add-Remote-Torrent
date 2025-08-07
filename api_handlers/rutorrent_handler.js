import { debug } from '../debug';

// ruTorrent API Handler

function getruTorrentUrl(serverConfig) {
    let url = serverConfig.url.replace(/\/$/, '');
    if (serverConfig.ruTorrentrelativepath) {
        url += `/${serverConfig.ruTorrentrelativepath.replace(/^\/|\/$/g, '')}`;
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

    const url = getruTorrentUrl(serverConfig) + "/php/addtorrent.php";
    const formData = new FormData();

    if (downloadDir) {
        formData.append("dir_edit", downloadDir);
    }
    if (labels && labels.length > 0) {
        formData.append("label", labels[0]);
    }
    if (paused) {
        formData.append("torrents_start_stopped", "1");
    }
    if (serverConfig.rutorrentdontaddnamepath) {
        formData.append("not_add_path", "1");
    }

    if (torrentUrl.startsWith("magnet:") || serverConfig.rutorrentalwaysurl) {
        formData.append("url", torrentUrl);
    } else {
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        formData.append("torrent_file", blob, "file.torrent");
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            return { success: false, error: { userMessage: `ruTorrent API request failed: ${response.status} ${response.statusText}` } };
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
