/**
 * Build Authorization headers for clients behind HTTP Basic Auth (seedboxes, etc.).
 * @param {Record<string, string>} headers
 * @param {{
 *   useBasicAuth?: boolean,
 *   basicAuthUsername?: string,
 *   basicAuthPassword?: string,
 *   username?: string,
 *   password?: string,
 * }} serverConfig
 * @returns {Record<string, string>}
 */
export function applyHttpAuthHeaders(headers, serverConfig = {}) {
  const out = headers && typeof headers === "object" ? headers : {};
  if (
    serverConfig.useBasicAuth &&
    serverConfig.basicAuthUsername &&
    serverConfig.basicAuthPassword
  ) {
    out.Authorization = `Basic ${btoa(
      `${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`
    )}`;
    return out;
  }
  const username = (serverConfig.username || "").trim();
  const password = serverConfig.password || "";
  // Require both — username-only Basic headers override browser session auth and cause 401s.
  if (username && password) {
    out.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
  }
  return out;
}

/**
 * Whether ruTorrent should send Authorization on the first request.
 * Prefer browser session cookies unless HTTP Basic Auth is explicitly enabled.
 */
export function shouldSendRuTorrentBasicAuthUpfront(serverConfig = {}) {
  return Boolean(
    serverConfig.useBasicAuth &&
      ((serverConfig.basicAuthUsername && serverConfig.basicAuthPassword) ||
        ((serverConfig.username || "").trim() && serverConfig.password))
  );
}

/**
 * Profile has credentials we can use for a Basic Auth retry after 401.
 */
export function hasRuTorrentBasicAuthCredentials(serverConfig = {}) {
  if (
    serverConfig.useBasicAuth &&
    serverConfig.basicAuthUsername &&
    serverConfig.basicAuthPassword
  ) {
    return true;
  }
  return Boolean((serverConfig.username || "").trim() && serverConfig.password);
}

/**
 * User-facing hint when contacting a remote WebUI fails at the network layer.
 * @param {string} clientLabel
 * @param {unknown} error
 * @param {{ hasHostPermission?: boolean }} [opts]
 */
export function classifyClientContactFailure(clientLabel, error, opts = {}) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message || "")
      : String(error || "");
  const lower = message.toLowerCase();

  if (opts.hasHostPermission === false) {
    return {
      likelyCause: "missing_host_permission",
      userMessage: `No host permission for this ${clientLabel} URL. Open Options, edit/save the server (or Test Connection) to grant access, then retry.`,
    };
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed")
  ) {
    return {
      likelyCause: "network_or_auth",
      userMessage: `Could not contact ${clientLabel}: Failed to fetch. Check the server URL, that the extension has host permission for it, and (for seedboxes) that username/password or Basic Auth are set in the server profile.`,
    };
  }

  return {
    likelyCause: "unknown",
    userMessage: `Could not contact ${clientLabel}: ${message || "unknown error"}`,
  };
}
