import { describe, expect, test } from "bun:test";
import { isSupportedClipboardLink } from "../js/clipboardText.js";

describe("isSupportedClipboardLink", () => {
  test("accepts magnet and http(s) links", () => {
    expect(isSupportedClipboardLink("magnet:?xt=urn:btih:abc")).toBe(true);
    expect(isSupportedClipboardLink("  https://example/a.torrent  ")).toBe(true);
    expect(isSupportedClipboardLink("http://127.0.0.1/a.torrent")).toBe(true);
  });

  test("rejects empty and plain text", () => {
    expect(isSupportedClipboardLink("")).toBe(false);
    expect(isSupportedClipboardLink("hello")).toBe(false);
  });
});
