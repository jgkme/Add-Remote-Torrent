#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <patch|minor|major|X.Y.Z> [-m \"release summary\"]"
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

BUMP="$1"
shift
SUMMARY="Automated release"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      SUMMARY="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      ;;
  esac
done

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is required but not found in PATH."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required but not found in PATH."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree must be clean before running release."
  git status --short
  exit 1
fi

CURRENT_VERSION="$(node -e "console.log(require('./package.json').version)")"

if [[ "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  TARGET_VERSION="$BUMP"
else
  TARGET_VERSION="$(node - "$CURRENT_VERSION" "$BUMP" <<'NODE'
const current = process.argv[2];
const bump = process.argv[3];
const parts = current.split('.').map(Number);
if (parts.length !== 3 || parts.some(Number.isNaN)) {
  throw new Error(`Invalid current version: ${current}`);
}
let [major, minor, patch] = parts;
if (bump === 'patch') patch += 1;
else if (bump === 'minor') { minor += 1; patch = 0; }
else if (bump === 'major') { major += 1; minor = 0; patch = 0; }
else throw new Error(`Invalid bump type: ${bump}`);
console.log(`${major}.${minor}.${patch}`);
NODE
)"
fi

if [[ "$TARGET_VERSION" == "$CURRENT_VERSION" ]]; then
  echo "Target version equals current version ($CURRENT_VERSION). Nothing to do."
  exit 1
fi

if git rev-parse "v${TARGET_VERSION}" >/dev/null 2>&1; then
  echo "Tag v${TARGET_VERSION} already exists."
  exit 1
fi

DATE_UTC="$(date +%Y-%m-%d)"

node - "$TARGET_VERSION" <<'NODE'
const fs = require('fs');
const targetVersion = process.argv[2];

function updateJson(path, updater) {
  const obj = JSON.parse(fs.readFileSync(path, 'utf8'));
  updater(obj);
  fs.writeFileSync(path, `${JSON.stringify(obj, null, 2)}\n`);
}

updateJson('package.json', (obj) => {
  obj.version = targetVersion;
});

updateJson('manifest.json', (obj) => {
  obj.version = targetVersion;
});
NODE

python3 - "$TARGET_VERSION" "$DATE_UTC" "$SUMMARY" <<'PY'
import pathlib
import sys

version = sys.argv[1]
date = sys.argv[2]
summary = sys.argv[3]

readme = pathlib.Path("README.md")
text = readme.read_text(encoding="utf-8")
marker = "## Changelog\n\n"
entry = (
    f"- **v{version} ({date}):**\n"
    f"  - **Chore (Release):** {summary}.\n"
    f"  - **Build:** Generated release artifacts for `v{version}`.\n"
)
if marker not in text:
    raise SystemExit("README.md does not contain '## Changelog' marker.")
readme.write_text(text.replace(marker, marker + entry, 1), encoding="utf-8")

notes = pathlib.Path("release_notes.md")
notes_text = notes.read_text(encoding="utf-8")
notes_entry = (
    f"### v{version} ({date})\n\n"
    f"*   **Chore (Release):** {summary}.\n"
    f"*   **Build:** Generated release artifacts for `v{version}`.\n\n"
)
notes.write_text(notes_entry + notes_text, encoding="utf-8")
PY

bun run build

ZIP_FILE="add-remote-torrent-v${TARGET_VERSION}.zip"
CRX_FILE="add-remote-torrent-v${TARGET_VERSION}.crx"
SHA_FILE="${ZIP_FILE}.sha256"

for f in "$ZIP_FILE" "$CRX_FILE" "$SHA_FILE"; do
  if [[ ! -f "$f" ]]; then
    echo "Expected artifact missing: $f"
    exit 1
  fi
done

git add package.json manifest.json README.md release_notes.md "$ZIP_FILE" "$CRX_FILE" "$SHA_FILE"
git commit -m "$(cat <<EOF
Release v${TARGET_VERSION}.

${SUMMARY}
EOF
)"
git tag -a "v${TARGET_VERSION}" -m "Release v${TARGET_VERSION}"

git push origin master
git push origin "v${TARGET_VERSION}"

gh release create "v${TARGET_VERSION}" "$CRX_FILE" "$ZIP_FILE" "$SHA_FILE" \
  --title "v${TARGET_VERSION}" \
  --notes-file release_notes.md

echo "Release complete: v${TARGET_VERSION}"
