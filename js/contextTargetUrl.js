/**
 * Resolve a torrent URL from a right-clicked element that is not a normal link.
 * Chrome only supplies info.linkUrl for real <a href> targets. Private-tracker
 * download controls are often icon buttons, so the context menu has to recover
 * the URL from the row (or ask the page for a session download link).
 */

const TORRENT_URL =
  /^(magnet:)|(?:\.torrent(?:$|[?#]))|(?:download\.php|download_torrent|action=download|\/torrent\/download|genDlToken|\/download\/)/i;

const DOWNLOAD_LABEL = /download|下载|下載/i;
const DOWNLOAD_TEXT = /^(download|下载|下載)$/i;

/**
 * @param {string} url
 */
export function looksLikeTorrentUrl(url) {
  return typeof url === "string" && TORRENT_URL.test(url.trim());
}

/**
 * @param {string} value
 */
export function selectionToTorrentUrl(value) {
  const text = String(value || "").trim();
  if (text.startsWith("magnet:") || /^https?:\/\//i.test(text)) return text;
  return "";
}

/**
 * @param {string} href
 * @param {string} baseUrl
 */
function toAbsolute(href, baseUrl) {
  if (!href || typeof href !== "string") return "";
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("javascript:") || trimmed === "#") return "";
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return "";
  }
}

/**
 * @param {Element | null | undefined} el
 */
function elementText(el) {
  return String(el?.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * @param {Element | null | undefined} el
 */
export function isDownloadControl(el) {
  if (!el || el.nodeType !== 1 || typeof el.closest !== "function") return false;
  if (el.closest(".anticon-download, [data-icon='download']")) return true;
  const control = el.closest("button, a, [role='button']") || el;
  const label = [
    control.getAttribute?.("aria-label"),
    control.getAttribute?.("title"),
    control.getAttribute?.("data-icon"),
  ]
    .filter(Boolean)
    .join(" ");
  if (DOWNLOAD_LABEL.test(label)) return true;
  if (typeof control.querySelector === "function") {
    if (control.querySelector(".anticon-download, [data-icon='download']")) return true;
  }
  return DOWNLOAD_TEXT.test(elementText(control));
}

/**
 * @param {Element | null | undefined} row
 */
function rowTorrentId(row) {
  if (!row) return "";
  const id =
    row.dataset?.rowKey ||
    row.dataset?.id ||
    row.getAttribute?.("data-row-key") ||
    row.getAttribute?.("data-id") ||
    "";
  return /^\d+$/.test(String(id)) ? String(id) : "";
}

/**
 * @param {string} pageUrl
 */
function isMteamPage(pageUrl) {
  try {
    return /(^|\.)m-team\./i.test(new URL(pageUrl).hostname);
  } catch {
    return false;
  }
}

/**
 * @param {string} pageUrl
 */
function detailIdFromPage(pageUrl) {
  try {
    const match = new URL(pageUrl).pathname.match(/\/detail\/(\d+)/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

/**
 * @param {ParentNode | null | undefined} root
 * @param {string} pageUrl
 */
function torrentHrefIn(root, pageUrl) {
  if (!root || typeof root.querySelectorAll !== "function") return "";
  const anchors = root.querySelectorAll("a[href]");
  for (const anchor of anchors) {
    const href = toAbsolute(anchor.href || anchor.getAttribute?.("href") || "", pageUrl);
    if (looksLikeTorrentUrl(href)) return href;
  }
  return "";
}

/**
 * @param {Element | null | undefined} element
 * @param {string} pageUrl
 * @returns {{ url: string, mteamId: string }}
 */
export function resolveContextTarget(element, pageUrl) {
  const empty = { url: "", mteamId: "" };
  if (!element || element.nodeType !== 1 || typeof element.closest !== "function") {
    return empty;
  }

  const anchor = element.closest("a[href]");
  if (anchor) {
    const href = toAbsolute(anchor.href || anchor.getAttribute?.("href") || "", pageUrl);
    if (looksLikeTorrentUrl(href)) return { url: href, mteamId: "" };
    if (isDownloadControl(element) && /^https?:\/\//i.test(href)) {
      return { url: href, mteamId: "" };
    }
  }

  const form = element.closest("form[action]");
  if (form) {
    const action = toAbsolute(form.getAttribute?.("action") || "", pageUrl);
    if (looksLikeTorrentUrl(action)) return { url: action, mteamId: "" };
  }

  const labeled = element.closest("button, a, [role='button']") || element;
  for (const name of ["data-href", "data-url", "data-download", "data-download-url", "data-clipboard-text"]) {
    const href = toAbsolute(labeled.getAttribute?.(name) || "", pageUrl);
    if (looksLikeTorrentUrl(href)) return { url: href, mteamId: "" };
  }

  const onclick = labeled.getAttribute?.("onclick") || "";
  const onclickMatch = onclick.match(/((?:magnet:\?|https?:\/\/)[^'"\s)]+)/i);
  if (onclickMatch && looksLikeTorrentUrl(onclickMatch[1])) {
    return { url: onclickMatch[1], mteamId: "" };
  }

  if (!isDownloadControl(element)) return empty;

  const row = element.closest("tr, [data-row-key], li, article");
  const rowHref = torrentHrefIn(row, pageUrl);
  if (rowHref) return { url: rowHref, mteamId: "" };

  if (isMteamPage(pageUrl)) {
    const id = rowTorrentId(row) || detailIdFromPage(pageUrl);
    if (id) return { url: "", mteamId: id };
  }

  return empty;
}
