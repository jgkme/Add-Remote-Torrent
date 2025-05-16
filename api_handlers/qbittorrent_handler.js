// qBittorrent API Handler
// This file will contain the logic for interacting with the qBittorrent WebUI API.

// Helper function to construct full API URLs for qBittorrent v2 API
function getApiUrl(baseUrl, apiPath) {
  const urlObj = new URL(baseUrl);
  // Ensure the path ends with a slash before appending api/v2/
  const basePath = urlObj.pathname.endsWith('/') ? urlObj.pathname : `${urlObj.pathname}/`;
  return `${urlObj.origin}${basePath}api/v2/${apiPath}`;
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
  // serverConfig: { url, username, password, clientType, ... }
  // torrentOptions: { downloadDir, paused, tags, category, labels, selectedFileIndices, totalFileCount }

  // Use these destructured values
  const { url, username, password } = serverConfig;
  const { paused: userWantsPaused, tags, category, selectedFileIndices, totalFileCount } = torrentOptions;

  const loginApiUrl = getApiUrl(url, 'auth/login');
  
  // Helper to perform authenticated POST requests for qBittorrent (handles login implicitly)
  // This simplified helper assumes login is always needed before other actions.
  // For a more robust solution, session cookie management would be better.
  async function makeAuthenticatedQbitRequest(apiUrl, formData, method = 'POST', isJson = false) {
    // Ensure login first (or re-login if session expired - not handled here yet)
    const loginFormDataInternal = new FormData();
    loginFormDataInternal.append('username', username);
    loginFormDataInternal.append('password', password);
    const loginResp = await fetch(loginApiUrl, { method: 'POST', body: loginFormDataInternal });
    if (!loginResp.ok) throw new Error(`Login failed: ${loginResp.status}`);
    const loginTxt = await loginResp.text();
    if (loginTxt.trim().toLowerCase() !== 'ok.') console.warn(`qBit login not 'Ok.': ${loginTxt}`);

    const options = { method };
    if (formData) {
        if (isJson) {
            options.body = JSON.stringify(formData);
            options.headers = { 'Content-Type': 'application/json' };
        } else {
            options.body = formData; // FormData for POST, URLSearchParams for GET with params
        }
    }
    return fetch(apiUrl, options);
  }

  async function _fetchTorrentListHashes() {
    const torrentsInfoUrl = getApiUrl(url, 'torrents/info');
    // For GET with URLSearchParams, ensure makeAuthenticatedQbitRequest can handle it or use a separate fetch
    // For simplicity, assuming a direct fetch after login for GET.
    // This part needs proper auth handling for GET requests if cookies aren't automatically sent.
    // The makeAuthenticatedQbitRequest is POST oriented.
    // Let's assume for now that the session cookie from login persists for subsequent GETs.
    const loginFormDataInternal = new FormData(); // Re-login to ensure session
    loginFormDataInternal.append('username', username);
    loginFormDataInternal.append('password', password);
    await fetch(loginApiUrl, { method: 'POST', body: loginFormDataInternal });


    const response = await fetch(torrentsInfoUrl); // This needs cookie from login
    if (!response.ok) throw new Error(`Failed to fetch torrent list: ${response.status}`);
    const torrents = await response.json();
    return torrents.map(t => t.hash);
  }

  async function _setFilePriorities(hash, fileIndices, priority) {
    if (!fileIndices || fileIndices.length === 0) return true; // Nothing to set
    const setPrioUrl = getApiUrl(url, 'torrents/filePrio');
    const formData = new FormData();
    formData.append('hash', hash);
    formData.append('id', fileIndices.join('|'));
    formData.append('priority', String(priority));
    
    const response = await makeAuthenticatedQbitRequest(setPrioUrl, formData);
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
    const response = await makeAuthenticatedQbitRequest(resumeUrl, formData);
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
    addTorrentFormData.append('urls', torrentUrl);
    if (tags) addTorrentFormData.append('tags', tags);
    if (category) addTorrentFormData.append('category', category);
    
    // If using file selection, always add paused initially. Otherwise, respect user's choice.
    const addPausedEffective = useFileSelection ? 'true' : String(userWantsPaused);
    addTorrentFormData.append('paused', addPausedEffective);
    
    console.log(`qBittorrent: Adding torrent. Paused: ${addPausedEffective}. File selection active: ${useFileSelection}`);

    const addTorrentApiUrl = getApiUrl(url, 'torrents/add');
    const addResponse = await makeAuthenticatedQbitRequest(addTorrentApiUrl, addTorrentFormData);

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
        // Attempt to find the new hash - this might need retries or a delay
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for torrent to appear in list
        const currentHashes = await _fetchTorrentListHashes();
        newHash = currentHashes.find(h => !initialHashes.includes(h));

        if (newHash) {
            console.log(`qBittorrent: New torrent hash identified: ${newHash}`);
            const allFileIndices = Array.from({ length: totalFileCount }, (_, i) => i);
            const deselectedFileIndices = allFileIndices.filter(i => !selectedFileIndices.includes(i));

            await _setFilePriorities(newHash, deselectedFileIndices, 0); // Set deselected to "do not download"
            await _setFilePriorities(newHash, selectedFileIndices, 1);   // Set selected to "normal priority"
            
            if (String(userWantsPaused).toLowerCase() === 'false') { // If user originally wanted it started
                await _resumeTorrent(newHash);
            }
        } else {
            console.warn("qBittorrent: Could not identify hash of newly added torrent. File priorities not set. Torrent added with default priorities and effective paused state:", addPausedEffective);
            // Return success but with a warning that priorities might not be set
            return { success: true, data: { warning: "Torrent added, but file priorities might not have been set due to hash identification failure."} };
        }
    }
    
    return { success: true };

  } catch (error) {
    console.error('Error in qBittorrent addTorrent flow:', error);
    return { 
      success: false, 
      error: {
        userMessage: "A network error occurred or the server could not be reached.",
        technicalDetail: error.message,
        errorCode: "NETWORK_ERROR"
      }
    };
  }
}

export async function testConnection(serverConfig) {
  const { url, username, password } = serverConfig;
  
  if (!url || typeof url !== 'string') {
    return { 
      success: false, 
      error: { // Changed 'message' to 'error.userMessage' for consistency
        userMessage: 'qBittorrent URL is missing or invalid.',
        errorCode: "INVALID_CONFIG"
      }
    };
  }

  let loginUrl;
  try {
    loginUrl = getApiUrl(url, 'auth/login');
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
    
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const text = await response.text();
      if (text.trim().toLowerCase() === 'ok.') {
        return { success: true, data: { message: 'Authentication successful.' } }; // Changed 'message' to 'data.message'
      } else {
        return { 
          success: false, 
          error: {
            userMessage: "Authentication succeeded but server gave an unexpected response.",
            technicalDetail: `Login response: ${text}`,
            errorCode: "UNEXPECTED_AUTH_RESPONSE"
          }
        };
      }
    } else {
      return { 
        success: false, 
        error: {
          userMessage: "Authentication failed. Please check credentials and server URL.",
          technicalDetail: `Login API returned: ${response.status} ${response.statusText}`,
          errorCode: "AUTH_FAILED"
        }
      };
    }
  } catch (error) {
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
