import { describe, expect, test } from "bun:test";
import { rewriteExtensionOriginHeaders } from "../js/rewriteExtensionOriginHeaders.js";

describe("rewriteExtensionOriginHeaders", () => {
  test("replaces moz-extension Origin with the request origin", () => {
    const out = rewriteExtensionOriginHeaders(
      [
        { name: "Origin", value: "moz-extension://abc-uuid" },
        { name: "Referer", value: "https://qb.example/" },
      ],
      "https://qb.example/api/v2/auth/login"
    );
    expect(out.find((h) => h.name === "Origin").value).toBe("https://qb.example");
    expect(out.find((h) => h.name === "Referer").value).toBe("https://qb.example/");
  });

  test("replaces null Origin used by some Firefox extension fetches", () => {
    const out = rewriteExtensionOriginHeaders(
      [{ name: "origin", value: "null" }],
      "https://seedbox.example:443/api/v2/torrents/info"
    );
    expect(out[0].value).toBe("https://seedbox.example");
  });

  test("leaves a matching site Origin unchanged", () => {
    const headers = [{ name: "Origin", value: "https://qb.example" }];
    const out = rewriteExtensionOriginHeaders(
      headers,
      "https://qb.example/api/v2/app/version"
    );
    expect(out[0].value).toBe("https://qb.example");
  });
});
