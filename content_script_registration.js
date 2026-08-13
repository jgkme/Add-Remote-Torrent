/**
 * Registers the link-catching content script only when the user enables it.
 * Avoids loading content_script.js on every page by default (MV3 best practice).
 *
 * Matches must be a subset of granted host permissions. Chrome "On specific sites"
 * grants individual origins (not the all-sites wildcards), so register those origins.
 * Requiring all-sites access skipped injection after restart (#67).
 */

import { debug } from './debug.js';
import {
  LINK_CATCHING_ORIGINS,
  hasLinkCatchingHostPermission,
  requestLinkCatchingHostPermission,
  grantedOriginsToContentScriptMatches,
  getGrantedHostOrigins,
  hasHostPermissionForUrl,
} from './js/hostPermissions.js';

export const LINK_CATCHING_CONTENT_SCRIPT_ID = 'art-link-catching';

/** @deprecated Use LINK_CATCHING_ORIGINS from js/hostPermissions.js */
export const LINK_CATCHING_HOST_ORIGINS = LINK_CATCHING_ORIGINS;

const ALL_SITES_MATCHES = ['http://*/*', 'https://*/*'];

const INJECTABLE_URL = /^https?:\/\//i;

export async function hasLinkCatchingHostPermissions() {
  return hasLinkCatchingHostPermission();
}

export function requestLinkCatchingHostPermissions() {
  return requestLinkCatchingHostPermission();
}

export async function ensureLinkCatchingHostPermissions() {
  if (await hasLinkCatchingHostPermissions()) {
    return true;
  }
  return requestLinkCatchingHostPermissions();
}

function sameMatches(a, b) {
  const left = Array.isArray(a) ? [...a].sort() : [];
  const right = Array.isArray(b) ? [...b].sort() : [];
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

async function resolveLinkCatchingMatches() {
  if (await hasLinkCatchingHostPermission()) {
    return ALL_SITES_MATCHES;
  }
  return grantedOriginsToContentScriptMatches(await getGrantedHostOrigins());
}

/**
 * @param {boolean} enabled
 */
export async function syncLinkCatchingContentScript(enabled) {
  if (!chrome.scripting?.registerContentScripts) {
    debug.warn(
      '[ART] scripting.registerContentScripts unavailable; link catching requires a browser that supports dynamic content scripts.'
    );
    return;
  }

  let registered = [];
  try {
    registered = await chrome.scripting.getRegisteredContentScripts();
  } catch (error) {
    debug.warn('[ART] getRegisteredContentScripts failed:', error);
  }

  const existing = registered.find((s) => s.id === LINK_CATCHING_CONTENT_SCRIPT_ID);
  const isRegistered = Boolean(existing);
  const expectedMatches = enabled ? await resolveLinkCatchingMatches() : [];

  if (enabled && expectedMatches.length === 0) {
    debug.warn(
      '[ART] Link catching enabled but no http(s) site access was granted; skipping content script registration.'
    );
    if (isRegistered) {
      await chrome.scripting.unregisterContentScripts({
        ids: [LINK_CATCHING_CONTENT_SCRIPT_ID],
      });
      debug.log('[ART] Unregistered link-catching content script (missing site access).');
    }
    return;
  }

  const needsRewrite = isRegistered && !sameMatches(existing.matches, expectedMatches);

  if (enabled && (needsRewrite || !isRegistered)) {
    if (isRegistered) {
      await chrome.scripting.unregisterContentScripts({
        ids: [LINK_CATCHING_CONTENT_SCRIPT_ID],
      });
      debug.log(
        '[ART] Removed stale link-catching content script registration before re-registering.'
      );
    }
    await chrome.scripting.registerContentScripts([
      {
        id: LINK_CATCHING_CONTENT_SCRIPT_ID,
        js: ['content_script.js'],
        matches: expectedMatches,
        runAt: 'document_idle',
        persistAcrossSessions: true,
      },
    ]);
    debug.log(
      `[ART] Registered link-catching content script for ${expectedMatches.join(', ')}.`
    );
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

  const allSites = await hasLinkCatchingHostPermission();

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
    if (!allSites && !(await hasHostPermissionForUrl(tab.url))) {
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
