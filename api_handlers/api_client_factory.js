// API Client Factory — lazy-loads client handlers to keep the service worker bundle small.

import { debug } from '../debug';

const HANDLER_LOADERS = {
    qbittorrent: () => import('./qbittorrent_handler.js'),
    transmission: () => import('./transmission_handler.js'),
    deluge: () => import('./deluge_handler.js'),
    utorrent: () => import('./utorrent_handler.js'),
    utorrent_old: () => import('./utorrent_old_handler.js'),
    rtorrent: () => import('./rtorrent_handler.js'),
    rutorrent: () => import('./rutorrent_handler.js'),
    synology_download_station: () => import('./synology_download_station_handler.js'),
    qnap_download_station: () => import('./qnap_download_station_handler.js'),
    kodi_elementum: () => import('./kodi_elementum_handler.js'),
    bittorrent: () => import('./bittorrent_handler.js'),
    buffalo_torrent: () => import('./buffalo_torrent_handler.js'),
    vuze: () => import('./vuze_handler.js'),
    ttorrent: () => import('./ttorrent_handler.js'),
    hadouken: () => import('./hadouken_handler.js'),
    tixati: () => import('./tixati_handler.js'),
    torrentflux: () => import('./torrentflux_handler.js'),
    flood: () => import('./flood_handler.js'),
    tribler: () => import('./tribler_handler.js'),
    biglybt: () => import('./biglybt_handler.js'),
    porla: () => import('./porla_handler.js'),
    vuze_xmwebui: () => import('./vuze_xmwebui_handler.js'),
};

const handlerCache = new Map();
const handlerLoadPromises = new Map();

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

    const loader = HANDLER_LOADERS[clientType];
    if (!loader) {
        debug.error(`No API handler found for client type: ${clientType}`);
        return misconfiguredHandler(clientType, `Unsupported client type: ${clientType}`);
    }

    if (!handlerLoadPromises.has(clientType)) {
        handlerLoadPromises.set(
            clientType,
            loader()
                .then((module) => {
                    const handler = module.default || module;
                    const validated = validateHandler(clientType, handler);
                    handlerCache.set(clientType, validated);
                    return validated;
                })
                .catch((error) => {
                    handlerLoadPromises.delete(clientType);
                    debug.error(`Failed to load API handler for ${clientType}:`, error);
                    const fallback = misconfiguredHandler(
                        clientType,
                        `Failed to load handler for ${clientType}: ${error.message}`
                    );
                    handlerCache.set(clientType, fallback);
                    return fallback;
                })
        );
    }

    return handlerLoadPromises.get(clientType);
}
