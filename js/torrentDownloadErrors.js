/**
 * Build user-facing Recent Activity messages when the extension cannot
 * download a .torrent with the browser session (cookies / auth / network).
 */

/**
 * @param {unknown} error
 * @param {{ status?: number, statusText?: string } | null} [http]
 * @returns {{ short: string, detail: string, likelyCause: string }}
 */
export function classifyTorrentDownloadFailure(error, http = null) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message || "")
      : String(error || "");

  const status = http?.status;
  const statusText = http?.statusText || "";

  if (status === 401 || status === 403) {
    return {
      likelyCause: "session_auth",
      short:
        "Could not download .torrent: site rejected the browser session (HTTP " +
        status +
        "). Check that you are logged in on that site, then retry.",
      detail:
        "Private trackers need your cookies. Open the torrent site in this browser, log in, and try again. " +
        `HTTP ${status} ${statusText}`.trim(),
    };
  }

  if (status === 404) {
    return {
      likelyCause: "not_found",
      short:
        "Could not download .torrent: link returned 404. The download URL may have expired.",
      detail: `HTTP 404 ${statusText}`.trim(),
    };
  }

  if (typeof status === "number" && status >= 400) {
    return {
      likelyCause: "http_error",
      short: `Could not download .torrent with your browser session (HTTP ${status}). Sent original URL to the client instead.`,
      detail: `HTTP ${status} ${statusText}: ${message}`.trim(),
    };
  }

  const lower = message.toLowerCase();
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed")
  ) {
    return {
      likelyCause: "network_or_cors",
      short:
        "Could not download .torrent (network/CORS). Often a cookie/session or site-access issue — stay logged in on the torrent site, grant the extension access to that site if prompted, then retry. Sent original URL to the client instead.",
      detail: message,
    };
  }

  if (lower.includes("empty") || lower.includes("no usable")) {
    return {
      likelyCause: "empty_body",
      short:
        "Site returned no usable .torrent data (empty or non-torrent body — often a login/HTML page when cookies expired). Sent original URL to the client instead.",
      detail: message,
    };
  }

  return {
    likelyCause: "unknown",
    short:
      "Could not download .torrent with your browser session (cookies may be missing or expired). Sent original URL to the client instead.",
    detail: message || "Unknown download failure",
  };
}

/**
 * @param {string} userMessage
 * @param {string} [detail]
 * @returns {string}
 */
export function formatTorrentDownloadHistoryMessage(userMessage, detail) {
  if (!detail || detail === userMessage) return userMessage;
  const clipped = detail.length > 180 ? `${detail.slice(0, 180)}…` : detail;
  return `${userMessage} (${clipped})`;
}
