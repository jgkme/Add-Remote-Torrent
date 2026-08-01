# Pre–Chrome Web Store checklist (v0.4.51+)

**Maintainer-only.** Do not upload until soak passes. Agent must not publish.

## Automated

- [ ] `bun test` — all green
- [ ] `bun run build` — `verify-dist-background: OK`, zip/crx produced
- [ ] Manifest / `package.json` version match the intended store version

## Advanced Add (sticky)

With **Advanced Add Dialog** enabled for at least one server:

- [ ] Prefill shows profile **tags** (not blank when options `tags` is set)
- [ ] After a **successful** confirmAdd, reopen dialog: last category/tags/dir restored for that server
- [ ] Category with `label=/path` map selects mapped directory on open
- [ ] Second server does **not** inherit first server’s last-used values
- [ ] Failed add does not overwrite last-used (or verify behavior matches success-only persist)

## Silent / other add paths

- [ ] Context-menu add still works (no confirm dialog)
- [ ] On-page catching smoke (magnet + one `.torrent` pattern site)
- [ ] Tracker URL rules still apply on silent add
- [ ] qBittorrent add + Transmission or Deluge smoke if you use them

## Store packaging

- [ ] Use release zip from current build pipeline / `release_notes.md` as needed
- [ ] Screenshots / store description unchanged unless intentionally updated (`docs/local/` for paste copy)
- [ ] Permission justifications still accurate
- [ ] Upload only after the checks above

## After publish

- [ ] Confirm CWS version badge matches repo
- [ ] Spot-check install from store on a clean profile
