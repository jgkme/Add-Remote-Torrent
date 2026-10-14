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
