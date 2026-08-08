import { describe, expect, mock, test } from "bun:test";
import { syncLinkCatchingContentScript } from "../content_script_registration.js";

describe("syncLinkCatchingContentScript", () => {
  test("re-registers when a stale <all_urls> registration persists", async () => {
    const unregisterContentScripts = mock(async () => {});
    const registerContentScripts = mock(async () => {});
    const contains = mock(async () => true);

    globalThis.chrome = {
      permissions: { contains },
      scripting: {
        getRegisteredContentScripts: async () => [
          {
            id: "art-link-catching",
            matches: ["<all_urls>"],
          },
        ],
        unregisterContentScripts,
        registerContentScripts,
      },
    };

    await syncLinkCatchingContentScript(true);

    expect(unregisterContentScripts).toHaveBeenCalled();
    expect(registerContentScripts).toHaveBeenCalled();
    const registered = registerContentScripts.mock.calls[0][0][0];
    expect(registered.matches).toEqual(["http://*/*", "https://*/*"]);
  });
});
