import { describe, expect, test } from "bun:test";
import { clipboardWatchDecision, isSupportedClipboardLink } from "../js/clipboardText.js";

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

describe("clipboardWatchDecision", () => {
  test("remembers the first sample without adding it", () => {
    expect(
      clipboardWatchDecision({ primed: false, previous: "", next: "magnet:?xt=urn:btih:abc" })
    ).toEqual({ primed: true, seen: "magnet:?xt=urn:btih:abc", add: false });
  });

  test("adds when the clipboard changes to a supported link", () => {
    expect(
      clipboardWatchDecision({
        primed: true,
        previous: "hello",
        next: "https://tracker.example/a.torrent",
      }).add
    ).toBe(true);
  });

  test("does not add the same text again or plain text", () => {
    expect(
      clipboardWatchDecision({ primed: true, previous: "magnet:?xt=1", next: "magnet:?xt=1" }).add
    ).toBe(false);
    expect(
      clipboardWatchDecision({ primed: true, previous: "magnet:?xt=1", next: "notes" }).add
    ).toBe(false);
  });
});
