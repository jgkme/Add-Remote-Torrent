/**
 * Parse ruTorrent php/addtorrent.php HTML/JS into a user-facing result.
 * ruTorrent often returns snippets like:
 *   noty("https://tracker/download - "+theUILang.addTorrentFailedURL,"error");
 */

const FAILED_URL_MESSAGE =
  "ruTorrent could not download that torrent URL itself (typical on private trackers — the client does not have your site cookies). Stay logged into the torrent site, enable “Always download .torrent file before sending”, grant site access, then retry so the extension can upload the .torrent file.";

const FAILED_FILE_MESSAGE =
  "ruTorrent rejected the uploaded .torrent file. Check that the file is valid and that your ruTorrent session is logged in.";

/**
 * @param {string} text
 * @param {string} [responseUrl]
 * @returns {{ success: boolean, userMessage: string, technicalDetail?: string, errorCode?: string }}
 */
export function interpretRuTorrentAddResponse(text, responseUrl = "") {
  const body = String(text || "");
  const url = String(responseUrl || "");

  if (url.includes("result[]=Success") || body.includes("addTorrentSuccess")) {
    return { success: true, userMessage: "Torrent added successfully." };
  }

  if (body.includes("addTorrentFailedURL")) {
    return {
      success: false,
      userMessage: FAILED_URL_MESSAGE,
      technicalDetail: clip(body),
      errorCode: "RUTORRENT_URL_FETCH_FAILED",
    };
  }

  if (body.includes("addTorrentFailed")) {
    return {
      success: false,
      userMessage: FAILED_FILE_MESSAGE,
      technicalDetail: clip(body),
      errorCode: "RUTORRENT_ADD_FAILED",
    };
  }

  return {
    success: false,
    userMessage: `ruTorrent did not accept the torrent.${body.trim() ? " See technical details." : ""}`,
    technicalDetail: clip(body),
    errorCode: "RUTORRENT_UNKNOWN_RESPONSE",
  };
}

function clip(text, max = 300) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}
