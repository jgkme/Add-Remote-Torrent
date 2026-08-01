import { describe, expect, test } from "bun:test";
import {
  parseLabelDirectoryMap,
  resolveConfirmAddDefaults,
  buildLastUsedServerPatch,
} from "../js/confirmAddDefaults.js";

describe("parseLabelDirectoryMap", () => {
  test("parses label=path lines", () => {
    expect(parseLabelDirectoryMap("movies=/dl/movies\ntv=/dl/tv")).toEqual({
      movies: "/dl/movies",
      tv: "/dl/tv",
    });
  });

  test("returns empty object for invalid input", () => {
    expect(parseLabelDirectoryMap(null)).toEqual({});
    expect(parseLabelDirectoryMap("")).toEqual({});
  });
});

describe("resolveConfirmAddDefaults", () => {
  const baseServer = {
    tags: "seed",
    defaultCategory: "movies",
    category: "other",
    categories: "movies,tv",
    downloadDirectories: "/dl/movies,/dl/tv",
    labelDirectoryMap: "movies=/dl/movies\ntv=/dl/tv",
  };

  test("uses profile tags and defaultCategory when no lastUsed", () => {
    const r = resolveConfirmAddDefaults({ server: baseServer });
    expect(r.tags).toBe("seed");
    expect(r.category).toBe("movies");
    expect(r.downloadDir).toBe("/dl/movies");
  });

  test("lastUsed wins when still in lists", () => {
    const r = resolveConfirmAddDefaults({
      server: {
        ...baseServer,
        lastUsedCategory: "tv",
        lastUsedTags: "tmp",
        lastUsedDownloadDir: "/dl/tv",
      },
    });
    expect(r).toEqual({ tags: "tmp", category: "tv", downloadDir: "/dl/tv" });
  });

  test("invalid lastUsed category falls back to profile", () => {
    const r = resolveConfirmAddDefaults({
      server: { ...baseServer, lastUsedCategory: "gone", lastUsedTags: "x" },
    });
    expect(r.category).toBe("movies");
    expect(r.tags).toBe("x");
  });

  test("falls back to defaultTags when tags empty", () => {
    const r = resolveConfirmAddDefaults({
      server: { ...baseServer, tags: "", defaultTags: "legacy" },
    });
    expect(r.tags).toBe("legacy");
  });
});

describe("buildLastUsedServerPatch", () => {
  test("returns lastUsed fields from confirm values", () => {
    expect(
      buildLastUsedServerPatch({
        tags: "a",
        category: "movies",
        downloadDir: "/dl/movies",
      })
    ).toEqual({
      lastUsedTags: "a",
      lastUsedCategory: "movies",
      lastUsedDownloadDir: "/dl/movies",
    });
  });
});
