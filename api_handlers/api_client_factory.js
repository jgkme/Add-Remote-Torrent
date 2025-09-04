// API Client Factory
// This module imports all client-specific handlers and provides a factory function
// to get the correct handler based on the clientType.

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

const clientHandlers = {
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
    porla
};

export function getClientApi(clientType) {
    const handler = clientHandlers[clientType];
    if (!handler) {
        debug.error(`No API handler found for client type: ${clientType}`);
        // Return a dummy handler or throw an error to indicate an unsupported client
        return {
            addTorrent: async () => ({ success: false, error: `Unsupported client type: ${clientType}` }),
            testConnection: async () => ({ success: false, error: `Unsupported client type: ${clientType}` }),
        };
    }
    // Ensure the handler exports the expected functions
    if (typeof handler.addTorrent !== 'function' || typeof handler.testConnection !== 'function') {
        debug.error(`API handler for ${clientType} does not implement required functions.`);
        return {
            addTorrent: async () => ({ success: false, error: `Handler for ${clientType} is misconfigured (missing addTorrent)` }),
            testConnection: async () => ({ success: false, error: `Handler for ${clientType} is misconfigured (missing testConnection)` }),
        };
    }
    return handler;
}
