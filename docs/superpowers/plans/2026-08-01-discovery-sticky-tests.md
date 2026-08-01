# Discovery + Sticky Confirm Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship GitHub discovery (topics + README), sticky last-used confirmAdd defaults with `bun test`, internal competitive/pre-CWS docs — without publishing to the Chrome Web Store.

**Architecture:** Shared pure helpers in `js/confirmAddDefaults.js` used by confirmAdd (prefill) and background (parse map + persist on successful confirmAdd adds). Discovery is metadata/docs only. CWS upload stays maintainer-gated.

**Tech Stack:** Vanilla JS (ES modules), Webpack, Bun (`bun test`), `gh` for topics/homepage.

**Spec:** [docs/superpowers/specs/2026-08-01-discovery-sticky-tests-design.md](../specs/2026-08-01-discovery-sticky-tests-design.md)

---

## File map

| File | Role |
| --- | --- |
| `.gitignore` | Ignore `.superpowers/` |
| `README.md` | Product landing hero + existing FAQ below |
| `js/confirmAddDefaults.js` | Pure: parse map, resolve defaults, build lastUsed patch |
| `test/confirmAddDefaults.test.js` | Bun tests |
| `package.json` | `"test": "bun test"` |
| `confirmAdd/confirmAdd.js` | Prefill via resolver; apply map on load |
| `background.js` | Import shared parse; persist lastUsed on successful confirmAdd add |
| `docs/superpowers/specs/2026-08-01-competitive-landscape.md` | Internal competitive notes |
| `docs/superpowers/specs/2026-08-01-pre-cws-checklist.md` | Maintainer soak + store steps |

---

### Task 1: Ignore brainstorm artifacts + GitHub topics

**Files:**
- Modify: `.gitignore`
- Remote: `jgkme/Add-Remote-Torrent` via `gh`

- [ ] **Step 1: Add `.superpowers/` to `.gitignore`**

Append:

```
# Superpowers brainstorm companion (local)
.superpowers/
```

- [ ] **Step 2: Set topics and homepage**

```bash
gh repo edit jgkme/Add-Remote-Torrent \
  --add-topic chrome-extension \
  --add-topic torrent-management \
  --add-topic qbittorrent \
  --add-topic manifest-v3 \
  --add-topic bittorrent \
  --add-topic transmission \
  --add-topic deluge \
  --homepage "https://chromewebstore.google.com/detail/add-remote-torrent/holiffefjdehbfhliggafhhlecphpdof"
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore: ignore .superpowers brainstorm artifacts

EOF
)"
```

---

### Task 2: README landing redesign

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the opening (through Core Features / clients) with landing structure**

Required elements:
- Title `# Add Remote Torrent`
- One-line tagline (magnets / `.torrent` URLs → remote client WebUIs)
- Badges (CWS users, rating, version, GitHub stars) using shields.io + repo `jgkme/Add-Remote-Torrent` and extension id `holiffefjdehbfhliggafhhlecphpdof`
- TOC anchors: Install, Features, Clients, Link catching, Shortcuts, Troubleshooting, Development, Changelog
- Install link to CWS
- Features bullets (multi-server, catching, advanced add, dashboard, RSS, search, rules, private-tracker session fetch, local-only) — **no competitor names**
- Complete client list matching `api_handlers/api_client_factory.js` HANDLERS (include tTorrent, Vuze XML, uTorrent Old as appropriate labels)
- Drop the Cline/Gemini / discontinued-heritage opening lines entirely
- Preserve existing Link catching, Shortcuts, Troubleshooting, Development, Changelog sections below (keep content; fix heading anchors if needed)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: redesign README as product landing page

EOF
)"
```

---

### Task 3: Pure helpers + failing tests (TDD)

**Files:**
- Create: `js/confirmAddDefaults.js`
- Create: `test/confirmAddDefaults.test.js`
- Modify: `package.json` (add `"test": "bun test"`)

- [ ] **Step 1: Add test script to `package.json`**

```json
"test": "bun test"
```

- [ ] **Step 2: Write failing tests** in `test/confirmAddDefaults.test.js`

```js
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
    expect(r.downloadDir).toBe("/dl/movies"); // map applied for initial category
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
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
bun test test/confirmAddDefaults.test.js
```

- [ ] **Step 4: Implement `js/confirmAddDefaults.js`** so tests pass

Export:
- `parseLabelDirectoryMap(raw)` — same behavior as current `background.js` implementation
- `resolveConfirmAddDefaults({ server })` — lastUsed → profile; validate category against `categories` split list when non-empty; validate dir against `downloadDirectories` when non-empty; then if category has map entry, set `downloadDir` from map (map wins for initial category when lastUsed dir empty OR always re-apply map when category came from profile/lastUsed category key — **spec:** apply map for initially selected category; if lastUsedDownloadDir is set and valid, keep it unless empty, then apply map)
- `buildLastUsedServerPatch({ tags, category, downloadDir })`

**Dir resolution rule (explicit):**  
category = resolved category; if `lastUsedDownloadDir` is set and (dirs list empty OR dir in list) use it; else if map[category] use map; else `""`.

- [ ] **Step 5: Run tests — expect PASS**

```bash
bun test
```

- [ ] **Step 6: Commit**

```bash
git add package.json js/confirmAddDefaults.js test/confirmAddDefaults.test.js
git commit -m "$(cat <<'EOF'
feat: add confirmAdd defaults helpers with bun tests

EOF
)"
```

---

### Task 4: Wire confirmAdd prefill

**Files:**
- Modify: `confirmAdd/confirmAdd.js`

- [ ] **Step 1: Import helpers and replace manual prefill**

- Import `parseLabelDirectoryMap`, `resolveConfirmAddDefaults` from `../js/confirmAddDefaults.js`
- Remove local duplicate map parser if identical
- After `activeServer` is known, call `resolveConfirmAddDefaults({ server: activeServer })`
- Set `tagsInput`, `categoryInput`, `directoryInput` from result
- Still build category/directory `<option>` lists from server config first, then set values
- Keep category `change` listener for map updates when user changes category

- [ ] **Step 2: Manual sanity** — open confirmAdd in mind: tags use `tags` field

- [ ] **Step 3: Commit**

```bash
git add confirmAdd/confirmAdd.js
git commit -m "$(cat <<'EOF'
fix: prefill confirmAdd from tags and last-used defaults

EOF
)"
```

---

### Task 5: Persist lastUsed on successful confirmAdd add

**Files:**
- Modify: `background.js`

- [ ] **Step 1: Import `parseLabelDirectoryMap` and `buildLastUsedServerPatch` from `./js/confirmAddDefaults.js`**

- Remove local `parseLabelDirectoryMap` function body; use shared import (keep `findUniqueCategoryForDirectory` as-is)

- [ ] **Step 2: Teach `addTorrentToClient` to persist on success when requested**

Add optional trailing arg `persistLastUsed = false`. When `result.success` and `persistLastUsed`:

```js
const patch = buildLastUsedServerPatch({
  tags: torrentOptions.tags || "",
  category: torrentOptions.category || "",
  downloadDir: torrentOptions.downloadDir || "",
});
const { servers = [] } = await chrome.storage.local.get("servers");
const idx = servers.findIndex((s) => s.id === serverToUse.id);
if (idx !== -1) {
  servers[idx] = { ...servers[idx], ...patch };
  await chrome.storage.local.set({ servers });
}
```

Use tags/category/dir from the **resolved torrentOptions** (what was actually sent).

- [ ] **Step 3: `addTorrentWithCustomParams` passes `persistLastUsed: true`**

Ensure `addTorrentToClient(...)` is awaited and receives `persistLastUsed = true` (add as final argument).

- [ ] **Step 4: Run `bun test` and `bun run build`**

Expected: tests pass; `verify-dist-background` OK.

- [ ] **Step 5: Commit**

```bash
git add background.js
git commit -m "$(cat <<'EOF'
feat: persist confirmAdd last-used tags category and directory

EOF
)"
```

---

### Task 6: Competitive landscape + pre-CWS checklist

**Files:**
- Create: `docs/superpowers/specs/2026-08-01-competitive-landscape.md`
- Create: `docs/superpowers/specs/2026-08-01-pre-cws-checklist.md`

- [ ] **Step 1: Write competitive landscape** (installs, niches, where we win/lose discovery, issue themes; names OK here — internal only)

- [ ] **Step 2: Write pre-CWS checklist** (bun test, build, confirmAdd sticky soak, multi-server, catching smoke, store zip — **no agent upload**)

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-08-01-competitive-landscape.md docs/superpowers/specs/2026-08-01-pre-cws-checklist.md
git commit -m "$(cat <<'EOF'
docs: add competitive landscape and pre-CWS checklist

EOF
)"
```

---

## Done when

- Topics + homepage set on GitHub
- README is a landing page without competitor names
- `bun test` green; sticky + tags fix wired; build verify green
- Internal competitive + pre-CWS docs present
- Agent has **not** uploaded to CWS
