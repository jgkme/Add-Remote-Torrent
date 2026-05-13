import { debug } from '../debug';

// Synology Download Station API Handler

// Session cache per server to avoid cross-server leakage.
// Keep shape compatible with pre–v0.4.24: `_sid` only (no SynoToken) unless DSM misbehaves — see getSynologySession.
const synologySessionCache = new Map(); // key: server url -> { sid, lastLoginTime }
const SYNOLOGY_SESSION_CACHE_DURATION = 30 * 60 * 1000;

function getServerCacheKey(serverConfig) {
    return String(serverConfig.url || '').replace(/\/$/, '');
}

function getAuthHeaders(serverConfig) {
    const headers = {};
    if (serverConfig.useBasicAuth && serverConfig.basicAuthUsername && serverConfig.basicAuthPassword) {
        const authString = btoa(`${serverConfig.basicAuthUsername}:${serverConfig.basicAuthPassword}`);
        headers['Authorization'] = `Basic ${authString}`;
    }
    return headers;
}

/**
 * Synology Web API common error codes (DSM / packages). Maps to user-facing hints.
 * Ref: Synology Developer Guide (`error.code` in JSON responses).
 */
function synologyApiUserMessage(code) {
    const messages = {
        101: 'Invalid parameter sent to Synology (check destination folder path and link format).',
        102: 'Synology reported an unknown API — DSM or Download Station may need an update.',
        103: 'This Synology API version is not supported — try a different package/API version if your DSM exposes it.',
        104: 'Unknown API method — DSM/Download Station may have changed.',
        105: 'Permission denied: this DSM user cannot use Download Station via the API. In DSM go to Control Panel → User & Group → select the user → Applications (or Privileges) and allow Download Station, or use an account with access.',
        106: 'Synology session timed out — try Test connection again.',
        107: 'Synology session was replaced (duplicate login). Try again shortly.',
        119: 'Invalid or expired Synology session — the extension will retry login automatically.',
        400: 'Invalid torrent file or magnet link for Synology Download Station.',
    };
    return messages[code] || null;
}

async function getSynologySession(serverConfig) {
    const key = getServerCacheKey(serverConfig);
    const now = Date.now();
    const existing = synologySessionCache.get(key);
    if (existing && (now - existing.lastLoginTime < SYNOLOGY_SESSION_CACHE_DURATION)) {
        return existing;
    }

    // API: SYNO.API.Auth
    // Method: login
    // Version: 6 is common, but Synology supports up to 7. Version 6 is widely compatible.
    // Consider making version configurable or checking API.Info if issues arise.
    // User log indicates SYNO.API.Auth path is entry.cgi and maxVersion is 7.
    // Using version 6 for SYNO.API.Auth as it's often cited as stable.
    const authUrl = `${serverConfig.url.replace(/\/$/, '')}/webapi/entry.cgi`;
    // Match v0.4.23 login query: do NOT use enable_syno_token — some DSM / Download Station
    // setups return error 105 or fail tasks when SynoToken is requested and sent on later calls.
    const params = new URLSearchParams({
        api: 'SYNO.API.Auth',
        version: serverConfig.authApiVersion || '6', // Changed version
        method: 'login',
        account: serverConfig.username,
        passwd: serverConfig.password, // This should be passwd
        session: 'DownloadStation', // Session name
        format: 'sid',
    });

    const authHeaders = getAuthHeaders(serverConfig);

    try {
        const response = await fetch(`${authUrl}?${params.toString()}`, {
            method: 'GET',
            headers: authHeaders
        });
        if (!response.ok) {
            // This error will be caught by the catch block below
            throw new Error(`Synology auth request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.data && data.data.sid) {
            const session = {
                sid: data.data.sid,
                lastLoginTime: now,
            };
            synologySessionCache.set(key, session);
            return session;
        } else {
            // This error will be caught by the catch block below
            throw new Error(data.error ? `Synology login API error: ${data.error.code}` : 'Synology login failed, SID not found in response.');
        }
    } catch (error) { // Catches fetch errors or errors thrown above
        debug.error('Error fetching Synology SID:', error);
        synologySessionCache.delete(key);
        // This error is thrown and expected to be caught by the caller (makeSynologyApiRequest)
        // which will then return a structured error.
        throw new Error(`SIDFetchError: ${error.message}`); 
    }
}

async function makeSynologyApiRequest(serverConfig, apiName, version, methodName, params = {}, httpMethod = 'GET') {
    let session;
    try {
        session = await getSynologySession(serverConfig);
    } catch (sidError) {
        return {
            success: false,
            error: {
                userMessage: "Failed to authenticate with Synology. Check credentials and server URL.",
                technicalDetail: sidError.message.substring("SIDFetchError: ".length), // Remove prefix
                errorCode: "AUTH_FAILED"
            }
        };
    }
    if (!session?.sid) { // Should be caught by try/catch, but as a safeguard
        return {
            success: false,
            error: {
                userMessage: "Failed to obtain Synology SID (unexpected).",
                errorCode: "SID_UNEXPECTED_FAILURE"
            }
        };
    }

    let cgiPath;
    if (apiName === 'SYNO.API.Info') {
        cgiPath = 'query.cgi';
    } else if (apiName === 'SYNO.DownloadStation.Task') {
        cgiPath = 'DownloadStation/task.cgi'; // As per user's log for SYNO.API.Info
    } else if (apiName === 'SYNO.DownloadStation.Info') { // From the PDF, for getinfo/getconfig
        cgiPath = 'DownloadStation/info.cgi';
    } else if (apiName === 'SYNO.DownloadStation.Schedule') { // From the PDF
        cgiPath = 'DownloadStation/schedule.cgi';
    } else if (apiName === 'SYNO.DownloadStation.Statistic') { // From the PDF
        cgiPath = 'DownloadStation/statistic.cgi';
    } else if (apiName === 'SYNO.DownloadStation.RSS.Site') { // From the PDF
        cgiPath = 'DownloadStation/RSSsite.cgi';
    } else if (apiName === 'SYNO.DownloadStation.RSS.Feed') { // From the PDF
        cgiPath = 'DownloadStation/RSSfeed.cgi';
    } else if (apiName === 'SYNO.DownloadStation.BTSearch') { // From the PDF
        cgiPath = 'DownloadStation/btsearch.cgi';
    } else {
        // Default to entry.cgi for SYNO.API.Auth (handled in getSynologySid) 
        // and any other APIs not explicitly mapped.
        // Note: getSynologySid makes its own direct call to entry.cgi for SYNO.API.Auth.
        // This makeSynologyApiRequest is for other general API calls.
        // If SYNO.API.Auth is called through here for other methods like 'logout', it should use entry.cgi.
        cgiPath = 'entry.cgi'; 
    }
    
    const baseUrl = serverConfig.url.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/webapi/${cgiPath}`;
    
    const requestParams = { ...params };
    delete requestParams.retriedWithNewSid;
    const queryParams = new URLSearchParams(requestParams);
    // For entry.cgi, api, version, method are part of query.
    // For specific cgi paths, they might be implicit or still needed.
    // The Synology PDF shows them in query even for specific CGIs.
    queryParams.set('api', apiName);
    queryParams.set('version', version);
    queryParams.set('method', methodName);
    queryParams.set('_sid', session.sid);

    let requestOptions = { method: httpMethod };
    let fullUrl = apiUrl;
    const requestHeaders = getAuthHeaders(serverConfig);

    if (httpMethod === 'GET') {
        fullUrl = `${apiUrl}?${queryParams.toString()}`;
    } else { // POST
        requestOptions.body = queryParams; // Send as x-www-form-urlencoded
        requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    requestOptions.headers = requestHeaders;
    
    try {
        const response = await fetch(fullUrl, requestOptions);
        if (!response.ok) {
            return { 
                success: false, 
                error: {
                    userMessage: "Synology API request failed.",
                    technicalDetail: `API Error: ${response.status} ${response.statusText}`,
                    errorCode: "API_REQUEST_FAILED"
                }
            };
        }

        const data = await response.json();
        if (data && !data.success && data.error && data.error.code === 119 && !params.retriedWithNewSid) {
            debug.log('Synology request failed due to invalid/expired SID (Code 119). Refetching session and retrying.');
            synologySessionCache.delete(getServerCacheKey(serverConfig));
            const retryParams = { ...params, retriedWithNewSid: true };
            return makeSynologyApiRequest(serverConfig, apiName, version, methodName, retryParams, httpMethod);
        }
        if (data.success) {
            return { success: true, data: data.data };
        } else {
            const errCode = data.error ? data.error.code : undefined;
            const mapped = typeof errCode === 'number' ? synologyApiUserMessage(errCode) : null;
            let userMsg = mapped || 'Synology server reported an error.';
            if (!mapped && data.error && data.error.code === 400) {
                userMsg = 'Invalid torrent file or magnet link.';
            }

            return { 
                success: false, 
                error: {
                    userMessage: userMsg,
                    technicalDetail: `Synology API Error Code: ${errCode ?? 'Unknown'}. Errors: ${data.error?.errors ? JSON.stringify(data.error.errors) : 'N/A'}`,
                    errorCode: `SYNO_API_ERR_${errCode ?? 'UNKNOWN'}`
                }
            };
        }
    } catch (error) { // Catches network errors or errors from getSynologySid if not handled above
        debug.error('Error in Synology API request:', error);
        if (error.message && error.message.startsWith("SIDFetchError:")) {
             return {
                success: false,
                error: {
                    userMessage: "Failed to authenticate with Synology. Check credentials and server URL.",
                    technicalDetail: error.message.substring("SIDFetchError: ".length),
                    errorCode: "AUTH_FAILED"
                }
            };
        }
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the Synology server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, username, password, clientType }
    // torrentOptions: { downloadDir, paused, labels (not directly supported by 'create' task) }

    const params = {
        uri: torrentUrl, // Magnet or .torrent URL
        // create_list: false, // Default is false, creates individual tasks
        // type: "url" // Can be "url" or "file". "url" is for http/ftp/magnet/ed2k.
    };

    if (torrentOptions.downloadDir) {
        params.destination = torrentOptions.downloadDir;
    }
    // Synology's 'SYNO.DownloadStation.Task' with method 'create' adds torrents in a paused state by default.
    // API documentation for version 1 states: "Create download tasks. Tasks are created in the paused status."
    // Newer versions (e.g., v3) might have a 'create_as_resume' or similar parameter, but v1 does not.
    // If torrentOptions.paused is false, a subsequent 'resume' action is needed.

    // API: SYNO.DownloadStation.Task
    // Method: create
    // Version: 1 as per initial analysis. Newer versions (e.g., 3) exist and might offer more.
    // For now, sticking to v3 based on user's DSM 7.2 maxVersion.
    const result = await makeSynologyApiRequest(
        serverConfig,
        'SYNO.DownloadStation.Task',
        serverConfig.taskApiVersion || '3', // Changed version
        'create',
        params,
        'POST' 
    );

    if (result.success && !torrentOptions.paused) {
        // Auto-resume Challenge:
        // The 'create' method (v1) does NOT return the task ID(s) of the newly created torrent.
        // To resume, we would need to:
        // 1. List tasks (SYNO.DownloadStation.Task, method 'list') before adding.
        // 2. List tasks again after adding.
        // 3. Diff the lists to find the new task ID(s) - this is unreliable if other tasks are added concurrently.
        // 4. Alternatively, try to find the task by URI if 'list' supports filtering by URI (unlikely for magnets).
        // 5. Once ID is found, call SYNO.DownloadStation.Task, method 'resume' with the ID.
        // This is a complex multi-step process and prone to race conditions or identification issues.
        // A future enhancement could attempt this, or users might need to manually resume.
        debug.warn("Synology: Torrent added (likely paused by default by Synology API). Auto-resume if 'paused: false' is a complex feature not yet implemented due to API limitations in getting the new task ID directly from the 'create' call.");
    }
    
    // The 'create' task (v1) response 'data' is often empty or just true on success, not detailed torrent info.
    return result; 
}

export async function testConnection(serverConfig) {
    try {
        // A successful call to makeSynologyApiRequest implies SID was obtained.
        const infoResult = await makeSynologyApiRequest(
            serverConfig, 'SYNO.API.Info', '1', 'query', 
            { query: 'SYNO.DownloadStation.Info,SYNO.DownloadStation.Statistic' }
        );

        if (!infoResult.success) {
            return { success: false, error: infoResult.error };
        }

        const dsInfo = infoResult.data['SYNO.DownloadStation.Info'];
        const dsStatInfo = infoResult.data['SYNO.DownloadStation.Statistic'];

        if (!dsInfo || !dsStatInfo) {
            return { success: false, error: { userMessage: 'Download Station API info not found.' } };
        }

        const statResult = await makeSynologyApiRequest(
            serverConfig, 'SYNO.DownloadStation.Statistic', dsStatInfo.maxVersion, 'getinfo', {}
        );

        let freeSpace = -1;
        if (statResult.success && statResult.data) {
            // The API returns free space of the default download directory.
            freeSpace = statResult.data.download_shared_folder_free_space;
        }

        return {
            success: true,
            data: {
                message: 'Successfully connected to Synology Download Station.',
                version: `API v${dsInfo.maxVersion}`, // Use API maxVersion as the version
                freeSpace: freeSpace,
            }
        };

    } catch (error) {
        return {
            success: false,
            error: {
                userMessage: "Synology connection test failed due to an unexpected error.",
                technicalDetail: error.message,
                errorCode: "TEST_CONN_EXCEPTION"
            }
        };
    }
}
