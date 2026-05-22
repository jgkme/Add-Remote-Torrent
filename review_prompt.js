const REVIEW_PROMPT_PREFIX = "art-review-prompt-";
const FIRST_PROMPT_AFTER = 5;
const COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_PROMPTS = 3;

export function getChromeWebStoreReviewsUrl() {
  return `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
}

let listenersRegistered = false;

export function initReviewPromptListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  chrome.notifications.onButtonClicked.addListener(
    async (notificationId, buttonIndex) => {
      if (!String(notificationId).startsWith(REVIEW_PROMPT_PREFIX)) return;
      if (buttonIndex === 0) {
        await openReviewPage();
      } else {
        await dismissReviewPromptForCooldown();
      }
      chrome.notifications.clear(notificationId);
    }
  );

  chrome.notifications.onClicked.addListener(async (notificationId) => {
    if (!String(notificationId).startsWith(REVIEW_PROMPT_PREFIX)) return;
    await openReviewPage();
    chrome.notifications.clear(notificationId);
  });
}

async function openReviewPage() {
  await chrome.storage.local.set({
    reviewPromptOpenedReview: true,
    showReviewPromptInPopup: false,
  });
  chrome.tabs.create({ url: getChromeWebStoreReviewsUrl() });
}

async function dismissReviewPromptForCooldown() {
  await chrome.storage.local.set({
    reviewPromptLastShownAt: Date.now(),
    showReviewPromptInPopup: false,
  });
}

export async function recordSuccessfulAddAndMaybePrompt({
  useTextNotification = false,
} = {}) {
  const data = await chrome.storage.local.get([
    "reviewPromptSuccessCount",
    "reviewPromptLastShownAt",
    "reviewPromptTimesShown",
    "reviewPromptOpenedReview",
    "reviewPromptDismissedPermanent",
    "enableReviewPrompts",
    "enableTextNotifications",
  ]);

  if (data.enableReviewPrompts === false) return;

  const count = (data.reviewPromptSuccessCount || 0) + 1;
  await chrome.storage.local.set({ reviewPromptSuccessCount: count });

  if (data.reviewPromptOpenedReview || data.reviewPromptDismissedPermanent) {
    return;
  }
  if (count < FIRST_PROMPT_AFTER) return;

  const timesShown = data.reviewPromptTimesShown || 0;
  if (timesShown >= MAX_PROMPTS) return;

  const lastShown = data.reviewPromptLastShownAt || 0;
  if (timesShown > 0 && Date.now() - lastShown < COOLDOWN_MS) return;

  const now = Date.now();
  await chrome.storage.local.set({
    reviewPromptLastShownAt: now,
    reviewPromptTimesShown: timesShown + 1,
    showReviewPromptInPopup: true,
  });

  if (useTextNotification && data.enableTextNotifications) {
    const notificationId = `${REVIEW_PROMPT_PREFIX}${now}`;
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "icons/icon-48x48.png",
      title: "Add Remote Torrent",
      message:
        "Enjoying the extension? A quick Chrome Web Store review helps others find it.",
      buttons: [{ title: "Leave review" }, { title: "Not now" }],
    });
  }
}

export async function clearReviewPromptPopupFlag() {
  await chrome.storage.local.set({ showReviewPromptInPopup: false });
}

export async function permanentlyDismissReviewPrompts() {
  await chrome.storage.local.set({
    reviewPromptDismissedPermanent: true,
    showReviewPromptInPopup: false,
  });
}
