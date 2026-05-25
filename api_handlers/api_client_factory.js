// API Client Factory — all handlers are bundled into the MV3 service worker (no lazy chunks).

import { debug } from '../debug';
import * as qbittorrent from './qbittorrent_handler.js';
import * as transmission from './transmission_handler.js';
import * as deluge from './deluge_handler.js';
import * as utorrent from './utorrent_handler.js';
import * as utorrent_old from './utorrent_old_handler.js';
import * as rtorrent from './rtorrent_handler.js';
import * as rutorrent from './rutorrent_handler.js';
import * as synology_download_station from './synology_download_station_handler.js';
import * as qnap_download_station from './qnap_download_station_handler.js';
import * as kodi_elementum from './kodi_elementum_handler.js';
import * as bittorrent from './bittorrent_handler.js';
import * as buffalo_torrent from './buffalo_torrent_handler.js';
import * as vuze from './vuze_handler.js';
import * as ttorrent from './ttorrent_handler.js';
import * as hadouken from './hadouken_handler.js';
import * as tixati from './tixati_handler.js';
import * as torrentflux from './torrentflux_handler.js';
import * as flood from './flood_handler.js';
import * as tribler from './tribler_handler.js';
import * as biglybt from './biglybt_handler.js';
import * as porla from './porla_handler.js';
import * as vuze_xmwebui from './vuze_xmwebui_handler.js';

const HANDLERS = {
    qbittorrent,
    transmission,
    deluge,
    utorrent,
    utorrent_old,
    rtorrent,
    rutorrent,
    synology_download_station,
    qnap_download_station,
    kodi_elementum,
    bittorrent,
    buffalo_torrent,
    vuze,
    ttorrent,
    hadouken,
    tixati,
    torrentflux,
    flood,
    tribler,
    biglybt,
    porla,
    vuze_xmwebui,
};

const handlerCache = new Map();

function misconfiguredHandler(clientType, reason) {
    return {
        addTorrent: async () => ({ success: false, error: reason }),
        testConnection: async () => ({ success: false, error: reason }),
    };
}

function validateHandler(clientType, handler) {
    if (typeof handler.addTorrent !== 'function' || typeof handler.testConnection !== 'function') {
        debug.error(`API handler for ${clientType} does not implement required functions.`);
        return misconfiguredHandler(
            clientType,
            `Handler for ${clientType} is misconfigured (missing addTorrent/testConnection)`
        );
    }
    return handler;
}

/**
 * @param {string} clientType
 * @returns {Promise<object>}
 */
export async function getClientApi(clientType) {
    if (!clientType) {
        return misconfiguredHandler('unknown', 'No client type specified');
    }

    if (handlerCache.has(clientType)) {
        return handlerCache.get(clientType);
    }

    const handler = HANDLERS[clientType];
    if (!handler) {
        debug.error(`No API handler found for client type: ${clientType}`);
        return misconfiguredHandler(clientType, `Unsupported client type: ${clientType}`);
    }

    const validated = validateHandler(clientType, handler);
    handlerCache.set(clientType, validated);
    return validated;
}
