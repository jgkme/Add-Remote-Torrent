/**
 * Small Chromium vs Firefox helpers for Manifest V3 packaging.
 */

export function isFirefox() {
  try {
    return chrome.runtime.getURL("").startsWith("moz-extension:");
  } catch {
    return false;
  }
}

/** Chrome Web Store reviews when Chromium; GitHub for Firefox until AMO listing exists. */
export function getStoreReviewsUrl() {
  if (isFirefox()) {
    return "https://github.com/jgkme/Add-Remote-Torrent";
  }
  return `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
}

/**
 * Firefox rejects Chromium-only notification fields (buttons, priority, …) with TypeError.
 * @param {string|object} notificationIdOrOptions
 * @param {object} [maybeOptions]
 */
export function createExtensionNotification(notificationIdOrOptions, maybeOptions) {
  let notificationId;
  let options;
  if (typeof notificationIdOrOptions === "string") {
    notificationId = notificationIdOrOptions;
    options = maybeOptions || {};
  } else {
    options = notificationIdOrOptions || {};
  }

  const {
    buttons,
    priority,
    requireInteraction,
    eventTime,
    silent,
    imageUrl,
    progress,
    contextMessage,
    ...rest
  } = options;

  const payload = { ...rest };

  if (!isFirefox()) {
    if (buttons) payload.buttons = buttons;
    if (priority != null) payload.priority = priority;
    if (requireInteraction != null) payload.requireInteraction = requireInteraction;
    if (eventTime != null) payload.eventTime = eventTime;
    if (silent != null) payload.silent = silent;
    if (imageUrl) payload.imageUrl = imageUrl;
    if (progress != null) payload.progress = progress;
    if (contextMessage) payload.contextMessage = contextMessage;
  }

  if (notificationId) {
    return chrome.notifications.create(notificationId, payload);
  }
  return chrome.notifications.create(payload);
}
