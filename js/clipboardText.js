/**
 * Popup clipboard reads. Chromium (including Brave) rejects
 * navigator.clipboard.readText() in an extension popup unless the extension
 * has the clipboardRead permission, even when the site clipboard setting is Allow.
 * document.execCommand('paste') is the fallback that permission unlocks.
 */

export function isSupportedClipboardLink(value) {
  const text = String(value || "").trim();
  return text.startsWith("magnet:") || /^https?:\/\//i.test(text);
}

/**
 * Decide whether a clipboard sample should be added.
 * The first sample after the option is turned on is only remembered, so a
 * link that was already copied is not added until the clipboard changes.
 * @param {{ primed?: boolean, previous?: string, next?: string }} state
 * @returns {{ primed: true, seen: string, add: boolean }}
 */
export function clipboardWatchDecision(state) {
  const seen = String(state?.next || "").trim();
  if (!state?.primed) {
    return { primed: true, seen, add: false };
  }
  if (seen === String(state.previous || "")) {
    return { primed: true, seen, add: false };
  }
  return { primed: true, seen, add: isSupportedClipboardLink(seen) };
}

function pasteWithExecCommand() {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return "";
  }
  const textarea = document.createElement("textarea");
  textarea.setAttribute("aria-hidden", "true");
  textarea.tabIndex = -1;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  let value = "";
  try {
    const ok = document.execCommand("paste");
    value = ok ? String(textarea.value || "") : "";
  } catch {
    value = "";
  } finally {
    textarea.remove();
  }
  return value;
}

export async function readClipboardText() {
  let asyncError = null;
  try {
    if (navigator.clipboard?.readText) {
      return String((await navigator.clipboard.readText()) || "");
    }
  } catch (error) {
    asyncError = error;
  }
  const pasted = pasteWithExecCommand();
  if (pasted) return pasted;
  if (asyncError) throw asyncError;
  throw new DOMException("Clipboard read failed", "NotAllowedError");
}
