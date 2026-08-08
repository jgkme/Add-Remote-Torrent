import { describe, expect, test } from "bun:test";
import {
  originPatternFromUrl,
  hostPermissionStatusLabel,
  mapServerHostPermissions,
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
