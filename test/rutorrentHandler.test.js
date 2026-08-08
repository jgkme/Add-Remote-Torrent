import { afterEach, describe, expect, mock, test } from "bun:test";
import { addTorrent } from "../api_handlers/rutorrent_handler.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

function mockFetchOk(resultUrl = "https://rt.example/php/addtorrent.php?result[]=Success") {
  const calls = [];
  globalThis.fetch = mock(async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      url: resultUrl,
      text: async () => "addTorrentSuccess",
    };
  });
  return calls;
}

describe("ruTorrent addTorrent", () => {
  const serverConfig = {
    url: "https://rt.example/",
    ruTorrentrelativepath: "",
  };

  test("falls back to URL body when torrentFileContentBase64 is null (no Buffer crash)", async () => {
    const calls = mockFetchOk();
    const torrentUrl = "https://torrentleech.org/download/123/file.torrent";

    const result = await addTorrent(torrentUrl, serverConfig, {
      paused: false,
      torrentFileContentBase64: null,
      downloadDir: "",
      labels: [],
    });

    expect(result.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].init.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded"
    );
    expect(calls[0].init.body).toBe(`url=${encodeURIComponent(torrentUrl)}`);
  });

  test("falls back to URL body when torrentFileContentBase64 is undefined", async () => {
    const calls = mockFetchOk();
    const torrentUrl = "https://example.com/a.torrent";

    const result = await addTorrent(torrentUrl, serverConfig, {
      paused: false,
      downloadDir: "",
      labels: [],
    });

    expect(result.success).toBe(true);
    expect(calls[0].init.body).toBe(`url=${encodeURIComponent(torrentUrl)}`);
  });

  test("uploads file when base64 content is present", async () => {
    const calls = mockFetchOk();
    // minimal valid-looking base64 payload
    const base64 = Buffer.from("d8:announce").toString("base64");

    const result = await addTorrent(
      "https://example.com/a.torrent",
      serverConfig,
      {
        paused: false,
        torrentFileContentBase64: base64,
        downloadDir: "",
        labels: [],
      }
    );

    expect(result.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].init.body).toBeInstanceOf(FormData);
    expect(calls[0].init.headers["Content-Type"]).toBeUndefined();
  });

  test("uses URL body for magnet links", async () => {
    const calls = mockFetchOk();
    const magnet = "magnet:?xt=urn:btih:abcdef";

    const result = await addTorrent(magnet, serverConfig, {
      paused: false,
      torrentFileContentBase64: null,
      downloadDir: "",
      labels: [],
    });

    expect(result.success).toBe(true);
    expect(calls[0].init.body).toBe(`url=${encodeURIComponent(magnet)}`);
  });
});
