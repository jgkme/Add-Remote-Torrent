/**
 * Registers the link-catching content script only when the user enables it.
 * Avoids loading content_script.js on every page by default (MV3 best practice).
 */

import { debug } from './debug.js';

export const LINK_CATCHING_CONTENT_SCRIPT_ID = 'art-link-catching';

/** Matches manifest optional_host_permissions; required before register/inject on pages. */
export const LINK_CATCHING_HOST_ORIGINS = ['http://*/*', 'https://*/*'];

const INJECTABLE_URL = /^https?:\/\//i;

export async function hasLinkCatchingHostPermissions() {
    return chrome.permissions.contains({ origins: LINK_CATCHING_HOST_ORIGINS });
}

export function requestLinkCatchingHostPermissions() {
    return new Promise((resolve) => {
        chrome.permissions.request({ origins: LINK_CATCHING_HOST_ORIGINS }, (granted) => {
            resolve(Boolean(granted));
        });
    });
}

export async function ensureLinkCatchingHostPermissions() {
    if (await hasLinkCatchingHostPermissions()) {
        return true;
    }
    return requestLinkCatchingHostPermissions();
}

/**
 * @param {boolean} enabled
 */
export async function syncLinkCatchingContentScript(enabled) {
    if (!chrome.scripting?.registerContentScripts) {
        debug.warn(
            '[ART] scripting.registerContentScripts unavailable; link catching requires a supported Chromium build.'
        );
        return;
    }

    let registered = [];
    try {
        registered = await chrome.scripting.getRegisteredContentScripts();
    } catch (error) {
        debug.warn('[ART] getRegisteredContentScripts failed:', error);
    }

    const isRegistered = registered.some((s) => s.id === LINK_CATCHING_CONTENT_SCRIPT_ID);

    if (enabled && !(await hasLinkCatchingHostPermissions())) {
        debug.warn(
            '[ART] Link catching enabled but site access (http/https) was not granted; skipping content script registration.'
        );
        if (isRegistered) {
            await chrome.scripting.unregisterContentScripts({
                ids: [LINK_CATCHING_CONTENT_SCRIPT_ID],
            });
            debug.log('[ART] Unregistered link-catching content script (missing site access).');
        }
        return;
    }

    if (enabled && !isRegistered) {
        await chrome.scripting.registerContentScripts([
            {
                id: LINK_CATCHING_CONTENT_SCRIPT_ID,
                js: ['content_script.js'],
                matches: ['<all_urls>'],
                runAt: 'document_idle',
                persistAcrossSessions: true,
            },
        ]);
        debug.log('[ART] Registered link-catching content script.');
    } else if (!enabled && isRegistered) {
        await chrome.scripting.unregisterContentScripts({
            ids: [LINK_CATCHING_CONTENT_SCRIPT_ID],
        });
        debug.log('[ART] Unregistered link-catching content script.');
    }
}

/**
 * Inject into open http(s) tabs so enabling link catching works without a full refresh.
 * Only touches the focused window to avoid surprising background-tab injection.
 */
export async function injectLinkCatchingIntoFocusedWindowTabs() {
    if (!chrome.scripting?.executeScript) {
        return;
    }
    if (!(await hasLinkCatchingHostPermissions())) {
        debug.warn('[ART] Skipping link-catching injection: site access not granted.');
        return;
    }

    let windowId;
    try {
        const focused = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
        windowId = focused?.id;
    } catch (error) {
        debug.warn('[ART] Could not resolve focused window for injection:', error);
        return;
    }

    if (windowId == null) {
        return;
    }

    let tabs = [];
    try {
        tabs = await chrome.tabs.query({ windowId });
    } catch (error) {
        debug.warn('[ART] tabs.query failed during link-catching injection:', error);
        return;
    }

    for (const tab of tabs) {
        if (!tab.id || !tab.url || !INJECTABLE_URL.test(tab.url)) {
            continue;
        }
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content_script.js'],
            });
        } catch (error) {
            debug.log(
                `[ART] Skipped injecting link-catching script in tab ${tab.id} (${tab.url}):`,
                error?.message || error
            );
        }
    }
}

/**
 * Read catchfrompage from storage and sync registration.
 */
export async function syncLinkCatchingFromStorage() {
    const { catchfrompage = false } = await chrome.storage.local.get('catchfrompage');
    await syncLinkCatchingContentScript(Boolean(catchfrompage));
    if (catchfrompage) {
        await injectLinkCatchingIntoFocusedWindowTabs();
    }
}
