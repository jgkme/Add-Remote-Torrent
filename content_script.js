// Content script for Remote Torrent WebUI Adder
import { LinkMonitor } from './LinkMonitor';

let rtwa_modal_open_func, rtwa_modal_close_func;

// Modal initialization function
const rtwa_initModalLogic = () => {
    let modalWrapper = null;
    let modalWindow = null;
    let styleLink = null;
    console.log('[RTWA ContentScript] rtwa_initModalLogic: Initializing modal functions.');

    const injectCss = () => {
        if (document.getElementById('rtwa-tailwind-styles')) return;
        styleLink = document.createElement('link');
        styleLink.id = 'rtwa-tailwind-styles';
        styleLink.rel = 'stylesheet';
        styleLink.type = 'text/css';
        styleLink.href = chrome.runtime.getURL('css/tailwind.css');
        document.head.appendChild(styleLink);
    };

    const removeCss = () => {
        const existingLink = document.getElementById('rtwa-tailwind-styles');
        if (existingLink) {
            existingLink.remove();
        }
    };

    const openModal = () => {
        console.log('[RTWA ContentScript] openModal: Attempting to open modal.');
        injectCss();
        // The modal HTML is injected by rtwa_showLabelDirChooser
        modalWrapper = document.getElementById('rtwa_modal_wrapper');
        modalWindow = document.getElementById('rtwa_modal_window');

        if (modalWrapper && modalWindow) {
            console.log('[RTWA ContentScript] openModal: Modal elements found. Setting display to flex.');
            modalWrapper.style.display = 'flex';
            console.log('[RTWA ContentScript] openModal: Modal display set. Current display:', modalWrapper.style.display);
        } else {
            console.error('RTWA Modal: Wrapper or window not found after HTML injection.');
        }
    };

    const closeModal = () => {
        modalWrapper = document.getElementById('rtwa_modal_wrapper');
        if (modalWrapper) {
            modalWrapper.remove();
        }
        removeCss();
        document.removeEventListener('click', clickOutsideHandler);
        document.removeEventListener('keydown', keydownHandler);
    };

    // Event handler for clicking outside the modal
    const clickOutsideHandler = (event) => {
        modalWrapper = document.getElementById('rtwa_modal_wrapper');
        if (modalWrapper && event.target === modalWrapper) {
            closeModal();
        }
    };

    // Event handler for the Escape key
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
    chrome.runtime.sendMessage({ action: 'getStorageData' }, response => {
        if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
        } else if (!response) {
            reject(new Error('No response from getStorageData or response is undefined.'));
        } else {
            resolve(response);
        }
    });
});

const isTorrentUrl = (url, options = {}) => {
    if (url && Array.isArray(options.urlMatchers)) {
        return options.urlMatchers.some(matcher => {
            try {
                return url.match(matcher);
            } catch (e) {
                console.warn('Regex error matching url:', url, 'with pattern:', matcher, e);
            }
        });
    }
    return false;
}

const registerLinks = options => {
    let torrentLinksFound = 0;

    // Check all anchor elements and some specific input elements/forms (less common for torrents, but kept from original logic)
    const elements = [
        ...Array.from(document.getElementsByTagName('a')),
        ...Array.from(document.getElementsByTagName('button')),
        ...Array.from(document.getElementsByTagName('input'))
    ];

    elements.forEach(el => {
        if (el._rtwa_handler_added) {
            // el already has a click handler!
            // But its url could have changed, so reset "_rtwa_is_torrent" to false
            // ...and check it again
            el._rtwa_is_torrent = false;
        }
        const url = el.href || (el.form?.action?.match && el.form.action);
        if (isTorrentUrl(url, options)) {
            torrentLinksFound++;
            console.log('[RTWA ContentScript] Found torrent link:', url); // Added log
            el._rtwa_is_torrent = true;
            addClickHandler(el, options);
        }
    });
    console.log('[RTWA ContentScript] Found links:', torrentLinksFound); // Added log

    if (torrentLinksFound > 0) {
        [rtwa_modal_open_func, rtwa_modal_close_func] = rtwa_initModalLogic();

        if (options.linksfoundindicator === true) {
            chrome.runtime.sendMessage({ action: 'updateBadge', count: torrentLinksFound });
        }
    }
}

const addClickHandler = (el = {}, options) => {
    // Beware of adding a click handler for the same element again!
    // (elements may be re-used by browser framework optimizations in SPAs)
    if (el.addEventListener && !el._rtwa_handler_added) {
        // Set _rtwa_handler_added indicate that this el is hooked up
        el._rtwa_handler_added = true;

        el.addEventListener('click', (e) => {
            const url = el.href || el.form.action;
            if (el._rtwa_is_torrent && url && !(e.ctrlKey || e.shiftKey || e.altKey)) {
                // The element contains a verified torrent-link, has a url, and no modifier keys are pressed

                e.preventDefault();
                console.log('[RTWA ContentScript] Torrent link clicked:', url); // Log torrent link click

                // Assuming 'servers' is a JSON string in the response from getStorageData
                const servers = options?.servers ? JSON.parse(options.servers) : [];
                if (servers.length === 0) {
                    console.warn('No servers configured.');
                    // Optionally, notify user to configure servers
                    alert('No torrent servers configured. Please configure one in extension options.');
                    return;
                }

                // Determine active/target server - this logic might need to align with background.js's determineTargetServer
                // For now, using the first server or a specific server if passed explicitly (not available here yet)
                // The old code used servers[0] or a specific server if passed to showLabelDirChooser
                // This needs to be robust, perhaps by getting activeServerId from response.
                let activeServer = servers.find(s => s.id === options.activeServerId) || servers[0];

                // Check for client-specific "ask" flags.
                // These flags (e.g., "rutorrentdirlabelask") need to be defined in server objects.
                // And mapped from our generic clientType (e.g., "rtorrent", "qbittorrent")
                // For now, let's assume a generic 'askForLabelDirOnPage' flag.
                // NEW PREFLIGHT LOGIC:
                const pageUrl = window.location.href;
                chrome.runtime.sendMessage({
                    action: 'addTorrent',
                    url: url,
                    pageUrl: pageUrl
                });
            } else {
                if (!el._rtwa_is_torrent) {
                    console.log('[RTWA ContentScript] Link clicked, but its associated url is no longer a torrent:', url);
                }
            }
        });
    }
}

const initLinkMonitor = async (options) => {
    let linkMonitor;
    try {
        if (!options || options.catchfrompage !== true) {
            return;
        }

        // Create all linkMatcher RegExps statically (from "options.linkmatches") and add them to options
        const patterns = [
            ...(options.linkmatches && options.linkmatches.split?.('~') || []),
            '^magnet:'
        ];
        options.urlMatchers = patterns.map(p => new RegExp(p, 'gi'));

        // Start link monitor
        linkMonitor = new LinkMonitor((el, action) => {
            if (el?._rtwa_handler_added) {
                // el has changed, but already has a click handler!
                // Reset "_rtwa_is_torrent" to false before checking its href again
                el._rtwa_is_torrent = false;
            }
            const url = el?.href || (el?.form?.action?.match && el.form.action);
            if (isTorrentUrl(url, options)) {
                console.log(`LinkMonitor detected torrent url (${action ? action : '?'}):`, url);
                el._rtwa_is_torrent = true;
                addClickHandler(el, options);
            }
        });

        // Run initial link registration
        setTimeout(() => {
            // There should be no need for setting a registerDelay > 0,
            // because LinkMonitor catches any added/changed links in the DOM.
            // But it was in the original code...
            console.log('Registering links with delay:', options.registerDelay);
            registerLinks(options);
        }, options.registerDelay || 0);

    } catch (error) {
        linkMonitor && linkMonitor.stop();	// Stop linkMonitor on errors
        console.error(error);
    }
};

getOptions().then(initLinkMonitor);

// Register a listener for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'addTorrent') {
        // This is a placeholder for any future logic that might be needed
        // when the background script confirms the torrent has been added.
        sendResponse({});
        return true;
    }
});
