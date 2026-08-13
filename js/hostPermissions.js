/**
 * Host / site-access permission helpers for server URLs and link catching.
 */

export const LINK_CATCHING_ORIGINS = ["http://*/*", "https://*/*"];

/** Broader patterns Chrome may show as granted for "On all sites". */
const LINK_CATCHING_BROADER_ORIGINS = ["<all_urls>", "*://*/*"];

/**
 * @returns {Promise<boolean>}
 */
export async function hasLinkCatchingHostPermission() {
  if (typeof chrome === "undefined" || !chrome.permissions?.contains) {
    return false;
  }
  try {
    if (await chrome.permissions.contains({ origins: LINK_CATCHING_ORIGINS })) {
      return true;
    }
    for (const origin of LINK_CATCHING_BROADER_ORIGINS) {
      if (await chrome.permissions.contains({ origins: [origin] })) {
        return true;
      }
    }
    // Some Chrome builds grant schemes independently.
    const httpOk = await chrome.permissions.contains({
      origins: ["http://*/*"],
    });
    const httpsOk = await chrome.permissions.contains({
      origins: ["https://*/*"],
    });
    return Boolean(httpOk && httpsOk);
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @returns {string | null} Chrome origin pattern like "https://example.com/"
 */
export function originPatternFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    return `${new URL(url).origin}/`;
  } catch {
    return null;
  }
}

/**
 * Convert chrome.permissions granted origins into content-script match patterns.
 * Chrome "On specific sites" grants look like `https://example.com/` — those must
 * become `https://example.com/*` to inject. All-sites grants keep http/https wildcards.
 * @param {string[]} origins
 * @returns {string[]}
 */
export function grantedOriginsToContentScriptMatches(origins) {
  const list = Array.isArray(origins) ? origins : [];
  const hasAllSites =
    list.includes("<all_urls>") ||
    list.includes("*://*/*") ||
    (list.includes("http://*/*") && list.includes("https://*/*"));
  if (hasAllSites) {
    return ["http://*/*", "https://*/*"];
  }

  const matches = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "string") continue;
    if (raw === "http://*/*" || raw === "https://*/*") {
      matches.push(raw);
      continue;
    }
    if (!/^https?:\/\//i.test(raw)) continue;
    try {
      if (raw.includes("*")) {
        let pattern = raw;
        if (pattern.endsWith("/")) pattern += "*";
        else if (!pattern.endsWith("*")) pattern += "/*";
        matches.push(pattern);
        continue;
      }
      matches.push(`${new URL(raw).origin}/*`);
    } catch {
      /* skip invalid */
    }
  }
  return [...new Set(matches)].sort();
}

/**
 * @returns {Promise<string[]>}
 */
export async function getGrantedHostOrigins() {
  if (typeof chrome === "undefined" || !chrome.permissions?.getAll) {
    return [];
  }
  try {
    const all = await chrome.permissions.getAll();
    return Array.isArray(all?.origins) ? all.origins : [];
  } catch {
    return [];
  }
}

/**
 * True when link catching can run on at least one http(s) origin
 * (all sites or Chrome "specific sites").
 */
export async function hasAnyLinkCatchingHostPermission() {
  if (await hasLinkCatchingHostPermission()) return true;
  const matches = grantedOriginsToContentScriptMatches(
    await getGrantedHostOrigins()
  );
  return matches.length > 0;
}

/**
 * @param {boolean | null | undefined} granted
 * @returns {{ label: string, tone: 'ok' | 'missing' | 'unknown' }}
 */
export function hostPermissionStatusLabel(granted) {
  if (granted === true) {
    return { label: "Site access: granted", tone: "ok" };
  }
  if (granted === false) {
    return { label: "Site access: missing", tone: "missing" };
  }
  return { label: "Site access: unknown", tone: "unknown" };
}

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function hasHostPermissionForUrl(url) {
  const origin = originPatternFromUrl(url);
  if (!origin) return false;
  if (typeof chrome === "undefined" || !chrome.permissions?.contains) {
    return false;
  }
  try {
    return await chrome.permissions.contains({ origins: [origin] });
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function requestHostPermissionForUrl(url) {
  const origin = originPatternFromUrl(url);
  if (!origin) return false;
  if (typeof chrome === "undefined" || !chrome.permissions?.request) {
    return false;
  }
  try {
    return await chrome.permissions.request({ origins: [origin] });
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function requestLinkCatchingHostPermission() {
  if (typeof chrome === "undefined" || !chrome.permissions?.request) {
    return false;
  }
  try {
    return await chrome.permissions.request({
      origins: LINK_CATCHING_ORIGINS,
    });
  } catch {
    return false;
  }
}

/**
 * @param {Array<{ id?: string, url?: string }>} servers
 * @returns {Promise<Record<string, boolean>>}
 */
export async function mapServerHostPermissions(servers) {
  const list = Array.isArray(servers) ? servers : [];
  const entries = await Promise.all(
    list.map(async (server) => {
      const id = server?.id;
      if (!id) return null;
      const granted = await hasHostPermissionForUrl(server.url || "");
      return [id, granted];
    })
  );
  /** @type {Record<string, boolean>} */
  const out = {};
  for (const entry of entries) {
    if (entry) out[entry[0]] = entry[1];
  }
  return out;
}
