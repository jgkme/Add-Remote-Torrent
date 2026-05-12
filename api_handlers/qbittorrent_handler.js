import { debug } from '../debug';

// qBittorrent API Handler
// This file will contain the logic for interacting with the qBittorrent WebUI API.

/** qBittorrent v5.2+ optional Web API key (Bearer); when set, cookie login is skipped. */
function usesQbittorrentApiKey(serverConfig) {
  const k = serverConfig && serverConfig.qbittorrentApiKey;
  return typeof k === 'string' && k.trim().length > 0;
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
  const bearer = usesQbittorrentApiKey(serverConfig) ? 'bearer' : 'cookie';
  return `cfg:${url}|${username}|${bearer}`;
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
    if (usesQbittorrentApiKey(serverConfig)) {
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
    const { url, username, password, basicAuthUsername, basicAuthPassword, useBasicAuth } = serverConfig;
    const loginApiUrl = getApiUrl(url, 'auth/login');
    const serverUrlObj = new URL(url);
    const origin = `${serverUrlObj.protocol}//${serverUrlObj.host}`;
    const referer = new URL(url).href;

    const loginHeaders = {
        'Referer': referer,
        'Origin': origin,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Add basic auth header if enabled
    if (useBasicAuth && basicAuthUsername && basicAuthPassword) {
      const authString = btoa(`${basicAuthUsername}:${basicAuthPassword}`);
      loginHeaders['Authorization'] = `Basic ${authString}`;
    }

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
    if (!usesQbittorrentApiKey(serverConfig) && !bucket.isLoggedIn && !isRetry) {
      await this.login(serverConfig);
    }
    if (usesQbittorrentApiKey(serverConfig)) {
      bucket.isLoggedIn = true;
    }

    const finalOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Referer': new URL(serverConfig.url).href,
        'Origin': new URL(serverConfig.url).origin
      }
    };

    if (usesQbittorrentApiKey(serverConfig)) {
      finalOptions.headers['Authorization'] = `Bearer ${serverConfig.qbittorrentApiKey.trim()}`;
    } else if (serverConfig.useBasicAuth && serverConfig.basicAuthUsername && serverConfig.basicAuthPassword) {
      const authString = btoa(`${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`);
      finalOptions.headers['Authorization'] = `Basic ${authString}`;
    }

    const response = await fetch(apiUrl, finalOptions);

    if (response.status === 403 && !isRetry && !usesQbittorrentApiKey(serverConfig)) {
      debug.log('qBittorrent session expired (403), re-authenticating...');
      bucket.isLoggedIn = false;
      return this.fetch(apiUrl, options, serverConfig, true); // Retry once after logging in
    }

    return response;
  }
};


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
    downloadDir: torrentOptionsDownloadDir // Use alias to avoid conflict
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

  async function _resumeTorrent(hash) {
    const resumeUrl = getApiUrl(url, 'torrents/resume');
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
        
        // Throw a more specific error to be caught by the calling function
        throw new Error(`Failed to resume torrent ${hash}. Server response: ${response.statusText}`);
    }
    debug.log(`qBittorrent: Resumed torrent ${hash}`);
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

    const version = await getQbittorrentVersion(serverConfig);
    const useStopped = version.startsWith('v5.1.2') || version.startsWith('v5.1.3') || version.startsWith('v5.1.4') || version.startsWith('v5.1.5') || version.startsWith('v5.2');
    
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

    // After successful addition, find the new hash
    let newHash = null;
    try {
        // Wait a moment for the torrent to appear in the list
        await new Promise(resolve => setTimeout(resolve, 1500));
        const currentHashes = await _fetchTorrentListHashes();
        newHash = currentHashes.find(h => !initialHashes.includes(h));
    } catch (e) {
        debug.error("Failed to fetch torrent list to identify new hash:", e);
        // Return success but with a warning and no hash
        return { success: true, data: { warning: "Torrent added, but could not confirm its hash for tracking." } };
    }

    if (newHash) {
        debug.log(`qBittorrent: New torrent hash identified: ${newHash}`);
        
        try {
            if (useFileSelection) {
                const allFileIndices = Array.from({ length: totalFileCount }, (_, i) => i);
                const deselectedFileIndices = allFileIndices.filter(i => !selectedFileIndices.includes(i));

                await _setFilePriorities(newHash, deselectedFileIndices, 0);
                await _setFilePriorities(newHash, selectedFileIndices, 1);
            }

            if (!userWantsPaused) {
                try {
                    await _resumeTorrent(newHash);
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
            // Return success with the identified hash
            return { success: true, hash: newHash };
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
  return torrents.slice(0, 20).map((torrent) => ({
    hash: torrent.hash,
    name: torrent.name,
    progress: Number(torrent.progress || 0),
    state: torrent.state || "unknown",
    eta: Number(torrent.eta || 0),
    dlspeed: Number(torrent.dlspeed || 0),
    upspeed: Number(torrent.upspeed || 0),
  }));
}

export async function torrentAction(serverConfig, actionType, hash) {
  if (!hash) {
    return { success: false, error: "Missing torrent hash." };
  }
  const actionMap = {
    pause: "torrents/pause",
    resume: "torrents/resume",
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
    formData.append("deleteFiles", "false");
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

export async function testConnection(serverConfig) {
  try {
    if (usesQbittorrentApiKey(serverConfig)) {
      getQbitSessionBucket(serverConfig).isLoggedIn = true;
    } else {
      await qbitSession.login(serverConfig);
    }

    const version = await getQbittorrentVersion(serverConfig);
    const buildInfo = await getBuildInfo(serverConfig);

    return {
        success: true,
        data: {
            message: 'Authentication successful.',
            version: version,
            webApiVersion: buildInfo.webUIVersion,
            freeSpace: buildInfo.freeSpace,
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
