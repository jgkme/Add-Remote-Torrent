import { debug } from '../debug';
import { generateLocalId } from '../utils.js';

// qBittorrent API Handler
// This file will contain the logic for interacting with the qBittorrent WebUI API.

/** qBittorrent v5.2+ optional Web API key (Bearer); when set, cookie login is skipped. */
function usesQbittorrentApiKey(serverConfig) {
  const k = serverConfig && serverConfig.qbittorrentApiKey;
  return typeof k === 'string' && k.trim().length > 0;
}

/** Web API 2.15+: authenticate with HTTP Basic (qB username/password) instead of cookie login. */
function usesWebApiBasicAuth(serverConfig) {
  if (usesQbittorrentApiKey(serverConfig)) return false;
  return serverConfig?.qbittorrentAuthMode === 'basic';
}

function qbitAuthModeLabel(serverConfig) {
  if (usesQbittorrentApiKey(serverConfig)) return 'apikey';
  if (usesWebApiBasicAuth(serverConfig)) return 'basic';
  return 'cookie';
}

/**
 * Cookie login state must be per server profile. A single global session caused
 * requests to server B to skip login after server A was used → 401 and misleading
 * "API key" hints (see multi-server note in torrent-client-handler-patterns).
 */
function qbittorrentSessionKey(serverConfig) {
  if (!serverConfig) return 'unknown';
  const id = serverConfig.id;
  if (id !== undefined && id !== null && String(id).trim() !== '') {
    return `id:${String(id).trim()}`;
  }
  const url = (serverConfig.url || '').trim();
  const username = (serverConfig.username || '').trim();
  return `cfg:${url}|${username}|${qbitAuthModeLabel(serverConfig)}`;
}

/** Reverse-proxy Basic Auth (nginx, etc.) — not the same as Web API Basic (2.15+). */
function usesReverseProxyBasicAuth(serverConfig) {
  return Boolean(
    serverConfig?.useBasicAuth &&
      serverConfig.basicAuthUsername &&
      serverConfig.basicAuthPassword &&
      !usesWebApiBasicAuth(serverConfig)
  );
}

function applyQbitAuthorization(headers, serverConfig) {
  if (usesQbittorrentApiKey(serverConfig)) {
    headers['Authorization'] = `Bearer ${serverConfig.qbittorrentApiKey.trim()}`;
    return;
  }
  if (usesWebApiBasicAuth(serverConfig)) {
    const user = serverConfig.username || '';
    const pass = serverConfig.password || '';
    headers['Authorization'] = `Basic ${btoa(`${user}:${pass}`)}`;
    return;
  }
  if (usesReverseProxyBasicAuth(serverConfig)) {
    const authString = btoa(
      `${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`
    );
    headers['Authorization'] = `Basic ${authString}`;
  }
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const qbitSessionBuckets = new Map();

function getQbitSessionBucket(serverConfig) {
  const key = qbittorrentSessionKey(serverConfig);
  if (!qbitSessionBuckets.has(key)) {
    qbitSessionBuckets.set(key, { loginPromise: null, isLoggedIn: false });
  }
  return qbitSessionBuckets.get(key);
}

/**
 * Web API 2.14.0+ returns JSON with counts; legacy servers return plain "Ok." (see WebAPI_Changelog.md).
 */
function classifyTorrentsAddResponse(httpStatus, responseText) {
  const t = (responseText || '').trim();
  if (t.includes('already in the download list')) {
    return { duplicate: true };
  }
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      const isNewAddShape =
        j &&
        typeof j === 'object' &&
        ('success_count' in j ||
          'pending_count' in j ||
          'failure_count' in j ||
          'added_torrent_ids' in j);
      if (isNewAddShape) {
        const sc = Number(j.success_count);
        const pc = Number(j.pending_count);
        const fc = Number(j.failure_count);
        if (httpStatus === 409) {
          return { ok: false, reason: 'all_failed', detail: t };
        }
        if (fc > 0 && sc === 0 && pc === 0) {
          return { ok: false, reason: 'failures_only', detail: t };
        }
        if (sc > 0 || pc > 0) {
          return { ok: true, json: j };
        }
        return { ok: false, reason: 'empty_counts', detail: t };
      }
    } catch (_) {
      /* fall through to legacy */
    }
  }
  const low = t.toLowerCase();
  if (low === 'ok.' || t === '') {
    return { ok: true, legacy: true };
  }
  return { ok: false, unexpected: true, detail: t };
}

function mapQbitFlowError(error) {
  const msg = error && error.message ? error.message : String(error);
  if (/Login failed:\s*401/i.test(msg) || (/401/.test(msg) && /Login failed/i.test(msg))) {
    return {
      userMessage: 'qBittorrent rejected your username or password.',
      technicalDetail: msg,
      errorCode: 'AUTH_FAILED_QBIT',
    };
  }
  if (/Login failed/i.test(msg) || /not 'Ok\.'/.test(msg) || /Login succeeded but server returned/i.test(msg)) {
    return {
      userMessage: 'Could not log in to qBittorrent. Check credentials, CSRF settings, and the Web UI URL.',
      technicalDetail: msg,
      errorCode: 'AUTH_FAILED_QBIT',
    };
  }
  if (/Failed to get qBittorrent version:\s*401/i.test(msg)) {
    return {
      userMessage:
        'qBittorrent denied access (unauthorized) after login. Check username and password, Web UI URL, and CSRF settings. If you use multiple qBittorrent profiles, ensure each has been tested or used at least once so the extension logs in separately. Optional Web API key (5.2+) is only for setups where cookie-based API access still fails.',
      technicalDetail: msg,
      errorCode: 'AUTH_FAILED_QBIT',
    };
  }
  return {
    userMessage: 'A network error occurred or the server could not be reached during qBittorrent add.',
    technicalDetail: msg,
    errorCode: 'NETWORK_ERROR_QBIT_ADD',
  };
}

const qbitSession = {
  login: async function(serverConfig) {
    const bucket = getQbitSessionBucket(serverConfig);
    if (usesQbittorrentApiKey(serverConfig) || usesWebApiBasicAuth(serverConfig)) {
      bucket.isLoggedIn = true;
      return;
    }
    if (bucket.loginPromise) {
      await bucket.loginPromise;
      return;
    }
    bucket.loginPromise = this._performLogin(serverConfig, bucket);
    try {
      await bucket.loginPromise;
    } finally {
      bucket.loginPromise = null;
    }
  },
  _performLogin: async function(serverConfig, bucket) {
    const { url, username, password } = serverConfig;
    const loginApiUrl = getApiUrl(url, 'auth/login');
    const serverUrlObj = new URL(url);
    const origin = `${serverUrlObj.protocol}//${serverUrlObj.host}`;
    const referer = new URL(url).href;

    const loginHeaders = {
        'Referer': referer,
        'Origin': origin,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    applyQbitAuthorization(loginHeaders, serverConfig);

    const loginBodyParams = new URLSearchParams();
    loginBodyParams.append('username', username);
    loginBodyParams.append('password', password);

    const loginResp = await fetch(loginApiUrl, {
        method: 'POST',
        body: loginBodyParams.toString(),
        headers: loginHeaders,
        credentials: 'include'
    });

    if (!loginResp.ok) {
      bucket.isLoggedIn = false;
      throw new Error(`Login failed: ${loginResp.status} ${loginResp.statusText}`);
    }
    const loginTxt = await loginResp.text();
    const body = loginTxt.trim();
    const bodyOk = body.toLowerCase() === 'ok.';
    // qBittorrent 5.2+ (Web API 2.14.1+) may return 204 No Content or 200 with an empty body on
    // successful auth/login while still setting the session cookie — legacy clients returned "Ok.".
    const emptySuccessBody = body === '' && (loginResp.status === 204 || loginResp.status === 200);
    if (!bodyOk && !emptySuccessBody) {
      bucket.isLoggedIn = false;
      debug.warn(`qBit login unexpected body (HTTP ${loginResp.status}): ${loginTxt}`);
      throw new Error(`Login succeeded but server returned: ${loginTxt}`);
    }

    bucket.isLoggedIn = true;
    debug.log('qBittorrent session established.');
  },
  
  fetch: async function(apiUrl, options, serverConfig, isRetry = false) {
    const bucket = getQbitSessionBucket(serverConfig);
    if (
      !usesQbittorrentApiKey(serverConfig) &&
      !usesWebApiBasicAuth(serverConfig) &&
      !bucket.isLoggedIn &&
      !isRetry
    ) {
      await this.login(serverConfig);
    }
    if (usesQbittorrentApiKey(serverConfig) || usesWebApiBasicAuth(serverConfig)) {
      bucket.isLoggedIn = true;
    }

    const finalOptions = {
      ...options,
      credentials: usesWebApiBasicAuth(serverConfig) ? 'omit' : 'include',
      headers: {
        ...options.headers,
        'Referer': new URL(serverConfig.url).href,
        'Origin': new URL(serverConfig.url).origin
      }
    };

    applyQbitAuthorization(finalOptions.headers, serverConfig);

    const response = await fetch(apiUrl, finalOptions);

    if (
      response.status === 403 &&
      !isRetry &&
      !usesQbittorrentApiKey(serverConfig) &&
      !usesWebApiBasicAuth(serverConfig)
    ) {
      debug.log('qBittorrent session expired (403), re-authenticating...');
      bucket.isLoggedIn = false;
      return this.fetch(apiUrl, options, serverConfig, true); // Retry once after logging in
    }

    return response;
  }
};


function parseQbittorrentAppVersion(versionText) {
  const match = String(versionText || '')
    .trim()
    .match(/v?(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3] || '0', 10),
  };
}

/** qBittorrent 5.0+: Web API uses stop/start and stopped (not pause/resume). */
function qbittorrentUsesStartStopApi(versionText) {
  const parsed = parseQbittorrentAppVersion(versionText);
  if (!parsed) return false;
  return parsed.major >= 5;
}

function torrentPauseResumeApiPaths(versionText) {
  return qbittorrentUsesStartStopApi(versionText)
    ? { pause: 'torrents/stop', resume: 'torrents/start' }
    : { pause: 'torrents/pause', resume: 'torrents/resume' };
}

async function resolveQbittorrentAppVersion(serverConfig) {
  if (serverConfig?.version) {
    return String(serverConfig.version).trim();
  }
  return getQbittorrentVersion(serverConfig);
}

// Helper function to construct full API URLs for qBittorrent v2 API
function getApiUrl(baseUrl, apiPath) {
  const urlObj = new URL(baseUrl);
  const origin = urlObj.origin; // e.g., http://192.168.0.13:8081
  let pathname = urlObj.pathname; // e.g., / or /qbittorrent/

  // Normalize pathname: remove trailing slash if it's not the root itself
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  // If pathname was originally just '/', it means the API is at the root of the origin.
  // If there was no path in baseUrl, pathname is '/'.
  // We want 'origin + (meaningful_sub_path_if_any) + /api/v2/apiPath'
  
  const base = origin + (pathname === '/' ? '' : pathname); 
  return `${base}/api/v2/${apiPath}`;
}

/** @param {string} minimum e.g. "2.14.0" */
export function compareWebApiVersion(serverConfig, minimum) {
  const v = ((serverConfig && serverConfig.webApiVersion) || '').trim();
  if (!v) return false;
  const parts = (s) => s.split('.').map((n) => parseInt(n, 10) || 0);
  const a = parts(v);
  const b = parts(minimum);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai > bi) return true;
    if (ai < bi) return false;
  }
  return true;
}

function normalizeCategorySavePath(entry) {
  if (!entry || typeof entry !== 'object') return '';
  const p = entry.savePath ?? entry.save_path ?? '';
  return typeof p === 'string' ? p.trim() : '';
}

/** @returns {{ name: string, savePath: string }[]} */
export function parseCategoriesJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid categories JSON. Check the file or pasted text and try again.');
  }
  const entries = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const name = String(item.name || '').trim();
      const savePath = normalizeCategorySavePath(item);
      if (name) entries.push({ name, savePath });
    }
  } else if (data && typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const nameFromKey = String(key || '').trim();
      if (!nameFromKey) continue;
      if (typeof val === 'string') {
        entries.push({ name: nameFromKey, savePath: val.trim() });
      } else if (val && typeof val === 'object') {
        const name = String(val.name || nameFromKey).trim();
        const savePath = normalizeCategorySavePath(val);
        if (name) entries.push({ name, savePath });
      }
    }
  }
  return entries;
}

export function profileFieldsFromCategories(categories) {
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  return {
    categories: sorted.map((c) => c.name).join(', '),
    labelDirectoryMap: sorted
      .filter((c) => c.savePath)
      .map((c) => `${c.name}=${c.savePath}`)
      .join('\n'),
  };
}

async function postForm(serverConfig, apiPath, fields) {
  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) formData.append(k, String(v));
  }
  const apiUrl = getApiUrl(serverConfig.url, apiPath);
  return qbitSession.fetch(apiUrl, { method: 'POST', body: formData }, serverConfig);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function mapMetadataFiles(meta) {
  if (!meta || typeof meta !== 'object') return [];
  const info = meta.torrent_info || meta.torrentinfo || meta;
  const inner = info.info || info;
  const filesArr = inner.files || info.files || [];
  const files = [];
  if (Array.isArray(filesArr) && filesArr.length > 0) {
    filesArr.forEach((file, idx) => {
      const name =
        file.name ||
        file.file_path ||
        file.path ||
        (typeof file === 'string' ? file : '') ||
        `File ${idx}`;
      const size = Number(file.size ?? file.length ?? file.file_size ?? 0);
      files.push({ name: String(name), size, index: idx });
    });
  } else if (inner.name && typeof inner.length === 'number') {
    files.push({
      name: String(inner.name),
      size: Number(inner.length),
      index: 0,
    });
  }
  return files;
}

/**
 * Poll GET torrents/fetchMetadata (Web API 2.11.9+). 202 = still fetching; 200 = ready.
 */
export async function fetchTorrentMetadataFromSource(serverConfig, source) {
  if (!compareWebApiVersion(serverConfig, '2.11.9')) {
    return {
      success: false,
      error: {
        userMessage: 'qBittorrent metadata fetch requires Web API 2.11.9+.',
        errorCode: 'WEBAPI_VERSION_TOO_OLD',
      },
    };
  }
  const apiUrl = getApiUrl(
    serverConfig.url,
    `torrents/fetchMetadata?source=${encodeURIComponent(source)}`
  );
  const maxAttempts = 45;
  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
      if (response.status === 200) {
        const data = await response.json();
        const files = mapMetadataFiles(data);
        const cacheRef =
          data.hash && String(data.hash).trim()
            ? String(data.hash).trim()
            : source.startsWith('magnet:')
              ? source
              : null;
        return {
          success: true,
          files,
          totalFileCount: files.length,
          metadataSource: source,
          qbitMetadataCacheRef: cacheRef,
        };
      }
      if (response.status === 202) {
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            error: {
              userMessage:
                'qBittorrent is still fetching torrent metadata. Try again in a moment.',
              errorCode: 'METADATA_TIMEOUT',
            },
          };
        }
        await sleepMs(1000);
        continue;
      }
      const t = await response.text();
      throw new Error(`fetchMetadata failed: ${response.status} ${t}`);
    }
    return {
      success: false,
      error: { userMessage: 'Metadata fetch timed out.', errorCode: 'METADATA_TIMEOUT' },
    };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function rotateWebApiKey(serverConfig) {
  if (!compareWebApiVersion(serverConfig, '2.14.1')) {
    return {
      success: false,
      error: {
        userMessage: 'API key rotation requires qBittorrent Web API 2.14.1+.',
      },
    };
  }
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'app/rotateAPIKey');
    const response = await qbitSession.fetch(
      apiUrl,
      { method: 'POST' },
      serverConfig
    );
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`rotateAPIKey failed: ${response.status} ${t}`);
    }
    const key = (await response.text()).trim();
    if (!key) {
      throw new Error('rotateAPIKey returned an empty key.');
    }
    return { success: true, apiKey: key };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function deleteWebApiKeyOnServer(serverConfig) {
  if (!compareWebApiVersion(serverConfig, '2.14.1')) {
    return {
      success: false,
      error: {
        userMessage: 'API key deletion requires qBittorrent Web API 2.14.1+.',
      },
    };
  }
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'app/deleteAPIKey');
    const response = await qbitSession.fetch(
      apiUrl,
      { method: 'POST' },
      serverConfig
    );
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`deleteAPIKey failed: ${response.status} ${t}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getTransferSpeedLimits(serverConfig) {
  if (!compareWebApiVersion(serverConfig, '2.16.0')) {
    return {
      success: false,
      error: {
        userMessage: 'Global speed limits API requires Web API 2.16.0+.',
      },
    };
  }
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'transfer/getSpeedLimits');
    const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
    if (!response.ok) {
      throw new Error(`getSpeedLimits failed: ${response.status}`);
    }
    const data = await response.json();
    return {
      success: true,
      limits: {
        dlLimit: Number(data.dl_limit ?? data.dlLimit ?? 0),
        upLimit: Number(data.up_limit ?? data.upLimit ?? 0),
        altDlLimit: Number(data.alt_dl_limit ?? data.altDlLimit ?? 0),
        altUpLimit: Number(data.alt_up_limit ?? data.altUpLimit ?? 0),
      },
    };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getCategories(serverConfig) {
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'torrents/categories');
    const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
    if (!response.ok) {
      throw new Error(`Failed to get categories: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const categories = [];
    if (data && typeof data === 'object') {
      for (const [key, val] of Object.entries(data)) {
        const name = val && val.name ? String(val.name).trim() : String(key).trim();
        const savePath = normalizeCategorySavePath(val);
        if (name) categories.push({ name, savePath });
      }
    }
    return { success: true, categories };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function importCategories(serverConfig, entries, options = {}) {
  const { pushToServer = true, merge = true } = options;
  const summary = { created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
  if (!entries || entries.length === 0) {
    return { success: false, error: { userMessage: 'No categories to import.' } };
  }
  try {
    let existing = {};
    if (pushToServer) {
      const existingResp = await getCategories(serverConfig);
      if (!existingResp.success) return existingResp;
      for (const c of existingResp.categories) {
        existing[c.name] = c.savePath;
      }
    }
    if (!pushToServer) {
      const profileFields = profileFieldsFromCategories(
        entries.map((e) => ({ name: e.name, savePath: e.savePath || '' }))
      );
      return {
        success: true,
        summary: { ...summary, skipped: entries.length },
        categories: entries,
        profileFields,
      };
    }
    for (const entry of entries) {
      const name = entry.name;
      const savePath = entry.savePath || '';
      if (!existing[name]) {
        const fd = { category: name };
        if (savePath) fd.savePath = savePath;
        const resp = await postForm(serverConfig, 'torrents/createCategory', fd);
        if (resp.ok) {
          summary.created++;
          existing[name] = savePath;
        } else {
          summary.failed++;
          if (summary.errors.length < 3) {
            summary.errors.push(`${name}: create failed (${resp.status})`);
          }
        }
      } else if (merge && savePath && existing[name] !== savePath) {
        const resp = await postForm(serverConfig, 'torrents/editCategory', {
          category: name,
          savePath,
        });
        if (resp.ok) {
          summary.updated++;
          existing[name] = savePath;
        } else {
          summary.failed++;
          if (summary.errors.length < 3) {
            summary.errors.push(`${name}: edit failed (${resp.status})`);
          }
        }
      } else {
        summary.skipped++;
      }
    }
    const refreshed = await getCategories(serverConfig);
    if (!refreshed.success) return refreshed;
    return {
      success: true,
      summary,
      categories: refreshed.categories,
      profileFields: profileFieldsFromCategories(refreshed.categories),
    };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getTags(serverConfig) {
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'torrents/tags');
    const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
    if (!response.ok) {
      throw new Error(`Failed to get tags: ${response.status} ${response.statusText}`);
    }
    const tags = await response.json();
    return { success: true, tags: Array.isArray(tags) ? tags.map(String) : [] };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function syncTagsToServer(serverConfig, tagNames) {
  try {
    const existing = await getTags(serverConfig);
    if (!existing.success) return existing;
    const missing = tagNames.filter((t) => t && !existing.tags.includes(t));
    if (missing.length === 0) {
      return { success: true, tags: existing.tags, created: 0 };
    }
    const resp = await postForm(serverConfig, 'torrents/createTags', {
      tags: missing.join(','),
    });
    if (!resp.ok) {
      throw new Error(`createTags failed: ${resp.status}`);
    }
    const refreshed = await getTags(serverConfig);
    return refreshed.success
      ? { success: true, tags: refreshed.tags, created: missing.length }
      : refreshed;
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getDefaultSavePath(serverConfig) {
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'app/defaultSavePath');
    const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
    if (response.ok) {
      const path = (await response.text()).trim();
      if (path) return { success: true, savePath: path };
    }
    const mainDataUrl = getApiUrl(serverConfig.url, 'sync/maindata');
    const mainResp = await qbitSession.fetch(mainDataUrl, {}, serverConfig);
    if (mainResp.ok) {
      const mainData = await mainResp.json();
      const sp = mainData.server_state?.save_path;
      if (sp) return { success: true, savePath: String(sp) };
    }
    throw new Error('Could not determine default save path');
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getFreeSpaceAtPath(serverConfig, path) {
  if (!compareWebApiVersion(serverConfig, '2.15.2')) {
    return { success: false, error: { userMessage: 'Free space API requires Web API 2.15.2+.' } };
  }
  try {
    const apiUrl = getApiUrl(
      serverConfig.url,
      `app/getFreeSpaceAtPath?path=${encodeURIComponent(path)}`
    );
    const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
    if (!response.ok) {
      throw new Error(`getFreeSpaceAtPath failed: ${response.status}`);
    }
    const data = await response.json();
    return { success: true, freeSpace: Number(data.free_space_on_disk ?? data.freeSpace ?? 0) };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function parseTorrentMetadata(serverConfig, torrentBase64, fileName = 'file.torrent') {
  try {
    const blob = base64ToBlob(torrentBase64);
    const formData = new FormData();
    formData.append('torrents', blob, fileName);
    const apiUrl = getApiUrl(serverConfig.url, 'torrents/parseMetadata');
    const response = await qbitSession.fetch(
      apiUrl,
      { method: 'POST', body: formData },
      serverConfig
    );
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`parseMetadata failed: ${response.status} ${t}`);
    }
    const data = await response.json();
    const metaList = Array.isArray(data) ? data : [data];
    const files = mapMetadataFiles(metaList[0]);
    return { success: true, files, totalFileCount: files.length };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function fetchTorrentMetadataFromUrl(serverConfig, torrentUrl) {
  if (compareWebApiVersion(serverConfig, '2.11.9')) {
    const apiResult = await fetchTorrentMetadataFromSource(serverConfig, torrentUrl);
    if (apiResult.success) {
      return apiResult;
    }
    debug.warn(
      'qBittorrent fetchMetadata failed, falling back to browser fetch:',
      apiResult.error?.technicalDetail || apiResult.error?.userMessage
    );
  }

  try {
    const response = await fetch(torrentUrl, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Failed to fetch torrent: ${response.status}`);
    }
    const buf = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    let fileName = 'file.torrent';
    try {
      const p = new URL(torrentUrl).pathname;
      const n = p.substring(p.lastIndexOf('/') + 1);
      if (n.toLowerCase().endsWith('.torrent')) fileName = n;
    } catch (_) { /* ignore */ }
    const parsed = await parseTorrentMetadata(serverConfig, base64, fileName);
    if (parsed.success) {
      return parsed;
    }
    if (compareWebApiVersion(serverConfig, '2.11.9')) {
      const retryApi = await fetchTorrentMetadataFromSource(serverConfig, torrentUrl);
      if (retryApi.success) return retryApi;
    }
    return parsed;
  } catch (error) {
    if (compareWebApiVersion(serverConfig, '2.11.9')) {
      const lastApi = await fetchTorrentMetadataFromSource(serverConfig, torrentUrl);
      if (lastApi.success) return lastApi;
    }
    return {
      success: false,
      error: {
        userMessage: 'Could not fetch or parse torrent metadata.',
        technicalDetail: error.message,
      },
    };
  }
}

export async function getSearchPlugins(serverConfig) {
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'search/plugins');
    const response = await qbitSession.fetch(apiUrl, {}, serverConfig);
    if (!response.ok) {
      throw new Error(`search/plugins failed: ${response.status}`);
    }
    const plugins = await response.json();
    return { success: true, plugins: Array.isArray(plugins) ? plugins : [] };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

function searchJobMatchesId(job, searchId) {
  if (!job || searchId === undefined || searchId === null) return false;
  return String(job.id) === String(searchId);
}

async function fetchSearchResults(serverConfig, searchId, limit) {
  const resultsUrl = getApiUrl(
    serverConfig.url,
    `search/results?id=${searchId}&limit=${limit}&offset=${-limit}`
  );
  const resultsResp = await qbitSession.fetch(resultsUrl, {}, serverConfig);
  if (!resultsResp.ok) {
    const t = await resultsResp.text();
    throw new Error(`search/results failed: ${resultsResp.status} ${t}`);
  }
  const resultsData = await resultsResp.json();
  const raw = resultsData.results || [];
  return raw
    .map((r) => ({
      title: r.fileName || 'Unknown',
      link: r.fileUrl || '',
      seeders: r.nbSeeders ?? null,
      size: r.fileSize >= 0 ? r.fileSize : null,
      descrLink: r.descrLink,
      siteUrl: r.siteUrl,
    }))
    .filter((r) => r.link);
}

export async function searchTorrentsQbit(serverConfig, options = {}) {
  const {
    pattern,
    plugins = 'enabled',
    category = 'all',
    limit = 20,
  } = options;
  let searchId = null;
  try {
    const startResp = await postForm(serverConfig, 'search/start', {
      pattern,
      plugins,
      category,
    });
    if (startResp.status === 409) {
      return {
        success: false,
        error: {
          userMessage:
            'qBittorrent has too many searches running. Stop some in the Search tab and try again.',
        },
      };
    }
    if (!startResp.ok) {
      const t = await startResp.text();
      throw new Error(`search/start failed: ${startResp.status} ${t}`);
    }
    const startData = await startResp.json();
    searchId = startData.id;
    if (searchId === undefined || searchId === null) {
      throw new Error('search/start returned no job id');
    }

    const deadline = Date.now() + 20000;
    let status = 'Running';
    let timedOut = false;
    while (Date.now() < deadline) {
      const statusUrl = getApiUrl(serverConfig.url, `search/status?id=${searchId}`);
      const statusResp = await qbitSession.fetch(statusUrl, {}, serverConfig);
      if (statusResp.ok) {
        const statusData = await statusResp.json();
        const job = Array.isArray(statusData)
          ? statusData.find((j) => searchJobMatchesId(j, searchId)) || statusData[0]
          : statusData;
        status = job?.status || status;
        if (status === 'Stopped') break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    if (status !== 'Stopped') {
      timedOut = true;
    }

    const results = await fetchSearchResults(serverConfig, searchId, limit);
    if (timedOut && results.length === 0) {
      return {
        success: false,
        error: {
          userMessage:
            'qBittorrent search is still running or returned no results yet. Try again or narrow your query.',
        },
        status,
        timedOut: true,
      };
    }

    return { success: true, results, status, timedOut: timedOut || undefined };
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    return {
      success: false,
      error: {
        userMessage:
          'qBittorrent search failed. Enable Search (Python 3) and install plugins in qBittorrent Preferences → Search.',
        technicalDetail: msg,
      },
    };
  } finally {
    if (searchId !== null) {
      try {
        await postForm(serverConfig, 'search/delete', { id: searchId });
      } catch (e) {
        debug.warn('search/delete failed:', e);
      }
    }
  }
}

async function resolveHashAfterAdd(serverConfig, classified, initialHashes, fetchTorrentListHashes) {
  const pending = Number(classified.json?.pending_count || 0) > 0;
  const ids = (classified.json?.added_torrent_ids || []).map(String);

  if (compareWebApiVersion(serverConfig, '2.14.0') && ids.length > 0) {
    const maxAttempts = pending ? 20 : 8;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const torrentsInfoUrl = getApiUrl(serverConfig.url, 'torrents/info');
      const response = await qbitSession.fetch(torrentsInfoUrl, {}, serverConfig);
      if (response.ok) {
        const torrents = await response.json();
        for (const id of ids) {
          const idLow = id.toLowerCase();
          const found = torrents.find(
            (t) =>
              (t.hash && t.hash.toLowerCase() === idLow) ||
              (t.infohash_v2 && String(t.infohash_v2).toLowerCase() === idLow) ||
              (t.infohash_v1 && String(t.infohash_v1).toLowerCase() === idLow)
          );
          if (found) return found.hash;
        }
      }
      if (!pending && attempt >= 2) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const maxAttempts = pending ? 20 : 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) =>
      setTimeout(r, pending ? 500 : attempt === 0 ? 800 : 400)
    );
    const currentHashes = await fetchTorrentListHashes();
    const newHash = currentHashes.find((h) => !initialHashes.includes(h));
    if (newHash) return newHash;
  }
  return null;
}

function buildFilePrioritiesParam(totalFileCount, selectedFileIndices) {
  const selected = new Set(selectedFileIndices);
  const priorities = [];
  for (let i = 0; i < totalFileCount; i++) {
    priorities.push(selected.has(i) ? '1' : '0');
  }
  return priorities.join(',');
}

async function getQbittorrentVersion(serverConfig) {
    const versionApiUrl = getApiUrl(serverConfig.url, 'app/version');
    const response = await qbitSession.fetch(versionApiUrl, {}, serverConfig);

    if (!response.ok) {
        throw new Error(`Failed to get qBittorrent version: ${response.status} ${response.statusText}`);
    }

    const version = await response.text();
    return version.trim();
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
  // serverConfig: { url, username, password, clientType, qbittorrentSavePath, ... }
  // torrentOptions: { downloadDir, paused, tags, category, labels, selectedFileIndices, totalFileCount }

  const { url, username, password, qbittorrentSavePath } = serverConfig; // serverConfig.url is the full base URL entered by user
  const { 
    paused: userWantsPaused, 
    tags, 
    category, 
    selectedFileIndices, 
    totalFileCount,
    torrentFileContentBase64, 
    originalTorrentUrl,
    localFileName,
    forceStart,
    downloadDir: torrentOptionsDownloadDir,
    skipChecking,
    sequentialDownload,
    firstLastPiecePrio,
    rename,
  } = torrentOptions;

  // Determine the final save path. Priority:
  // 1. Path from torrentOptions (e.g., advanced dialog, tracker rule)
  // 2. Default path from server config
  const finalDownloadDir = torrentOptionsDownloadDir || qbittorrentSavePath;

  async function _fetchTorrentListHashes() {
    const torrentsInfoUrl = getApiUrl(serverConfig.url, 'torrents/info');
    const response = await qbitSession.fetch(torrentsInfoUrl, {}, serverConfig);
    if (!response.ok) throw new Error(`Failed to fetch torrent list: ${response.status} ${response.statusText}. URL: ${torrentsInfoUrl}`);
    const torrents = await response.json();
    return torrents.map(t => t.hash);
  }

  async function _setFilePriorities(hash, fileIndices, priority) {
    if (!fileIndices || fileIndices.length === 0) return true; 
    const setPrioUrl = getApiUrl(url, 'torrents/filePrio');
    const formData = new FormData(); 
    formData.append('hash', hash);
    formData.append('id', fileIndices.join('|'));
    formData.append('priority', String(priority));
    
    const response = await qbitSession.fetch(setPrioUrl, { method: 'POST', body: formData }, serverConfig);
    if (!response.ok) {
        const errorText = await response.text();
        debug.error(`Failed to set file priorities for hash ${hash}, indices ${fileIndices.join(',')}, priority ${priority}. Server response: ${errorText}`);
        throw new Error(`Failed to set file priorities. Status: ${response.status}`);
    }
    debug.log(`qBittorrent: Set priority ${priority} for files ${fileIndices.join(',')} of torrent ${hash}`);
    return response.ok;
  }

  async function _resumeTorrent(hash, appVersion) {
    const { resume: resumePath } = torrentPauseResumeApiPaths(appVersion);
    const resumeUrl = getApiUrl(url, resumePath);
    const formData = new FormData();
    formData.append('hashes', hash);

    const response = await qbitSession.fetch(resumeUrl, { method: 'POST', body: formData }, serverConfig);

    if (!response.ok) {
        const errorText = await response.text();
        debug.error(`Failed to resume torrent ${hash}. Server response: ${errorText}`);
        
        // Handle specific error cases
        if (response.status === 404 || errorText.includes('Not Found')) {
            throw new Error(`Torrent with hash ${hash} not found on server. It may have been removed or the hash is incorrect.`);
        }
        
        throw new Error(
          `Failed to resume torrent ${hash}. Server response: ${errorText || response.statusText}`
        );
    }
    debug.log(`qBittorrent: Resumed torrent ${hash} via ${resumePath}`);
    return response.ok;
  }

  async function _setForceStart(hash, value) {
    const forceStartUrl = getApiUrl(url, 'torrents/setForceStart');
    const formData = new FormData();
    formData.append('hashes', hash);
    formData.append('value', value ? 'true' : 'false');
    const response = await qbitSession.fetch(forceStartUrl, { method: 'POST', body: formData }, serverConfig);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set force start for ${hash}: ${response.status} ${errorText}`);
    }
  }

  try {
    const isMagnet = torrentUrl.startsWith('magnet:'); 
    const useFileSelection = !isMagnet && typeof totalFileCount === 'number' && totalFileCount > 0 && Array.isArray(selectedFileIndices);
    
    // Always fetch initial hashes to identify the new one later.
    const initialHashes = await _fetchTorrentListHashes();

    const addTorrentFormData = new FormData();

    if (torrentFileContentBase64) {
        debug.log("qBittorrent: Adding torrent using file content.");
        try {
            const blob = base64ToBlob(torrentFileContentBase64);
            let fileName = localFileName || 'file.torrent';
            if (originalTorrentUrl) {
                try {
                    const urlPath = new URL(originalTorrentUrl).pathname;
                    const nameFromPath = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                    if (nameFromPath && nameFromPath.toLowerCase().endsWith('.torrent')) {
                        fileName = nameFromPath;
                    }
                } catch (e) { /* ignore */ }
            }
            addTorrentFormData.append('torrents', blob, fileName);
        } catch (e) {
            debug.error("Error creating Blob from base64 content:", e);
            addTorrentFormData.append('urls', originalTorrentUrl);
        }
    } else {
        debug.log("qBittorrent: Adding torrent using URL:", originalTorrentUrl);
        addTorrentFormData.append('urls', originalTorrentUrl);
    }

    if (tags) addTorrentFormData.append('tags', tags);
    if (category) {
        addTorrentFormData.append('category', category);
        addTorrentFormData.append('autoTMM', 'true');
    }
    if (finalDownloadDir) addTorrentFormData.append('savepath', finalDownloadDir);
    if (forceStart) {
        addTorrentFormData.append('forced', 'true');
        addTorrentFormData.append('forceStart', 'true');
    }

    if (torrentOptions.contentLayout && torrentOptions.contentLayout !== 'Original') {
        addTorrentFormData.append('contentLayout', torrentOptions.contentLayout);
        if (torrentOptions.contentLayout === 'Subfolder') {
            addTorrentFormData.append('root_folder', "true");
        } else if (torrentOptions.contentLayout === 'NoSubfolder') {
            addTorrentFormData.append('root_folder', "false");
        }
    }

    if (skipChecking) addTorrentFormData.append('skip_checking', 'true');
    if (sequentialDownload) addTorrentFormData.append('sequentialDownload', 'true');
    if (firstLastPiecePrio) addTorrentFormData.append('firstLastPiecePrio', 'true');
    if (rename && String(rename).trim()) addTorrentFormData.append('rename', String(rename).trim());

    let usedAddTimeFilePriorities = false;
    if (
      useFileSelection &&
      torrentFileContentBase64 &&
      compareWebApiVersion(serverConfig, '2.11.9')
    ) {
      const prioStr = buildFilePrioritiesParam(totalFileCount, selectedFileIndices);
      addTorrentFormData.append('filePriorities', prioStr);
      usedAddTimeFilePriorities = true;
    }

    const version = await getQbittorrentVersion(serverConfig);
    const useStopped = qbittorrentUsesStartStopApi(version);
    
    if (useFileSelection || userWantsPaused) {
        addTorrentFormData.append(useStopped ? 'stopped' : 'paused', 'true');
    }

    debug.log(`qBittorrent: Adding torrent. Paused: ${userWantsPaused}. File selection active: ${useFileSelection}. Save Path: ${finalDownloadDir || 'default'}`);

    const addTorrentApiUrl = getApiUrl(serverConfig.url, 'torrents/add');
    const addResponse = await qbitSession.fetch(addTorrentApiUrl, { method: 'POST', body: addTorrentFormData }, serverConfig);
    const addResponseText = await addResponse.text();

    const classified = classifyTorrentsAddResponse(addResponse.status, addResponseText);
    if (classified.duplicate) {
        debug.log('qBittorrent: Torrent is already in the download list.');
        return { success: true, duplicate: true, data: { message: 'Torrent is already in the download list.' } };
    }

    if (!addResponse.ok) {
        return { success: false, error: { userMessage: "Failed to add torrent to qBittorrent.", technicalDetail: `Add torrent API returned: ${addResponse.status} ${addResponse.statusText}. Response: ${addResponseText}`, errorCode: "ADD_FAILED" }};
    }

    if (!classified.ok) {
        if (classified.unexpected) {
            return { success: false, error: { userMessage: "Torrent submitted, but server gave an unexpected response.", technicalDetail: `qBittorrent add response: ${classified.detail || addResponseText}`, errorCode: "UNEXPECTED_RESPONSE" } };
        }
        return { success: false, error: { userMessage: "Failed to add torrent to qBittorrent.", technicalDetail: classified.detail || addResponseText, errorCode: "ADD_FAILED" } };
    }

    let newHash = null;
    let pendingWarning = null;
    try {
        if (classified.json && Number(classified.json.pending_count) > 0) {
            pendingWarning = 'Torrent add is still pending on the server.';
        }
        newHash = await resolveHashAfterAdd(
          serverConfig,
          classified,
          initialHashes,
          _fetchTorrentListHashes
        );
    } catch (e) {
        debug.error("Failed to fetch torrent list to identify new hash:", e);
        return {
          success: true,
          data: { warning: "Torrent added, but could not confirm its hash for tracking." },
        };
    }

    if (newHash) {
        debug.log(`qBittorrent: New torrent hash identified: ${newHash}`);
        
        try {
            if (useFileSelection && !usedAddTimeFilePriorities) {
                const allFileIndices = Array.from({ length: totalFileCount }, (_, i) => i);
                const deselectedFileIndices = allFileIndices.filter(i => !selectedFileIndices.includes(i));

                await _setFilePriorities(newHash, deselectedFileIndices, 0);
                await _setFilePriorities(newHash, selectedFileIndices, 1);
            }

            if (!userWantsPaused) {
                try {
                    await _resumeTorrent(newHash, version);
                } catch (resumeError) {
                    debug.warn(`qBittorrent: Failed to resume torrent ${newHash}, but torrent was added successfully. Error: ${resumeError.message}`);
                    // Don't throw here - just log the warning and continue
                }
            }
            if (forceStart) {
                try {
                    await _setForceStart(newHash, true);
                } catch (forceError) {
                    debug.warn(`qBittorrent: Failed to set force start for ${newHash}: ${forceError.message}`);
                }
            }
            return {
              success: true,
              hash: newHash,
              data: pendingWarning ? { warning: pendingWarning } : undefined,
            };
        } catch (postAddError) {
            debug.error(`qBittorrent: Error during post-add operations for hash ${newHash}:`, postAddError);
            // Return success since the torrent was added, but with a warning about post-add operations
            return { 
                success: true, 
                hash: newHash,
                data: { 
                    warning: `Torrent added successfully, but there was an error with post-add operations: ${postAddError.message}` 
                } 
            };
        }
    } else {
        debug.warn("qBittorrent: Could not identify hash of newly added torrent. File priorities not set. Torrent added with default priorities and effective paused state:", userWantsPaused);
        return { success: true, data: { warning: "Torrent added, but file priorities might not have been set due to hash identification failure."} };
    }

  } catch (error) {
    debug.error('Error in qBittorrent addTorrent flow:', error);
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getTorrentsInfo(serverConfig, hashes) {
  if (!hashes || hashes.length === 0) {
    return [];
  }

  const torrentsInfoUrl = getApiUrl(serverConfig.url, `torrents/info?hashes=${hashes.join('|')}`);
  const response = await qbitSession.fetch(torrentsInfoUrl, {}, serverConfig);

  if (!response.ok) {
    throw new Error(`Failed to get torrents info: ${response.status} ${response.statusText}`);
  }

  const torrents = await response.json();
  
  // Map to the standardized format expected by background.js
  return torrents.map(torrent => ({
    hash: torrent.hash,
    name: torrent.name,
    progress: torrent.progress, // progress is 0-1 float
    isCompleted: torrent.progress >= 1 || torrent.state === 'uploading' || torrent.state === 'pausedUP' || torrent.state === 'checkingUP' || torrent.state === 'forcedUP'
  }));
}

export async function getActiveTorrents(serverConfig) {
  const torrentsInfoUrl = getApiUrl(serverConfig.url, "torrents/info");
  const response = await qbitSession.fetch(torrentsInfoUrl, {}, serverConfig);
  if (!response.ok) {
    throw new Error(`Failed to list torrents: ${response.status} ${response.statusText}`);
  }
  const torrents = await response.json();
  return torrents.map((torrent) => ({
    hash: torrent.hash,
    name: torrent.name,
    progress: Number(torrent.progress || 0),
    state: torrent.state || "unknown",
    eta: Number(torrent.eta || 0),
    dlspeed: Number(torrent.dlspeed || 0),
    upspeed: Number(torrent.upspeed || 0),
    added_on: Number(torrent.added_on || 0),
  }));
}

export async function torrentAction(serverConfig, actionType, hash) {
  if (!hash) {
    return { success: false, error: "Missing torrent hash." };
  }
  const appVersion = await resolveQbittorrentAppVersion(serverConfig);
  const pauseResumePaths = torrentPauseResumeApiPaths(appVersion);
  const actionMap = {
    pause: pauseResumePaths.pause,
    resume: pauseResumePaths.resume,
    delete: "torrents/delete",
  };
  const apiPath = actionMap[actionType];
  if (!apiPath) {
    return { success: false, error: `Unsupported action: ${actionType}` };
  }
  const apiUrl = getApiUrl(serverConfig.url, apiPath);
  const formData = new FormData();
  formData.append("hashes", hash);
  if (actionType === "delete") {
    formData.append("deleteFiles", serverConfig.deleteTorrentWithFiles ? "true" : "false");
  }
  const response = await qbitSession.fetch(
    apiUrl,
    { method: "POST", body: formData },
    serverConfig
  );
  if (!response.ok) {
    return { success: false, error: `Action failed: ${response.status} ${response.statusText}` };
  }
  return { success: true };
}

function base64ToBlob(base64, type = 'application/x-bittorrent') {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], {type});
  } catch (e) {
    debug.error("base64ToBlob conversion error:", e);
    throw e; 
  }
}

async function getBuildInfo(serverConfig) {
    const buildInfoUrl = getApiUrl(serverConfig.url, 'app/buildInfo');
    const webUIVersionUrl = getApiUrl(serverConfig.url, 'app/webapiVersion');
    const mainDataUrl = getApiUrl(serverConfig.url, 'sync/maindata');

    // Use Promise.all to fetch non-dependent resources concurrently
    const [buildInfoResp, webUIVersionResp, mainDataResp] = await Promise.all([
        qbitSession.fetch(buildInfoUrl, {}, serverConfig),
        qbitSession.fetch(webUIVersionUrl, {}, serverConfig),
        qbitSession.fetch(mainDataUrl, {}, serverConfig)
    ]);

    if (!buildInfoResp.ok || !webUIVersionResp.ok || !mainDataResp.ok) {
        debug.warn('Could not fetch all build info details after authentication.');
        // Attempt to return partial data if some requests succeeded
        const buildInfo = buildInfoResp.ok ? await buildInfoResp.json() : {};
        const webUIVersion = webUIVersionResp.ok ? await webUIVersionResp.text() : '';
        const mainData = mainDataResp.ok ? await mainDataResp.json() : {};
        const serverState = mainData.server_state || {};
        return {
            qtVersion: buildInfo.qt,
            libtorrentVersion: buildInfo.libtorrent,
            boostVersion: buildInfo.boost,
            opensslVersion: buildInfo.openssl,
            zlibVersion: buildInfo.zlib,
            webUIVersion: webUIVersion.trim(),
            freeSpace: serverState.free_space_on_disk,
            dl_info_speed: serverState.dl_info_speed,
            up_info_speed: serverState.up_info_speed,
            total_torrents: mainData.torrents ? Object.keys(mainData.torrents).length : 0,
        };
    }

    const buildInfo = await buildInfoResp.json();
    const webUIVersion = await webUIVersionResp.text();
    const mainData = await mainDataResp.json();

    const serverState = mainData.server_state || {};

    debug.log('qBittorrent getBuildInfo - serverState:', serverState);
    debug.log('qBittorrent getBuildInfo - mainData.torrents count:', mainData.torrents ? Object.keys(mainData.torrents).length : 'no torrents object');

    return {
        qtVersion: buildInfo.qt,
        libtorrentVersion: buildInfo.libtorrent,
        boostVersion: buildInfo.boost,
        opensslVersion: buildInfo.openssl,
        zlibVersion: buildInfo.zlib,
        webUIVersion: webUIVersion.trim(),
        freeSpace: serverState.free_space_on_disk,
        dl_info_speed: serverState.dl_info_speed,
        up_info_speed: serverState.up_info_speed,
        total_torrents: mainData.torrents ? Object.keys(mainData.torrents).length : 0,
    };
}

function normalizeRssFeedUrl(url) {
  try {
    const u = new URL(String(url).trim());
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch (_) {
    return String(url || '').trim();
  }
}

function isQbitRssFeedNode(value) {
  if (typeof value === 'string') return /^https?:\/\//i.test(value.trim());
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value) && typeof value.url === 'string'
  );
}

function normalizeQbitRssFeedNode(value) {
  if (typeof value === 'string') {
    return { url: value.trim(), articles: [] };
  }
  return {
    url: String(value.url || '').trim(),
    title: value.title,
    uid: value.uid,
    isLoading: !!value.isLoading,
    hasError: !!value.hasError,
    articles: Array.isArray(value.articles) ? value.articles : [],
  };
}

function parseQbitArticleDate(dateStr) {
  if (!dateStr) return 0;
  const t = Date.parse(dateStr);
  return Number.isFinite(t) ? t : 0;
}

function normalizeQbitRssArticles(articles, feedPath, feedUrl) {
  return (articles || [])
    .map((article) => {
      const torrentURL = String(article.torrentURL || article.torrentUrl || '').trim();
      const link = String(article.link || '').trim();
      return {
        id: String(article.id || ''),
        title: String(article.title || '(no title)'),
        date: article.date || '',
        torrentURL,
        link,
        downloadUrl: torrentURL || link,
        isRead: !!article.isRead,
        author: String(article.author || ''),
        description: String(article.description || ''),
        feedPath,
        feedUrl,
      };
    })
    .sort((a, b) => parseQbitArticleDate(b.date) - parseQbitArticleDate(a.date));
}

/** Flatten qBittorrent `rss/items` tree (folders = nested objects, feeds = URL or feed objects). */
export function flattenQbitRssItems(node, pathParts = []) {
  const feeds = [];
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return feeds;
  }
  for (const [key, value] of Object.entries(node)) {
    if (isQbitRssFeedNode(value)) {
      const feed = normalizeQbitRssFeedNode(value);
      const itemPath = [...pathParts, key].join('\\');
      feeds.push({ url: feed.url, itemPath, name: key });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      feeds.push(...flattenQbitRssItems(value, [...pathParts, key]));
    }
  }
  return feeds;
}

/** Parse `rss/items?withData=true` into feeds with articles for the RSS viewer. */
export function parseQbitRssViewerFeeds(node, pathParts = []) {
  const feeds = [];
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return feeds;
  }
  for (const [name, value] of Object.entries(node)) {
    const itemPath = [...pathParts, name].join('\\');
    if (isQbitRssFeedNode(value)) {
      const feed = normalizeQbitRssFeedNode(value);
      feeds.push({
        name,
        itemPath,
        url: feed.url,
        title: feed.title || name,
        isLoading: feed.isLoading,
        hasError: feed.hasError,
        unreadCount: feed.articles.filter((a) => !a.isRead).length,
        articles: normalizeQbitRssArticles(feed.articles, itemPath, feed.url),
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      feeds.push(...parseQbitRssViewerFeeds(value, [...pathParts, name]));
    }
  }
  return feeds;
}

export function buildQbitRssTreeNodes(node, pathParts = []) {
  const nodes = [];
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return nodes;
  }
  for (const [name, value] of Object.entries(node)) {
    const itemPath = [...pathParts, name].join('\\');
    if (isQbitRssFeedNode(value)) {
      const feed = normalizeQbitRssFeedNode(value);
      const unread = feed.articles.filter((a) => !a.isRead).length;
      nodes.push({
        type: 'feed',
        name,
        itemPath,
        url: feed.url,
        unreadCount: unread,
        isLoading: feed.isLoading,
        hasError: feed.hasError,
      });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      nodes.push({
        type: 'folder',
        name,
        itemPath,
        children: buildQbitRssTreeNodes(value, [...pathParts, name]),
      });
    }
  }
  return nodes;
}

/** Map qBittorrent RSS auto-download rules to an extension regex filter (best-effort). */
export function patternFromQbitRssRules(feedUrl, rules) {
  const normalizedFeed = normalizeRssFeedUrl(feedUrl);
  const parts = [];
  for (const rule of Object.values(rules || {})) {
    if (!rule || rule.enabled === false) continue;
    const affected = rule.affectedFeeds || [];
    const matchesFeed = affected.some((f) => {
      const af = String(f).trim();
      if (!af) return false;
      if (af === feedUrl || normalizeRssFeedUrl(af) === normalizedFeed) return true;
      return normalizedFeed.includes(af) || af.includes(normalizedFeed);
    });
    if (!matchesFeed) continue;
    const mustContain = String(rule.mustContain || '').trim();
    if (!mustContain) continue;
    if (rule.useRegex) {
      parts.push(mustContain);
    } else {
      const escaped = mustContain.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      parts.push(escaped);
    }
  }
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.map((p) => `(?:${p})`).join('|');
}

export function mergeExtensionRssFeeds(existingFeeds, incomingFeeds, options = {}) {
  const { serverId, merge = true } = options;
  const byUrl = new Map();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const feed of existingFeeds || []) {
    if (feed?.url) {
      byUrl.set(normalizeRssFeedUrl(feed.url), { ...feed });
    }
  }

  for (const imp of incomingFeeds || []) {
    if (!imp?.url) continue;
    const key = normalizeRssFeedUrl(imp.url);
    const existing = byUrl.get(key);
    if (existing) {
      if (!merge) {
        skipped += 1;
        continue;
      }
      const next = {
        ...existing,
        serverId: serverId || existing.serverId,
        qbitItemPath: imp.qbitItemPath ?? existing.qbitItemPath,
        qbitSourceServerId: serverId || existing.qbitSourceServerId,
      };
      if (imp.pattern) {
        next.pattern = imp.pattern;
      }
      byUrl.set(key, next);
      updated += 1;
    } else {
      byUrl.set(key, {
        id: generateLocalId('feed'),
        url: imp.url,
        pattern: imp.pattern || '',
        serverId: serverId || undefined,
        qbitItemPath: imp.qbitItemPath,
        qbitSourceServerId: serverId,
      });
      added += 1;
    }
  }

  return {
    feeds: Array.from(byUrl.values()),
    added,
    updated,
    skipped,
  };
}

export async function getRssItems(serverConfig, withData = false) {
  try {
    let apiUrl = getApiUrl(serverConfig.url, 'rss/items');
    if (withData) {
      apiUrl += apiUrl.includes('?') ? '&withData=true' : '?withData=true';
    }
    const response = await qbitSession.fetch(apiUrl, { method: 'GET' }, serverConfig);
    if (!response.ok) {
      const hint =
        response.status === 404
          ? 'RSS may be unavailable on this qBittorrent build. Enable RSS in qBittorrent and add at least one feed.'
          : `Failed to read RSS feeds: ${response.status} ${response.statusText}`;
      throw new Error(hint);
    }
    const data = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: true, items: {} };
    }
    return { success: true, items: data };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getRssRules(serverConfig) {
  try {
    const apiUrl = getApiUrl(serverConfig.url, 'rss/rules');
    const response = await qbitSession.fetch(apiUrl, { method: 'GET' }, serverConfig);
    if (!response.ok) {
      throw new Error(`Failed to read RSS rules: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return { success: true, rules: data && typeof data === 'object' ? data : {} };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getRssFeedsForImport(serverConfig) {
  const itemsResp = await getRssItems(serverConfig, false);
  if (!itemsResp.success) return itemsResp;
  const rulesResp = await getRssRules(serverConfig);
  const rules = rulesResp.success ? rulesResp.rules : {};
  const flat = flattenQbitRssItems(itemsResp.items);
  const feeds = flat.map((entry) => ({
    url: entry.url,
    pattern: patternFromQbitRssRules(entry.url, rules),
    qbitItemPath: entry.itemPath,
  }));
  return { success: true, feeds, rulesAvailable: rulesResp.success };
}

export async function importRssFeedsFromQbit(serverConfig, existingFeeds = [], options = {}) {
  const { merge = true, assignServerId } = options;
  const pull = await getRssFeedsForImport(serverConfig);
  if (!pull.success) return pull;
  const merged = mergeExtensionRssFeeds(existingFeeds, pull.feeds, {
    serverId: assignServerId,
    merge,
  });
  return {
    success: true,
    feeds: merged.feeds,
    added: merged.added,
    updated: merged.updated,
    skipped: merged.skipped,
    importedFromQbit: pull.feeds.length,
    rulesAvailable: pull.rulesAvailable,
  };
}

export async function getRssViewerData(serverConfig) {
  const itemsResp = await getRssItems(serverConfig, true);
  if (!itemsResp.success) return itemsResp;
  const rulesResp = await getRssRules(serverConfig);
  const feeds = parseQbitRssViewerFeeds(itemsResp.items);
  const tree = buildQbitRssTreeNodes(itemsResp.items);
  const rules = [];
  if (rulesResp.success && rulesResp.rules) {
    for (const [name, def] of Object.entries(rulesResp.rules)) {
      rules.push({ name, ...(def && typeof def === 'object' ? def : {}) });
    }
    rules.sort((a, b) => a.name.localeCompare(b.name));
  }
  return {
    success: true,
    feeds,
    tree,
    rules,
    rulesAvailable: rulesResp.success,
    articleCount: feeds.reduce((n, f) => n + f.articles.length, 0),
  };
}

export async function refreshRssItem(serverConfig, itemPath) {
  if (!itemPath) {
    return { success: false, error: { userMessage: 'Missing RSS item path.' } };
  }
  try {
    const response = await postForm(serverConfig, 'rss/refreshItem', { itemPath });
    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status} ${response.statusText}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function markRssAsRead(serverConfig, itemPath, articleId) {
  if (!itemPath) {
    return { success: false, error: { userMessage: 'Missing RSS item path.' } };
  }
  try {
    const fields = { itemPath };
    if (articleId) fields.articleId = articleId;
    const response = await postForm(serverConfig, 'rss/markAsRead', fields);
    if (!response.ok) {
      throw new Error(`Mark as read failed: ${response.status} ${response.statusText}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function setRssRule(serverConfig, ruleName, ruleDef) {
  if (!ruleName || !ruleDef) {
    return { success: false, error: { userMessage: 'Rule name and definition are required.' } };
  }
  try {
    const response = await postForm(serverConfig, 'rss/setRule', {
      ruleName,
      ruleDef: JSON.stringify(ruleDef),
    });
    if (!response.ok) {
      throw new Error(`Save rule failed: ${response.status} ${response.statusText}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function removeRssRule(serverConfig, ruleName) {
  if (!ruleName) {
    return { success: false, error: { userMessage: 'Rule name is required.' } };
  }
  try {
    const response = await postForm(serverConfig, 'rss/removeRule', { ruleName });
    if (!response.ok) {
      throw new Error(`Remove rule failed: ${response.status} ${response.statusText}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function getRssMatchingArticles(serverConfig, ruleName) {
  if (!ruleName) {
    return { success: false, error: { userMessage: 'Rule name is required.' } };
  }
  try {
    const apiUrl = `${getApiUrl(serverConfig.url, 'rss/matchingArticles')}?ruleName=${encodeURIComponent(ruleName)}`;
    const response = await qbitSession.fetch(apiUrl, { method: 'GET' }, serverConfig);
    if (!response.ok) {
      throw new Error(`Matching articles failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return { success: true, matches: data && typeof data === 'object' ? data : {} };
  } catch (error) {
    return { success: false, error: mapQbitFlowError(error) };
  }
}

export async function testConnection(serverConfig) {
  try {
    if (usesQbittorrentApiKey(serverConfig)) {
      getQbitSessionBucket(serverConfig).isLoggedIn = true;
    } else {
      await qbitSession.login(serverConfig);
    }

    const version = await getQbittorrentVersion(serverConfig);
    const buildInfo = await getBuildInfo(serverConfig);

    let categoryCount = null;
    try {
      const cats = await getCategories(serverConfig);
      if (cats.success) categoryCount = cats.categories.length;
    } catch (_) { /* non-fatal */ }

    let globalSpeedLimits = null;
    const limitsResult = await getTransferSpeedLimits(serverConfig);
    if (limitsResult.success) {
      globalSpeedLimits = limitsResult.limits;
    }

    const authMode = qbitAuthModeLabel(serverConfig);

    return {
        success: true,
        data: {
            message: 'Authentication successful.',
            version: version,
            webApiVersion: buildInfo.webUIVersion,
            freeSpace: buildInfo.freeSpace,
            categoryCount,
            authMode,
            globalSpeedLimits,
            torrentsInfo: {
                total: buildInfo.total_torrents,
                downloadSpeed: buildInfo.dl_info_speed,
                uploadSpeed: buildInfo.up_info_speed,
            }
        }
    };
  } catch (error) {
    debug.error('[qBittorrent Handler] testConnection failed:', error);
    getQbitSessionBucket(serverConfig).isLoggedIn = false;
    const msg = error && error.message ? error.message : String(error);
    let userMessage = "Connection failed. Check URL, credentials, and network. For qBittorrent v4.3.0+, consider disabling 'CSRF Protection' in WebUI options.";
    if (/Login failed:\s*401/i.test(msg) || (/401/.test(msg) && /Login failed/i.test(msg))) {
      userMessage = 'Connection failed: qBittorrent rejected the username or password (HTTP 401).';
    } else if (/Failed to get qBittorrent version:\s*401/i.test(msg)) {
      userMessage =
        'Connection failed: unauthorized when calling the API after login. Verify username/password, CSRF settings, and Web UI URL. Optional Web API key (qBittorrent 5.2+) is only for setups where cookie-based login cannot reach the API.';
    }
    return { 
      success: false, 
      error: {
        userMessage,
        technicalDetail: msg,
        errorCode: "CONNECTION_TEST_FAILED"
      }
    };
  }
}
