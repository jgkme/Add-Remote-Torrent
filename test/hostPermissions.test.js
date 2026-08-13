import { describe, expect, test } from "bun:test";
import {
  originPatternFromUrl,
  hostPermissionStatusLabel,
  mapServerHostPermissions,
  grantedOriginsToContentScriptMatches,
} from "../js/hostPermissions.js";

describe("originPatternFromUrl", () => {
  test("returns origin with trailing slash", () => {
    expect(originPatternFromUrl("https://box.example/rutorrent/")).toBe(
      "https://box.example/"
    );
  });

  test("returns null for invalid urls", () => {
    expect(originPatternFromUrl("")).toBeNull();
    expect(originPatternFromUrl("not-a-url")).toBeNull();
  });
});

describe("hostPermissionStatusLabel", () => {
  test("labels granted and missing", () => {
    expect(hostPermissionStatusLabel(true)).toEqual({
      label: "Site access: granted",
      tone: "ok",
    });
    expect(hostPermissionStatusLabel(false).tone).toBe("missing");
  });
});

describe("mapServerHostPermissions", () => {
  test("maps empty list", async () => {
    expect(await mapServerHostPermissions([])).toEqual({});
  });
});

describe("grantedOriginsToContentScriptMatches", () => {
  test("uses http/https wildcards when all-sites is granted", () => {
    expect(
      grantedOriginsToContentScriptMatches(["http://*/*", "https://*/*"])
    ).toEqual(["http://*/*", "https://*/*"]);
    expect(grantedOriginsToContentScriptMatches(["<all_urls>"])).toEqual([
      "http://*/*",
      "https://*/*",
    ]);
  });

  test("maps Chrome specific-site grants to content-script match patterns", () => {
    expect(
      grantedOriginsToContentScriptMatches([
        "https://torrentleech.org/",
        "https://www.example.com/*",
      ])
    ).toEqual(["https://torrentleech.org/*", "https://www.example.com/*"]);
  });

  test("returns empty when no http(s) origins", () => {
    expect(grantedOriginsToContentScriptMatches(["chrome://extensions/"])).toEqual(
      []
    );
  });
});
