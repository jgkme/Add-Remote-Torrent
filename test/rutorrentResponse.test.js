import { describe, expect, test } from "bun:test";
import { interpretRuTorrentAddResponse } from "../js/rutorrentResponse.js";

describe("interpretRuTorrentAddResponse", () => {
  test("treats addTorrentSuccess as success", () => {
    const r = interpretRuTorrentAddResponse("addTorrentSuccess");
    expect(r.success).toBe(true);
  });

  test("maps addTorrentFailedURL noty JS to a private-tracker message", () => {
    const raw =
      'noty("https://URL/torrents/######/download - "+theUILang.addTorrentFailedURL,"error");';
    const r = interpretRuTorrentAddResponse(raw);
    expect(r.success).toBe(false);
    expect(r.errorCode).toBe("RUTORRENT_URL_FETCH_FAILED");
    expect(r.userMessage.toLowerCase()).toContain("private tracker");
    expect(r.userMessage).not.toContain("noty(");
    expect(r.technicalDetail).toContain("addTorrentFailedURL");
  });

  test("maps addTorrentFailed to file-reject message", () => {
    const r = interpretRuTorrentAddResponse("theUILang.addTorrentFailed");
    expect(r.success).toBe(false);
    expect(r.errorCode).toBe("RUTORRENT_ADD_FAILED");
  });
});
