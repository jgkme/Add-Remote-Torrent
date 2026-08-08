/**
 * Download a .torrent using the user's browser session.
 * Prefer an in-tab fetch (first-party cookies + Referer) when a page tab is available;
 * private trackers often return 403 to service-worker fetches because SameSite cookies
 * and anti-leech Referer checks fail there.
 */

/**
 * @param {string} pageUrl
 * @param {number | null | undefined} explicitTabId
 * @returns {Promise<number | null>}
 */
export async function resolveSourceTabId(pageUrl, explicitTabId) {
  if (explicitTabId != null && Number.isFinite(Number(explicitTabId))) {
    return Number(explicitTabId);
  }
  if (!pageUrl || typeof pageUrl !== "string") return null;
  if (typeof chrome === "undefined" || !chrome.tabs?.query) return null;
  try {
    const tabs = await chrome.tabs.query({});
    const exact = tabs.find((t) => t.url === pageUrl);
    if (exact?.id != null) return exact.id;
    let origin;
    try {
      origin = new URL(pageUrl).origin;
    } catch {
      return null;
    }
    const sameOrigin = tabs.find(
      (t) => t.url && t.url.startsWith(origin) && t.active
    );
    if (sameOrigin?.id != null) return sameOrigin.id;
    const anySame = tabs.find((t) => t.url && t.url.startsWith(origin));
    return anySame?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {number} tabId
 * @param {string} torrentUrl
 * @returns {Promise<{ bytes: Uint8Array, contentType: string | null, via: 'page' }>}
 */
export async function fetchTorrentBytesInTab(tabId, torrentUrl) {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    throw new Error("scripting API unavailable");
  }
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (url) => {
      const response = await fetch(url, {
        credentials: "include",
        redirect: "follow",
      });
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          statusText: response.statusText,
          contentType,
        };
      }
      const buffer = await response.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      return { ok: true, status: response.status, contentType, bytes };
    },
    args: [torrentUrl],
  });
  const payload = results?.[0]?.result;
  if (!payload) {
    throw new Error("In-tab torrent download returned no result");
  }
  if (!payload.ok) {
    const err = new Error(
      `Failed to fetch URL: ${payload.status} ${payload.statusText || ""}`.trim()
    );
    err.artHttpStatus = payload.status;
    err.artHttpStatusText = payload.statusText;
    err.artContentType = payload.contentType;
    throw err;
  }
  if (!payload.bytes?.length) {
    throw new Error("empty response body with torrent Content-Type");
  }
  return {
    bytes: Uint8Array.from(payload.bytes),
    contentType: payload.contentType || null,
    via: "page",
  };
}

/**
 * @param {string} torrentUrl
 * @returns {Promise<{ bytes: Uint8Array, contentType: string | null, via: 'service_worker' }>}
 */
export async function fetchTorrentBytesInServiceWorker(torrentUrl) {
  const response = await fetch(torrentUrl, {
    credentials: "include",
    redirect: "follow",
  });
  if (!response.ok) {
    const err = new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    );
    err.artHttpStatus = response.status;
    err.artHttpStatusText = response.statusText;
    throw err;
  }
  const contentType = response.headers.get("content-type");
  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    const err = new Error("empty response body with torrent Content-Type");
    err.artContentType = contentType;
    throw err;
  }
  return {
    bytes: new Uint8Array(arrayBuffer),
    contentType,
    via: "service_worker",
  };
}

/**
 * @param {string} torrentUrl
 * @param {{ pageUrl?: string | null, tabId?: number | null }} [opts]
 */
export async function fetchTorrentBytesWithSession(torrentUrl, opts = {}) {
  const tabId = await resolveSourceTabId(opts.pageUrl, opts.tabId);
  const errors = [];

  if (tabId != null) {
    try {
      return await fetchTorrentBytesInTab(tabId, torrentUrl);
    } catch (e) {
      errors.push(e);
    }
  }

  try {
    return await fetchTorrentBytesInServiceWorker(torrentUrl);
  } catch (e) {
    errors.push(e);
    // Prefer the page-context error when both fail (usually the more accurate 403).
    throw errors[0] || e;
  }
}
