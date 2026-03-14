## Firefox Build Notes

- The manifest now includes `browser_specific_settings.gecko.id`.
- Build for Firefox with:
  - `bun run build:firefox`
- Load the unpacked `dist` folder in Firefox via `about:debugging`.
- If any API differences appear, keep using `chrome.*` APIs since Firefox provides compatibility shims for most MV3 extension APIs used in this project.
