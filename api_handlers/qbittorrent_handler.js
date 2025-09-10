import { debug } from '../debug';

// qBittorrent API Handler
// This file will contain the logic for interacting with the qBittorrent WebUI API.

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
    const { url, username, password } = serverConfig;
    const versionApiUrl = getApiUrl(url, 'app/version');
    const loginApiUrl = getApiUrl(url, 'auth/login');
    const serverUrlObj = new URL(url);
    const origin = `${serverUrlObj.protocol}//${serverUrlObj.host}`;
    const referer = new URL(url).href;

    const loginHeaders = {
        'Referer': referer,
        'Origin': origin,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

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
        throw new Error(`Login failed: ${loginResp.status} ${loginResp.statusText}`);
    }

    const response = await fetch(versionApiUrl, {
        headers: {
            'Referer': referer,
            'Origin': origin
        },
        credentials: 'include'
    });

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
    downloadDir: torrentOptionsDownloadDir // Use alias to avoid conflict
  } = torrentOptions;

  // Determine the final save path. Priority:
  // 1. Path from torrentOptions (e.g., advanced dialog, tracker rule)
  // 2. Default path from server config
  const finalDownloadDir = torrentOptionsDownloadDir || qbittorrentSavePath;

  const loginApiUrl = getApiUrl(url, 'auth/login');
  const serverUrlObj = new URL(url);
  const origin = `${serverUrlObj.protocol}//${serverUrlObj.host}`;
  // For Referer, use the full URL provided in serverConfig.url, as this is what the browser would use.
  const referer = new URL(url).href;


  const commonHeadersForApi = { // For general API calls after login
      'Referer': referer,
      'Origin': origin
  };
  const loginHeaders = { // Specifically for login
      'Referer': referer,
      'Origin': origin,
      'Content-Type': 'application/x-www-form-urlencoded'
  };
  
  async function makeAuthenticatedQbitRequest(apiUrl, formData, method = 'POST', isJson = false) {
    const loginBodyParams = new URLSearchParams();
    loginBodyParams.append('username', username);
    loginBodyParams.append('password', password);
    
    const loginResp = await fetch(loginApiUrl, { 
        method: 'POST', 
        body: loginBodyParams.toString(),
        headers: loginHeaders, // Uses the corrected referer
        credentials: 'include' 
    });

    if (!loginResp.ok) throw new Error(`Login failed: ${loginResp.status} ${loginResp.statusText}. URL: ${loginApiUrl}. Check credentials and ensure qBittorrent is reachable and Referer/Origin headers are allowed if behind a reverse proxy.`);
    const loginTxt = await loginResp.text();
    if (loginTxt.trim().toLowerCase() !== 'ok.') debug.warn(`qBit login not 'Ok.': ${loginTxt}`);

    const options = { 
        method,
        headers: { ...commonHeadersForApi } // Uses the corrected referer
    };

    if (formData) {
        if (isJson) {
            options.body = JSON.stringify(formData);
            options.headers['Content-Type'] = 'application/json';
        } else { // Assuming FormData for file uploads, browser sets Content-Type
            options.body = formData; 
        }
    }
    options.credentials = 'include'; 
    return fetch(apiUrl, options);
  }

  async function _fetchTorrentListHashes() {
    const torrentsInfoUrl = getApiUrl(url, 'torrents/info');
    
    const loginBodyParamsInternal = new URLSearchParams();
    loginBodyParamsInternal.append('username', username);
    loginBodyParamsInternal.append('password', password);
    const loginResp = await fetch(loginApiUrl, { 
        method: 'POST', 
        body: loginBodyParamsInternal.toString(), 
        headers: loginHeaders, // Uses the corrected referer
        credentials: 'include'
    });
    if (!loginResp.ok) throw new Error(`Login failed before fetching torrent list: ${loginResp.status}`);
    if ((await loginResp.text()).trim().toLowerCase() !== 'ok.') debug.warn('Login not Ok before fetching list.');

    const response = await fetch(torrentsInfoUrl, { headers: commonHeadersForApi, credentials: 'include' }); // Uses corrected referer 
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
    
    const response = await makeAuthenticatedQbitRequest(setPrioUrl, formData, 'POST');
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

    // This function is called after a successful login/add, so we can rely on the existing session cookie.
    // A direct fetch is more appropriate here than re-using makeAuthenticatedQbitRequest.
    const response = await fetch(resumeUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'Referer': new URL(url).href,
            'Origin': new URL(url).origin
        },
        credentials: 'include'
    });

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
            let fileName = 'file.torrent';
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

    const addTorrentApiUrl = getApiUrl(url, 'torrents/add');
    const addResponse = await makeAuthenticatedQbitRequest(addTorrentApiUrl, addTorrentFormData, 'POST');
    const addResponseText = await addResponse.text();

    if (addResponseText.includes('already in the download list')) {
        debug.log('qBittorrent: Torrent is already in the download list.');
        return { success: true, duplicate: true, data: { message: 'Torrent is already in the download list.' } };
    }

    if (!addResponse.ok) {
        return { success: false, error: { userMessage: "Failed to add torrent to qBittorrent.", technicalDetail: `Add torrent API returned: ${addResponse.status} ${addResponse.statusText}. Response: ${addResponseText}`, errorCode: "ADD_FAILED" }};
    }

    if (addResponseText.trim().toLowerCase() !== 'ok.' && addResponseText.trim() !== '') {
        return { success: false, error: { userMessage: "Torrent submitted, but server gave an unexpected response.", technicalDetail: `qBittorrent add response: ${addResponseText}`, errorCode: "UNEXPECTED_RESPONSE" }};
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
    return { 
      success: false, 
      error: {
        userMessage: "A network error occurred or the server could not be reached during qBittorrent add.",
        technicalDetail: error.message,
        errorCode: "NETWORK_ERROR_QBIT_ADD"
      }
    };
  }
}

export async function getTorrentsInfo(serverConfig, hashes) {
  const { url, username, password } = serverConfig;
  if (!hashes || hashes.length === 0) {
    return [];
  }

  const torrentsInfoUrl = getApiUrl(url, `torrents/info?hashes=${hashes.join('|')}`);
  const loginApiUrl = getApiUrl(url, 'auth/login');
  const serverUrlObj = new URL(url);
  const origin = `${serverUrlObj.protocol}//${serverUrlObj.host}`;
  const referer = new URL(url).href;

  const loginHeaders = {
    'Referer': referer,
    'Origin': origin,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

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
    throw new Error(`Login failed while getting torrent info: ${loginResp.status} ${loginResp.statusText}`);
  }

  const response = await fetch(torrentsInfoUrl, {
    headers: { 'Referer': referer, 'Origin': origin },
    credentials: 'include'
  });

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
    const { url, username, password } = serverConfig;
    const buildInfoUrl = getApiUrl(url, 'app/buildInfo');
    const webUIVersionUrl = getApiUrl(url, 'app/webapiVersion');
    const mainDataUrl = getApiUrl(url, 'sync/maindata');
    const loginApiUrl = getApiUrl(url, 'auth/login');
    
    const serverUrlObj = new URL(url);
    const origin = `${serverUrlObj.protocol}//${serverUrlObj.host}`;
    const referer = new URL(url).href;

    const loginHeaders = {
        'Referer': referer,
        'Origin': origin,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Ensure we're authenticated before making API calls
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
        debug.warn('Login failed in getBuildInfo, returning empty data.');
        return {};
    }

    const commonHeaders = {
        'Referer': referer,
        'Origin': origin
    };

    // Now make the authenticated API calls
    const buildInfoResp = await fetch(buildInfoUrl, { 
        headers: commonHeaders,
        credentials: 'include' 
    });
    const webUIVersionResp = await fetch(webUIVersionUrl, { 
        headers: commonHeaders,
        credentials: 'include' 
    });
    const mainDataResp = await fetch(mainDataUrl, { 
        headers: commonHeaders,
        credentials: 'include' 
    });

    if (!buildInfoResp.ok || !webUIVersionResp.ok || !mainDataResp.ok) {
        debug.warn('Could not fetch all build info details after authentication.');
        return {};
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
  const { url, username, password } = serverConfig; // serverConfig.url is the full base URL
  
  if (!url || typeof url !== 'string') {
    return { 
      success: false, 
      error: { 
        userMessage: 'qBittorrent URL is missing or invalid.',
        errorCode: "INVALID_CONFIG"
      }
    };
  }

  let loginUrl;
  let serverUrlObjInstance; // Renamed to avoid conflict with outer scope serverUrlObj if any
  try {
    loginUrl = getApiUrl(url, 'auth/login');
    serverUrlObjInstance = new URL(url);
  } catch (e) {
    return { 
      success: false, 
      error: {
        userMessage: 'Invalid qBittorrent URL format.',
        technicalDetail: e.message,
        errorCode: "INVALID_URL_FORMAT"
      }
    };
  }
    
  const loginBody = new URLSearchParams();
  loginBody.append('username', username);
  loginBody.append('password', password);

  const originValue = `${serverUrlObjInstance.protocol}//${serverUrlObjInstance.host}`;
  const refererValue = serverUrlObjInstance.href; 

  const requestHeaders = {
      'Referer': refererValue,
      'Origin': originValue,
      'Content-Type': 'application/x-www-form-urlencoded'
  };

  debug.log('[qBittorrent Handler] testConnection: Attempting login with:', {
    url: loginUrl,
    method: 'POST',
    headers: requestHeaders,
    body: loginBody.toString(),
    credentials: 'include'
  });

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      body: loginBody.toString(),
      headers: requestHeaders,
      credentials: 'include' 
    });

    debug.log('[qBittorrent Handler] testConnection: Login response status:', response.status);
    const responseText = await response.text(); 
    debug.log('[qBittorrent Handler] testConnection: Login response text:', responseText);

    if (response.ok) {
      if (responseText.trim().toLowerCase() === 'ok.') {
        try {
            const version = await getQbittorrentVersion(serverConfig);
            const buildInfo = await getBuildInfo(serverConfig);
            return {
                success: true,
                data: {
                    message: 'Authentication successful.',
                    version: version,
                    freeSpace: buildInfo.freeSpace,
                    torrentsInfo: {
                        total: buildInfo.total_torrents,
                        downloadSpeed: buildInfo.dl_info_speed,
                        uploadSpeed: buildInfo.up_info_speed,
                    }
                }
            };
        } catch (infoError) {
            debug.error('Login successful, but failed to get additional server info:', infoError);
            return { 
                success: true, 
                data: { 
                    message: 'Authentication successful, but could not retrieve detailed server info.' 
                } 
            };
        }
      } else {
        return { 
          success: false, 
          error: {
            userMessage: "Authentication succeeded but server gave an unexpected response.",
            technicalDetail: `Login response: ${responseText}`,
            errorCode: "UNEXPECTED_AUTH_RESPONSE"
          }
        };
      }
    } else {
      return { 
        success: false, 
        error: {
          userMessage: "Authentication failed. Check credentials/URL. For qBittorrent v4.3.0+ (esp. v5.1.0+), also try disabling 'CSRF Protection' in WebUI > Options > Web UI, as browser extension requests can conflict with this.",
          technicalDetail: `Login API returned: ${response.status} ${response.statusText}. Response body: ${responseText}`,
          errorCode: "AUTH_FAILED"
        }
      };
    }
  } catch (error) {
    debug.error('[qBittorrent Handler] testConnection: Network or other error during fetch:', error);
    return { 
      success: false, 
      error: {
        userMessage: "Network error or qBittorrent server not reachable.",
        technicalDetail: error.message,
        errorCode: "NETWORK_ERROR"
      }
    };
  }
}
