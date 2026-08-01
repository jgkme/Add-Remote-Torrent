# Competitive landscape (internal)

**Date:** 2026-08-01  
**Audience:** Maintainers / agents only — do **not** paste rival names into the public README or Chrome Web Store listing.

## Market segments

| Segment | Approx. reach | Niche |
| --- | --- | --- |
| Multi-client Chrome incumbent (Remote Torrent Adder / bogenpirat) | ~30k CWS users, ~304★ | One-click add to many WebUIs; polished MV3 TypeScript/React rewrite |
| **Add Remote Torrent (us)** | ~5k CWS users, ~4.7★, repo 0.4.51 / store often lagging | Multi-client + dashboard, RSS, search, NAS/legacy clients |
| qBittorrent Manager | ~5–6k CWS, ~3.8★ | qBit-only manage + context-menu add |
| Control for Transmission | ~4k CWS, ~4.4★ | Transmission-only manager |
| Torrent Control (Firefox) | ~8.2k AMO, ~221★ | Multi-client Firefox; strong paths/labels/RSS-add |
| Torrent Clipper | Chrome fork of Torrent Control, ~25★ | Smaller Chrome port of TC |
| Send to qBittorrent (+ clones) | &lt;1k | Minimal right-click → qBit |
| Magneto / misc Transmission senders | tiny / often stale | Single-client context menu |

Sources: Chrome Web Store shields.io badges, AMO API, GitHub API (2026-08).

## Where we already win

- **Client breadth** after rivals dropped Synology, µTorrent, rTorrent XML-RPC, Buffalo, Hadouken, older qBit, etc.
- **Product depth:** dashboard, live torrents, Jackett/Prowlarr/qBit search, RSS, clipboard/batch/DnD, keyboard commands, completion notify
- **qBittorrent power features:** API key / WebUI Basic, categories sync, metadata/file select, force start, RSS reader
- **Privacy posture:** optional link catching + optional host permissions vs always-on `<all_urls>` content scripts
- **CWS rating** higher than the multi-client incumbent (smaller base)

## Where discovery lags

- README historically FAQ-first (addressed by 2026-08-01 landing redesign)
- GitHub topics were empty (now set)
- Store version often behind repo (maintainer soak before publish)
- Brand mindshare: decade-old “Remote Torrent Adder” name vs younger listing

## Issue themes from rivals (opportunities we partly own)

1. **Link catching / SPA / private-tracker URL shapes** — document custom regex; keep catch opt-in
2. **qBit HTTPS / auth / CSRF** — already documented; keep handlers resilient
3. **Labels / directories / remember last** — sticky last-used on confirmAdd (2026-08-01)
4. **Force start** — we already expose it; surface in README features
5. **Synology / legacy clients** — keep supporting; discovery should mention NAS clients
6. **rqbit** — niche (~1.8k★ vs qBit ~39k★); skip unless user demand appears

## Positioning line (public-safe)

> Multi-client one-click add with dashboard, RSS, search, and broad client coverage — settings stay on your machine.

Never name competitors in README / CWS copy.
