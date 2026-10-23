/**
 * Watches the clipboard on pages this extension can access.
 * Registered only while "auto-add when copied" is enabled.
 */
import { isSupportedClipboardLink } from "./js/clipboardText.js";

const SAMPLE_INTERVAL_MS = 1500;

function sendSample(text) {
  const value = String(text || "").trim();
  if (!value) return;
  try {
    chrome.runtime.sendMessage({ action: "clipboardWatchSample", text: value });
  } catch {
    /* extension context gone */
  }
}

async function sampleClipboard() {
  if (document.visibilityState !== "visible") return;
  try {
    sendSample(await navigator.clipboard.readText());
  } catch {
    /* page not focused, or the browser blocked the read */
  }
}

document.addEventListener(
  "copy",
  () => {
    const selected = String(document.getSelection?.() || "").trim();
    if (isSupportedClipboardLink(selected)) sendSample(selected);
    setTimeout(sampleClipboard, 100);
  },
  true
);

setInterval(sampleClipboard, SAMPLE_INTERVAL_MS);
void sampleClipboard();
