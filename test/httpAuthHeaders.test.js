import { describe, expect, test } from "bun:test";
import {
  applyHttpAuthHeaders,
  classifyClientContactFailure,
} from "../js/httpAuthHeaders.js";

describe("applyHttpAuthHeaders", () => {
  test("uses dedicated basic auth fields when enabled", () => {
    const headers = applyHttpAuthHeaders(
      {},
      {
        useBasicAuth: true,
        basicAuthUsername: "seed",
        basicAuthPassword: "box",
        username: "ignored",
        password: "ignored",
      }
    );
    expect(headers.Authorization).toBe(`Basic ${btoa("seed:box")}`);
  });

  test("falls back to profile username/password", () => {
    const headers = applyHttpAuthHeaders(
      {},
      { username: "user", password: "pass" }
    );
    expect(headers.Authorization).toBe(`Basic ${btoa("user:pass")}`);
  });

  test("leaves headers unchanged when no credentials", () => {
    expect(applyHttpAuthHeaders({}, {})).toEqual({});
  });
});

describe("classifyClientContactFailure", () => {
  test("calls out missing host permission", () => {
    const r = classifyClientContactFailure("ruTorrent", new Error("Failed to fetch"), {
      hasHostPermission: false,
    });
    expect(r.likelyCause).toBe("missing_host_permission");
    expect(r.userMessage.toLowerCase()).toContain("host permission");
  });

  test("failed to fetch mentions basic auth for seedboxes", () => {
    const r = classifyClientContactFailure("ruTorrent", new Error("Failed to fetch"), {
      hasHostPermission: true,
    });
    expect(r.likelyCause).toBe("network_or_auth");
    expect(r.userMessage.toLowerCase()).toContain("basic auth");
  });
});
