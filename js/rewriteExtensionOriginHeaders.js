/**
 * Firefox background fetch() often sends Origin: moz-extension://… (or null).
 * qBittorrent CSRF then 401s because Origin does not match Host.
 * Rewrite only extension/null origins; leave a real site Origin alone.
 */
export function rewriteExtensionOriginHeaders(requestHeaders, requestUrl) {
  let requestOrigin;
  try {
    requestOrigin = new URL(requestUrl).origin;
  } catch {
    return requestHeaders || [];
  }
  if (!requestOrigin || requestOrigin === "null") {
    return requestHeaders || [];
  }

  const isExtensionOrigin = (value) => {
    const v = String(value || "");
    return (
      v === "null" ||
      v.startsWith("moz-extension://") ||
      v.startsWith("chrome-extension://")
    );
  };

  return (requestHeaders || []).map((header) => {
    const name = String(header.name || "").toLowerCase();
    if (name === "origin" && isExtensionOrigin(header.value)) {
      return { ...header, value: requestOrigin };
    }
    if (name === "referer" && isExtensionOrigin(header.value)) {
      return { ...header, value: `${requestOrigin}/` };
    }
    return header;
  });
}

/** Firefox MV3 still allows blocking webRequest; Chrome CWS MV3 does not. */
export function installFirefoxOriginHeaderRewrite() {
  try {
    if (!chrome?.runtime?.getURL?.("").startsWith("moz-extension:")) return;
  } catch {
    return;
  }
  if (!chrome.webRequest?.onBeforeSendHeaders?.addListener) return;
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => ({
      requestHeaders: rewriteExtensionOriginHeaders(
        details.requestHeaders,
        details.url
      ),
    }),
    { urls: ["http://*/*", "https://*/*"] },
    ["blocking", "requestHeaders"]
  );
}
