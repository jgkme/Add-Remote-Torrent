import { describe, expect, test } from "bun:test";
import {
  isDownloadControl,
  looksLikeTorrentUrl,
  resolveContextTarget,
  selectionToTorrentUrl,
} from "../js/contextTargetUrl.js";

function matchesOne(el, selector) {
  if (selector.startsWith(".")) {
    return el.className.split(/\s+/).includes(selector.slice(1));
  }
  const attrEq = selector.match(/^\[([^=]+)='([^']+)'\]$/);
  if (attrEq) return el.getAttribute(attrEq[1]) === attrEq[2];
  if (selector === "[data-row-key]") {
    return Boolean(el.dataset.rowKey || el.getAttribute("data-row-key"));
  }
  const tagAttr = selector.match(/^(\w+)\[(\w+)\]$/);
  if (tagAttr) {
    return el.tagName === tagAttr[1].toUpperCase() && el.getAttribute(tagAttr[2]) != null;
  }
  if (/^\w+$/.test(selector)) return el.tagName === selector.toUpperCase();
  return false;
}

function matches(el, selector) {
  return selector.split(",").some((part) => matchesOne(el, part.trim()));
}

function createElement(tag, { attrs = {}, dataset = {}, className = "", text = "", children = [] } = {}) {
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    attrs: { ...attrs },
    dataset: { ...dataset },
    className,
    textContent: text,
    children: [],
    parentElement: null,
    href: attrs.href || "",
    getAttribute(name) {
      if (name === "class") return this.className || null;
      if (name === "data-row-key") return this.dataset.rowKey ?? null;
      if (name === "data-id") return this.dataset.id ?? null;
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const found = [];
      const walk = (current) => {
        for (const child of current.children) {
          if (matches(child, selector)) found.push(child);
          walk(child);
        }
      };
      walk(this);
      return found;
    },
    closest(selector) {
      let current = this;
      while (current) {
        if (matches(current, selector)) return current;
        current = current.parentElement;
      }
      return null;
    },
  };
  for (const child of children) {
    child.parentElement = node;
    node.children.push(child);
    if (child.textContent) node.textContent += child.textContent;
  }
  return node;
}

describe("resolveContextTarget", () => {
  test("reads a torrent href from the clicked anchor", () => {
    const anchor = createElement("a", {
      attrs: { href: "https://tracker.example/download.php?id=9" },
      text: "DL",
    });
    expect(resolveContextTarget(anchor, "https://tracker.example/browse")).toEqual({
      url: "https://tracker.example/download.php?id=9",
      mteamId: "",
    });
  });

  test("ignores ordinary title links", () => {
    const anchor = createElement("a", {
      attrs: { href: "https://tracker.example/details/9" },
      text: "Movie",
    });
    expect(resolveContextTarget(anchor, "https://tracker.example/browse")).toEqual({
      url: "",
      mteamId: "",
    });
  });

  test("finds a download link in the same row as an icon button", () => {
    const icon = createElement("span", { className: "anticon anticon-download" });
    const button = createElement("button", { attrs: { type: "button", title: "下载" }, children: [icon] });
    const download = createElement("a", {
      attrs: { href: "https://tracker.example/torrents.php?action=download&id=3" },
    });
    const row = createElement("tr", { children: [button, download] });
    expect(isDownloadControl(icon)).toBe(true);
    expect(resolveContextTarget(icon, "https://tracker.example/browse").url).toBe(
      "https://tracker.example/torrents.php?action=download&id=3"
    );
    expect(row).toBeTruthy();
  });

  test("returns an M-Team numeric id for a download icon in a table row", () => {
    const icon = createElement("svg", { attrs: { "data-icon": "download" } });
    const button = createElement("button", { children: [icon] });
    const row = createElement("tr", { dataset: { rowKey: "4242" }, children: [button] });
    expect(row.dataset.rowKey).toBe("4242");
    expect(resolveContextTarget(icon, "https://kp.m-team.cc/browse")).toEqual({
      url: "",
      mteamId: "4242",
    });
  });

  test("uses the detail id when the M-Team download button is on the detail page", () => {
    const button = createElement("button", { text: "下載" });
    expect(
      resolveContextTarget(button, "https://kp.m-team.cc/detail/77")
    ).toEqual({ url: "", mteamId: "77" });
  });
});

describe("selectionToTorrentUrl", () => {
  test("accepts magnets and http urls", () => {
    expect(selectionToTorrentUrl(" magnet:?xt=urn:btih:abc ")).toBe("magnet:?xt=urn:btih:abc");
    expect(selectionToTorrentUrl("https://example/a.torrent")).toBe("https://example/a.torrent");
    expect(selectionToTorrentUrl("not a link")).toBe("");
  });
});

describe("looksLikeTorrentUrl", () => {
  test("matches magnets and download endpoints", () => {
    expect(looksLikeTorrentUrl("magnet:?xt=urn:btih:abc")).toBe(true);
    expect(looksLikeTorrentUrl("https://example/file.torrent")).toBe(true);
    expect(looksLikeTorrentUrl("https://example/details/1")).toBe(false);
  });
});
