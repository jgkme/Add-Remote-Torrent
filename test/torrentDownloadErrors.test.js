import { describe, expect, test } from "bun:test";
import {
  classifyTorrentDownloadFailure,
  formatTorrentDownloadHistoryMessage,
} from "../js/torrentDownloadErrors.js";

describe("classifyTorrentDownloadFailure", () => {
  test("401/403 point at cookie/session login", () => {
    const r = classifyTorrentDownloadFailure(new Error("Forbidden"), {
      status: 403,
      statusText: "Forbidden",
    });
    expect(r.likelyCause).toBe("session_auth");
    expect(r.short.toLowerCase()).toContain("cookie");
    expect(r.short).toContain("403");
  });

  test("Failed to fetch mentions cookies and site access", () => {
    const r = classifyTorrentDownloadFailure(
      new Error("Failed to fetch")
    );
    expect(r.likelyCause).toBe("network_or_cors");
    expect(r.short.toLowerCase()).toContain("cookie");
  });

  test("generic errors still mention cookies", () => {
    const r = classifyTorrentDownloadFailure(new Error("boom"));
    expect(r.likelyCause).toBe("unknown");
    expect(r.short.toLowerCase()).toContain("cookie");
  });
});

describe("formatTorrentDownloadHistoryMessage", () => {
  test("appends clipped detail", () => {
    expect(
      formatTorrentDownloadHistoryMessage("Short", "detail here")
    ).toBe("Short (detail here)");
  });
});
