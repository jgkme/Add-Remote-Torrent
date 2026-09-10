import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  getActiveTorrents,
  testConnection,
} from "../api_handlers/qbittorrent_handler.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

function jsonTorrents(torrents) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => torrents,
  };
}

function loginOk() {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => "Ok.",
  };
}

function unauthorized(status, statusText) {
  return {
    ok: false,
    status,
    statusText,
  };
}

function mockCookieSession({ unauthorizedStatus, unauthorizedText }) {
  const calls = [];
  let sidValid = false;
  const torrents = [
    {
      hash: "abc",
      name: "example",
      progress: 0.5,
      state: "downloading",
      eta: 10,
      dlspeed: 1,
      upspeed: 0,
      added_on: 1,
    },
  ];

  globalThis.fetch = mock(async (url) => {
    const href = String(url);
    calls.push(href);
    if (href.includes("/api/v2/auth/login")) {
      sidValid = true;
      return loginOk();
    }
    if (href.includes("/api/v2/torrents/info")) {
      if (!sidValid) {
        return unauthorized(unauthorizedStatus, unauthorizedText);
      }
      return jsonTorrents(torrents);
    }
    if (!href.includes("/api/v2/")) {
      return { ok: true, status: 200, statusText: "OK", text: async () => "" };
    }
    throw new Error(`unexpected fetch: ${href}`);
  });

  return {
    calls,
    expireSid() {
      sidValid = false;
    },
  };
}

describe("qBittorrent cookie session refresh", () => {
  const baseServer = {
    url: "https://qb.example/",
    username: "user",
    password: "secret",
  };

  test("re-logins and lists torrents after a 401 from an expired proxy session", async () => {
    const server = { ...baseServer, id: "qbit-401" };
    const { calls, expireSid } = mockCookieSession({
      unauthorizedStatus: 401,
      unauthorizedText: "Unauthorized",
    });

    const first = await getActiveTorrents(server);
    expect(first).toHaveLength(1);
    expireSid();

    const second = await getActiveTorrents(server);
    expect(second).toHaveLength(1);
    expect(second[0].hash).toBe("abc");

    const logins = calls.filter((u) => u.includes("/auth/login"));
    const infos = calls.filter((u) => u.includes("/torrents/info"));
    expect(logins).toHaveLength(2);
    expect(infos.length).toBeGreaterThanOrEqual(2);
  });

  test("re-logins and lists torrents after a 403 from an expired WebUI SID", async () => {
    const server = { ...baseServer, id: "qbit-403" };
    const { calls, expireSid } = mockCookieSession({
      unauthorizedStatus: 403,
      unauthorizedText: "Forbidden",
    });

    await getActiveTorrents(server);
    expireSid();

    const second = await getActiveTorrents(server);
    expect(second).toHaveLength(1);

    const logins = calls.filter((u) => u.includes("/auth/login"));
    expect(logins).toHaveLength(2);
  });

  test("does not POST login again when torrents/info is 401 right after a successful login", async () => {
    const server = { ...baseServer, id: "qbit-proxy-401" };
    const calls = [];
    let logins = 0;
    globalThis.fetch = mock(async (url) => {
      const href = String(url);
      calls.push(href);
      if (href.includes("/api/v2/auth/login")) {
        logins += 1;
        if (logins > 1) {
          return unauthorized(401, "Unauthorized");
        }
        return loginOk();
      }
      if (href.includes("/api/v2/torrents/info")) {
        return unauthorized(401, "Unauthorized");
      }
      if (!href.includes("/api/v2/")) {
        return { ok: true, status: 200, statusText: "OK", text: async () => "" };
      }
      throw new Error(`unexpected fetch: ${href}`);
    });

    await expect(getActiveTorrents(server)).rejects.toThrow(
      /Failed to list torrents: 401 Unauthorized/
    );
    expect(logins).toBe(1);
    expect(calls.filter((u) => u.includes("/auth/login"))).toHaveLength(1);
  });

  test("lists torrents from existing SID cookies without posting login first", async () => {
    const server = { ...baseServer, id: "qbit-reuse-sid" };
    const calls = [];
    globalThis.fetch = mock(async (url) => {
      const href = String(url);
      calls.push(href);
      if (href.includes("/api/v2/auth/login")) {
        return loginOk();
      }
      if (href.includes("/api/v2/torrents/info")) {
        return jsonTorrents([
          {
            hash: "abc",
            name: "example",
            progress: 0.5,
            state: "downloading",
            eta: 10,
            dlspeed: 1,
            upspeed: 0,
            added_on: 1,
          },
        ]);
      }
      throw new Error(`unexpected fetch: ${href}`);
    });

    const torrents = await getActiveTorrents(server);
    expect(torrents).toHaveLength(1);
    expect(calls.filter((u) => u.includes("/auth/login"))).toHaveLength(0);
    expect(calls.some((u) => u.includes("/torrents/info"))).toBe(true);
  });

  test("GETs the WebUI origin before login when the API is 401 (proxy cookie warmup)", async () => {
    const server = { ...baseServer, id: "qbit-warmup" };
    const calls = [];
    let proxyReady = false;
    globalThis.fetch = mock(async (url) => {
      const href = String(url);
      calls.push(href);
      if (!href.includes("/api/v2/")) {
        proxyReady = true;
        return { ok: true, status: 200, statusText: "OK", text: async () => "" };
      }
      if (href.includes("/api/v2/auth/login")) {
        if (!proxyReady) {
          return unauthorized(401, "Unauthorized");
        }
        return loginOk();
      }
      if (href.includes("/api/v2/torrents/info")) {
        if (!proxyReady) {
          return unauthorized(401, "Unauthorized");
        }
        return jsonTorrents([
          {
            hash: "abc",
            name: "example",
            progress: 1,
            state: "pausedUP",
            eta: 0,
            dlspeed: 0,
            upspeed: 0,
            added_on: 1,
          },
        ]);
      }
      throw new Error(`unexpected fetch: ${href}`);
    });

    const torrents = await getActiveTorrents(server);
    expect(torrents).toHaveLength(1);
    const loginIdx = calls.findIndex((u) => u.includes("/auth/login"));
    const warmupIdx = calls.findIndex((u) => !u.includes("/api/v2/"));
    expect(loginIdx).toBeGreaterThan(-1);
    expect(warmupIdx).toBeGreaterThan(-1);
    expect(warmupIdx).toBeLessThan(loginIdx);
  });

  test("Test Connection warms the WebUI origin before cookie login", async () => {
    const server = { ...baseServer, id: "qbit-testconn-warmup" };
    const calls = [];
    let proxyReady = false;
    globalThis.fetch = mock(async (url) => {
      const href = String(url);
      calls.push(href);
      if (!href.includes("/api/v2/")) {
        proxyReady = true;
        return { ok: true, status: 200, statusText: "OK", text: async () => "" };
      }
      if (href.includes("/api/v2/auth/login")) {
        if (!proxyReady) {
          return unauthorized(401, "Unauthorized");
        }
        return loginOk();
      }
      if (href.includes("/api/v2/app/version")) {
        return { ok: true, status: 200, text: async () => "v5.0.1" };
      }
      if (href.includes("/api/v2/app/buildInfo")) {
        return { ok: true, status: 200, json: async () => ({ qt: "6" }) };
      }
      if (href.includes("/api/v2/app/webapiVersion")) {
        return { ok: true, status: 200, text: async () => "2.11.2" };
      }
      if (href.includes("/api/v2/sync/maindata")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ torrents: {}, server_state: {} }),
        };
      }
      if (href.includes("/api/v2/torrents/categories")) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      throw new Error(`unexpected fetch: ${href}`);
    });

    const result = await testConnection(server);
    expect(result.success).toBe(true);
    const loginIdx = calls.findIndex((u) => u.includes("/auth/login"));
    const warmupIdx = calls.findIndex((u) => !u.includes("/api/v2/"));
    expect(warmupIdx).toBeGreaterThan(-1);
    expect(loginIdx).toBeGreaterThan(-1);
    expect(warmupIdx).toBeLessThan(loginIdx);
  });
});
