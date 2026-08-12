import { debug } from '../debug';
import {
    applyHttpAuthHeaders,
    classifyClientContactFailure,
    shouldSendRuTorrentBasicAuthUpfront,
    hasRuTorrentBasicAuthCredentials,
} from '../js/httpAuthHeaders.js';
import { interpretRuTorrentAddResponse } from '../js/rutorrentResponse.js';

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

function hasTorrentFileContent(torrentFileContentBase64) {
    return typeof torrentFileContentBase64 === 'string' && torrentFileContentBase64.length > 0;
}

async function hasHostPermission(url) {
    try {
        if (typeof chrome === 'undefined' || !chrome.permissions?.contains) {
            return true;
        }
        const origin = `${new URL(url).origin}/`;
        return await chrome.permissions.contains({ origins: [origin] });
    } catch {
        return false;
    }
}

/**
 * Prefer browser-session cookies (pre-0.4.54 behavior). Only send Authorization
 * upfront when "Use HTTP Basic Authentication" is enabled. On 401, retry once
 * with profile credentials so seedboxes still work.
 */
async function fetchRuTorrent(url, serverConfig, init = {}) {
    const baseHeaders = { ...(init.headers || {}) };
    const sendUpfront = shouldSendRuTorrentBasicAuthUpfront(serverConfig);
    if (sendUpfront) {
        applyHttpAuthHeaders(baseHeaders, serverConfig);
    }

    let response = await fetch(url, {
        ...init,
        headers: baseHeaders,
        credentials: 'include',
    });

    if (
        response.status === 401 &&
        !baseHeaders.Authorization &&
        hasRuTorrentBasicAuthCredentials(serverConfig)
    ) {
        debug.warn(
            'ruTorrent: session auth returned 401; retrying with profile Basic Auth credentials.'
        );
        const retryHeaders = { ...baseHeaders };
        applyHttpAuthHeaders(retryHeaders, {
            ...serverConfig,
            useBasicAuth: false,
        });
        response = await fetch(url, {
            ...init,
            headers: retryHeaders,
            credentials: 'include',
        });
    }

    return response;
}

function unauthorizedUserMessage() {
    return (
        'Failed to connect to ruTorrent: 401 Unauthorized. ' +
        'If you log into ruTorrent in the browser, leave “Use HTTP Basic Authentication” unchecked and rely on that session — ' +
        'or enable it and enter the correct HTTP Basic username/password (seedbox credentials).'
    );
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

    const useUrl =
        torrentUrl.startsWith("magnet:") ||
        serverConfig.rutorrentalwaysurl ||
        !hasTorrentFileContent(torrentFileContentBase64);

    if (useUrl) {
        if (
            !torrentUrl.startsWith("magnet:") &&
            !serverConfig.rutorrentalwaysurl &&
            !hasTorrentFileContent(torrentFileContentBase64)
        ) {
            debug.warn(
                "ruTorrent: No torrent file content available; falling back to URL add. Private trackers may fail if the client cannot authenticate to the site."
            );
        }
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = `url=${encodeURIComponent(torrentUrl)}`;
    } else {
        const formData = new FormData();
        const blob = new Blob([Buffer.from(torrentFileContentBase64, 'base64')], { type: 'application/x-bittorrent' });
        formData.append("torrent_file", blob, "file.torrent");
        body = formData;
    }

    try {
        const response = await fetchRuTorrent(url, serverConfig, {
            method: 'POST',
            headers,
            body,
        });

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: { userMessage: unauthorizedUserMessage() } };
            }
            return { success: false, error: { userMessage: `ruTorrent API request failed: ${response.status} ${response.statusText}` } };
        }

        const text = await response.text();
        const interpreted = interpretRuTorrentAddResponse(text, response.url);
        if (interpreted.success) {
            return { success: true, data: { message: interpreted.userMessage } };
        }
        return {
            success: false,
            error: {
                userMessage: interpreted.userMessage,
                technicalDetail: interpreted.technicalDetail,
                errorCode: interpreted.errorCode,
            },
        };
    } catch (error) {
        debug.error('Error adding torrent to ruTorrent:', error);
        const permitted = await hasHostPermission(serverConfig.url);
        const classified = classifyClientContactFailure('ruTorrent', error, {
            hasHostPermission: permitted,
        });
        return { success: false, error: { userMessage: classified.userMessage, technicalDetail: error.message, errorCode: classified.likelyCause } };
    }
}

export async function testConnection(serverConfig) {
    const url = getruTorrentUrl(serverConfig) + "/php/addtorrent.php";
    try {
        const response = await fetchRuTorrent(url, serverConfig, { method: 'GET' });
        if (response.ok) {
            return { success: true, data: { message: "Successfully connected to ruTorrent." } };
        } else if (response.status === 401) {
            return { success: false, error: { userMessage: unauthorizedUserMessage() } };
        } else {
            return { success: false, error: { userMessage: `Failed to connect to ruTorrent: ${response.status} ${response.statusText}` } };
        }
    } catch (error) {
        debug.error('Error testing connection to ruTorrent:', error);
        const permitted = await hasHostPermission(serverConfig.url);
        const classified = classifyClientContactFailure('ruTorrent', error, {
            hasHostPermission: permitted,
        });
        return { success: false, error: { userMessage: classified.userMessage, technicalDetail: error.message, errorCode: classified.likelyCause } };
    }
}
