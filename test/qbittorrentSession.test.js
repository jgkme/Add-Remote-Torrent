import { afterEach, describe, expect, mock, test } from "bun:test";
import { getActiveTorrents } from "../api_handlers/qbittorrent_handler.js";

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
});
