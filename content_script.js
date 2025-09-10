// Content script for Add Remote Torrent
import { debug } from './debug';
import { debounce } from './utils';
import { LinkMonitor } from './LinkMonitor.js';

// A safe wrapper for chrome.runtime.sendMessage that checks for a valid context first.
function safeSendMessage(message, callback) {
    if (chrome.runtime?.id) {
        if (callback) {
            chrome.runtime.sendMessage(message, callback);
        } else {
            chrome.runtime.sendMessage(message);
        }
    } else {
        debug.log("Extension context invalidated. Message not sent:", message);
    }
}

let art_modal_open_func, art_modal_close_func;

// Modal initialization function
const art_initModalLogic = () => {
    let modalWrapper = null;
    let modalWindow = null;
    let styleLink = null;
    debug.log('[ART ContentScript] art_initModalLogic: Initializing modal functions.');

    const injectCss = () => {
        if (document.getElementById('art-tailwind-styles')) return;
        styleLink = document.createElement('link');
        styleLink.id = 'art-tailwind-styles';
        styleLink.rel = 'stylesheet';
        styleLink.type = 'text/css';
        styleLink.href = chrome.runtime.getURL('css/tailwind.css');
        document.head.appendChild(styleLink);
    };

    const removeCss = () => {
        const existingLink = document.getElementById('art-tailwind-styles');
        if (existingLink) {
            existingLink.remove();
        }
    };

    const openModal = () => {
        debug.log('[ART ContentScript] openModal: Attempting to open modal.');
        injectCss();
        modalWrapper = document.getElementById('art_modal_wrapper');
        modalWindow = document.getElementById('art_modal_window');

        if (modalWrapper && modalWindow) {
            modalWrapper.style.display = 'flex';
        } else {
            debug.error('ART Modal: Wrapper or window not found after HTML injection.');
        }
    };

    const closeModal = () => {
        modalWrapper = document.getElementById('art_modal_wrapper');
        if (modalWrapper) {
            modalWrapper.remove();
        }
        removeCss();
        document.removeEventListener('click', clickOutsideHandler);
        document.removeEventListener('keydown', keydownHandler);
    };

    const clickOutsideHandler = (event) => {
        modalWrapper = document.getElementById('art_modal_wrapper');
        if (modalWrapper && event.target === modalWrapper) {
            closeModal();
        }
    };

    const keydownHandler = (event) => {
        if (event.key === 'Escape' || event.keyCode === 27) {
            closeModal();
        }
    };

    document.addEventListener('click', clickOutsideHandler, false);
    document.addEventListener('keydown', keydownHandler, false);

    return [openModal, closeModal];
}

const getOptions = async () => new Promise((resolve, reject) => {
    safeSendMessage({ action: 'getStorageData' }, response => {
        if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response) {
            return reject(new Error('No response from getStorageData or response is undefined.'));
        }
        debug.setEnabled(response?.contentDebugEnabled);
        const patterns = (response.linkCatchingPatterns || []).map(p => p.pattern);
        const urlPatterns = [...patterns, '^magnet:'];
        response.urlMatchers = urlPatterns.map(p => {
            try {
                return new RegExp(p, 'i');
            } catch (e) {
                debug.error(`[ART ContentScript] Invalid regex pattern skipped: "${p}"`, e);
                return null;
            }
        }).filter(Boolean);
        resolve(response);
    });
});

const isTorrentUrl = (url, options = {}) => {
    if (url && Array.isArray(options.urlMatchers)) {
        return options.urlMatchers.some(matcher => {
            try {
                return url.match(matcher);
            } catch (e) {
                debug.log('Regex error matching url:', url, 'with pattern:', matcher, e);
            }
        });
    }
    return false;
}

const checkLinkElement = (el, options, logAction) => {
    if (el._art_handler_added) {
        el._art_is_torrent = false;
    }
    const url = el.href || (el.form?.action?.match && el.form.action);
    if (isTorrentUrl(url, options)) {
        debug.log(`[ART ContentScript] Found torrent link${logAction ? ` (${logAction})` : ''}:`, url);
        el._art_is_torrent = true;
        addClickHandler(el, options);
        return true;
    }
}

const registerLinks = options => {
    const elements = Array.from(document.querySelectorAll('a, input, button'));
    let torrentLinksFound = 0;
    elements.forEach(el => {
        if (checkLinkElement(el, options, 'registerLinks crawler')) {
            torrentLinksFound++;
        }
    });
    debug.log('[ART ContentScript] Found links:', torrentLinksFound);

    if (torrentLinksFound > 0) {
        [art_modal_open_func, art_modal_close_func] = art_initModalLogic();
        if (options.linksfoundindicator === true) {
            safeSendMessage({ action: 'updateBadge', count: torrentLinksFound });
        }
    }
}

const addClickHandler = (el = {}, options) => {
    if (el.addEventListener && !el._art_handler_added) {
        el._art_handler_added = true;
        el.addEventListener('click', (e) => {
            const url = el.href || el.form?.action;
            if (el._art_is_torrent && url && !(e.ctrlKey || e.shiftKey || e.altKey)) {
                e.preventDefault();
                debug.log('[ART ContentScript] Torrent link clicked:', url);
                const servers = options?.servers ? JSON.parse(options.servers) : [];
                if (servers.length === 0) {
                    debug.warn('No servers configured.');
                    alert('No torrent servers configured. Please configure one in extension options.');
                    return;
                }
                const pageUrl = window.location.href;
                safeSendMessage({
                    action: 'addTorrent',
                    url: url,
                    pageUrl: pageUrl
                });
            } else if (!el._art_is_torrent) {
                debug.log('[ART ContentScript] Link clicked, but its associated url is no longer a torrent:', url);
            }
        });
    }
}

const updateBadge = () => {
    const torrentLinksOnPage = Array.from(document.querySelectorAll('a, input, button'))
        .filter(el => el._art_is_torrent)
        .length;
    debug.log('[ART ContentScript] updateBadge(): updateBadge message with count:', torrentLinksOnPage);
    safeSendMessage({ action: 'updateBadge', count: torrentLinksOnPage });
};
const updateBadgeDebounced = debounce(updateBadge, 50);

const initLinkMonitor = async (options) => {
    let linkMonitor;
    try {
        if (!options || options.catchfrompage !== true) {
            return;
        }
        linkMonitor = new LinkMonitor((el, logAction) => {
            checkLinkElement(el, options, `LinkMonitor: ${logAction}`);
            if (options.linksfoundindicator === true) {
                updateBadgeDebounced();
            }
        });
        setTimeout(() => {
            debug.log('Registering links with delay:', options.registerDelay);
            registerLinks(options);
        }, options.registerDelay || 0);
    } catch (error) {
        linkMonitor && linkMonitor.stop();
        debug.error(error);
    }
};

window.addEventListener('pageshow', () => {
    debug.log('[ART ContentScript] pageshow event detected, (re)initializing link monitor');
    getOptions().then(initLinkMonitor).catch(error => {
        if (error.message.includes("Extension context invalidated") || error.message.includes("Receiving end does not exist")) {
            debug.log("[ART ContentScript] Extension has been updated or reloaded. Content script will be re-injected on next page load. This is normal.");
        } else {
            debug.error("[ART ContentScript] Failed to initialize:", error);
        }
    });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'addTorrent') {
        sendResponse({});
        return true;
    }
});
