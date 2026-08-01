/**
 * Pure helpers for Advanced Add (confirmAdd) default resolution and sticky last-used.
 */

export function parseLabelDirectoryMap(rawMapping) {
  if (!rawMapping || typeof rawMapping !== "string") {
    return {};
  }
  return rawMapping
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line.includes("="))
    .reduce((acc, line) => {
      const [label, ...rest] = line.split("=");
      const key = (label || "").trim();
      const value = rest.join("=").trim();
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
}

function splitList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * @param {{ server: object }} opts
 * @returns {{ tags: string, category: string, downloadDir: string }}
 */
export function resolveConfirmAddDefaults({ server }) {
  if (!server || typeof server !== "object") {
    return { tags: "", category: "", downloadDir: "" };
  }

  const categoryOptions = splitList(server.categories);
  const directoryOptions = splitList(server.downloadDirectories);
  const labelDirectoryMap = parseLabelDirectoryMap(server.labelDirectoryMap);

  const profileTags =
    (typeof server.tags === "string" && server.tags) ||
    (typeof server.defaultTags === "string" && server.defaultTags) ||
    "";

  const profileCategoryRaw = server.defaultCategory || server.category || "";
  const profileCategory =
    typeof profileCategoryRaw === "string" ? profileCategoryRaw.trim() : "";

  let tags =
    typeof server.lastUsedTags === "string" ? server.lastUsedTags : profileTags;

  let category = "";
  const lastUsedCategory =
    typeof server.lastUsedCategory === "string"
      ? server.lastUsedCategory.trim()
      : "";
  if (lastUsedCategory) {
    if (categoryOptions.length === 0 || categoryOptions.includes(lastUsedCategory)) {
      category = lastUsedCategory;
    }
  }
  if (!category) {
    if (
      profileCategory &&
      (categoryOptions.length === 0 || categoryOptions.includes(profileCategory))
    ) {
      category = profileCategory;
    } else {
      category = "";
    }
  }

  let downloadDir = "";
  const lastUsedDownloadDir =
    typeof server.lastUsedDownloadDir === "string"
      ? server.lastUsedDownloadDir.trim()
      : "";
  if (lastUsedDownloadDir) {
    if (
      directoryOptions.length === 0 ||
      directoryOptions.includes(lastUsedDownloadDir)
    ) {
      downloadDir = lastUsedDownloadDir;
    }
  }

  if (!downloadDir && category && labelDirectoryMap[category]) {
    downloadDir = labelDirectoryMap[category];
  }

  return { tags, category, downloadDir };
}

/**
 * @param {{ tags?: string, category?: string, downloadDir?: string }} values
 */
export function buildLastUsedServerPatch({ tags, category, downloadDir }) {
  return {
    lastUsedTags: typeof tags === "string" ? tags : "",
    lastUsedCategory: typeof category === "string" ? category : "",
    lastUsedDownloadDir: typeof downloadDir === "string" ? downloadDir : "",
  };
}
