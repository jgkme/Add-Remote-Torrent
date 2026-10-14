/**
 * Remembers the element under a right-click so the context-menu handler can
 * add torrents from icon buttons that are not <a href> links.
 * Runs in the extension isolated world (registered script and one-shot inject).
 */
import { resolveContextTarget } from "./js/contextTargetUrl.js";

const MAX_AGE_MS = 20000;

async function fetchMteamDownloadUrl(id) {
  const auth = localStorage.getItem("auth");
  if (!auth || !id) return "";
  const configured = localStorage.getItem("apiHost");
  const base = (configured || `${location.origin}/api`).replace(/\/$/, "");
  const body = new FormData();
  body.set("id", id);
  const response = await fetch(`${base}/torrent/genDlToken`, {
    method: "POST",
    headers: {
      authorization: auth,
      visitorId: localStorage.getItem("visitorId") || "",
      did: localStorage.getItem("did") || "",
      ts: String(Math.floor(Date.now() / 1000)),
    },
    body,
  });
  if (!response.ok) return "";
  const data = await response.json();
  if (String(data?.code) !== "0" || typeof data?.data !== "string") return "";
  return data.data;
}

function eventElement(event) {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  for (const node of path) {
    if (node && node.nodeType === 1) return node;
  }
  return event.target && event.target.nodeType === 1 ? event.target : null;
}

async function resolveElement(element) {
  const decision = resolveContextTarget(element, location.href);
  if (decision.url) return { url: decision.url, error: "" };
  if (decision.mteamId) {
    try {
      const url = await fetchMteamDownloadUrl(decision.mteamId);
      if (url) return { url, error: "" };
    } catch {
      /* fall through */
    }
    return {
      url: "",
      error:
        "Could not get an M-Team download link. Stay logged in on this page, then right-click the download button again.",
    };
  }
  return { url: "", error: "" };
}

async function resolveContextClick() {
  const stored = globalThis.__artContextTarget;
  if (stored && Date.now() - stored.at < MAX_AGE_MS) {
    if (stored.pending) {
      try {
        await stored.pending;
      } catch {
        /* stored.error is set by the listener */
      }
    }
    if (stored.url) return { url: stored.url, error: "" };
    if (stored.error) return { url: "", error: stored.error };
  }
  const active = document.activeElement;
  if (active && active !== document.body && active !== document.documentElement) {
    return resolveElement(active);
  }
  return { url: "", error: "" };
}

if (!globalThis.__artContextTargetInstalled) {
  globalThis.__artContextTargetInstalled = true;
  document.addEventListener(
    "contextmenu",
    (event) => {
      const element = eventElement(event);
      const decision = element ? resolveContextTarget(element, location.href) : { url: "", mteamId: "" };
      const stored = {
        url: decision.url || "",
        error: "",
        pending: null,
        at: Date.now(),
      };
      globalThis.__artContextTarget = stored;
      if (!stored.url && decision.mteamId) {
        stored.pending = fetchMteamDownloadUrl(decision.mteamId)
          .then((url) => {
            stored.url = url || "";
            if (!stored.url) {
              stored.error =
                "Could not get an M-Team download link. Stay logged in on this page, then right-click the download button again.";
            }
            return stored.url;
          })
          .catch(() => {
            stored.error =
              "Could not get an M-Team download link. Stay logged in on this page, then right-click the download button again.";
            return "";
          });
      }
    },
    true
  );
}

globalThis.__artResolveContextClick = resolveContextClick;
