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

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
  // serverConfig: { url, username, password, clientType, ... }
  // torrentOptions: { downloadDir, paused, tags, category, labels, selectedFileIndices, totalFileCount }

  const { url, username, password } = serverConfig; // serverConfig.url is the full base URL entered by user
  const { 
    paused: userWantsPaused, 
    tags, 
    category, 
    selectedFileIndices, 
    totalFileCount,
    torrentFileContentBase64, 
    originalTorrentUrl 
  } = torrentOptions;

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
    if (loginTxt.trim().toLowerCase() !== 'ok.') console.warn(`qBit login not 'Ok.': ${loginTxt}`);

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
    if ((await loginResp.text()).trim().toLowerCase() !== 'ok.') console.warn('Login not Ok before fetching list.');

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
        console.error(`Failed to set file priorities for hash ${hash}, indices ${fileIndices.join(',')}, priority ${priority}. Server response: ${errorText}`);
        throw new Error(`Failed to set file priorities. Status: ${response.status}`);
    }
    console.log(`qBittorrent: Set priority ${priority} for files ${fileIndices.join(',')} of torrent ${hash}`);
    return response.ok;
  }

  async function _resumeTorrent(hash) {
    const resumeUrl = getApiUrl(url, 'torrents/resume');
    const formData = new FormData(); 
    formData.append('hashes', hash);
    const response = await makeAuthenticatedQbitRequest(resumeUrl, formData, 'POST');
     if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to resume torrent ${hash}. Server response: ${errorText}`);
        throw new Error(`Failed to resume torrent. Status: ${response.status}`);
    }
    console.log(`qBittorrent: Resumed torrent ${hash}`);
    return response.ok;
  }

  try {
    const isMagnet = torrentUrl.startsWith('magnet:'); 
    const useFileSelection = !isMagnet && typeof totalFileCount === 'number' && totalFileCount > 0 && Array.isArray(selectedFileIndices);
    
    let initialHashes = [];
    if (useFileSelection) {
        initialHashes = await _fetchTorrentListHashes();
    }

    const addTorrentFormData = new FormData(); 

    if (torrentFileContentBase64) {
        console.log("qBittorrent: Adding torrent using file content.");
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
            console.error("Error creating Blob from base64 content:", e);
            addTorrentFormData.append('urls', originalTorrentUrl);
        }
    } else {
        console.log("qBittorrent: Adding torrent using URL:", originalTorrentUrl);
        addTorrentFormData.append('urls', originalTorrentUrl);
    }

    if (tags) addTorrentFormData.append('tags', tags);
    if (category) addTorrentFormData.append('category', category);
    
    const addPausedEffective = useFileSelection ? 'true' : String(userWantsPaused);
    addTorrentFormData.append('paused', addPausedEffective);
    
    console.log(`qBittorrent: Adding torrent. Paused: ${addPausedEffective}. File selection active: ${useFileSelection}`);

    const addTorrentApiUrl = getApiUrl(url, 'torrents/add');
    const addResponse = await makeAuthenticatedQbitRequest(addTorrentApiUrl, addTorrentFormData, 'POST');

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      return { success: false, error: { userMessage: "Failed to add torrent to qBittorrent.", technicalDetail: `Add torrent API returned: ${addResponse.status} ${addResponse.statusText}. Response: ${errorText}`, errorCode: "ADD_FAILED" }};
    }
    const addResponseText = await addResponse.text();
    if (addResponseText.trim().toLowerCase() !== 'ok.' && addResponseText.trim() !== '') {
      return { success: false, error: { userMessage: "Torrent submitted, but server gave an unexpected response.", technicalDetail: `qBittorrent add response: ${addResponseText}`, errorCode: "UNEXPECTED_RESPONSE" }};
    }

    if (useFileSelection) {
        let newHash = null;
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        const currentHashes = await _fetchTorrentListHashes();
        newHash = currentHashes.find(h => !initialHashes.includes(h));

        if (newHash) {
            console.log(`qBittorrent: New torrent hash identified: ${newHash}`);
            const allFileIndices = Array.from({ length: totalFileCount }, (_, i) => i);
            const deselectedFileIndices = allFileIndices.filter(i => !selectedFileIndices.includes(i));

            await _setFilePriorities(newHash, deselectedFileIndices, 0); 
            await _setFilePriorities(newHash, selectedFileIndices, 1);   
            
            if (String(userWantsPaused).toLowerCase() === 'false') { 
                await _resumeTorrent(newHash);
            }
        } else {
            console.warn("qBittorrent: Could not identify hash of newly added torrent. File priorities not set. Torrent added with default priorities and effective paused state:", addPausedEffective);
            return { success: true, data: { warning: "Torrent added, but file priorities might not have been set due to hash identification failure."} };
        }
    }
    
    return { success: true };

  } catch (error) {
    console.error('Error in qBittorrent addTorrent flow:', error);
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
    console.error("base64ToBlob conversion error:", e);
    throw e; 
  }
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

  console.log('[qBittorrent Handler] testConnection: Attempting login with:', {
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

    console.log('[qBittorrent Handler] testConnection: Login response status:', response.status);
    const responseText = await response.text(); 
    console.log('[qBittorrent Handler] testConnection: Login response text:', responseText);

    if (response.ok) {
      if (responseText.trim().toLowerCase() === 'ok.') {
        return { success: true, data: { message: 'Authentication successful.' } }; 
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
    console.error('[qBittorrent Handler] testConnection: Network or other error during fetch:', error);
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
