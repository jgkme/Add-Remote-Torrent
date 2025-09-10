import { debug } from '../debug';

// QNAP Download Station API Handler

// Session ID (SID) for QNAP
let qnapSid = null;
let lastQnapLoginTime = 0;
const QNAP_SID_CACHE_DURATION = 30 * 60 * 1000; // Cache SID for 30 minutes

async function getQnapSid(serverConfig) {
    const now = Date.now();
    if (qnapSid && (now - lastQnapLoginTime < QNAP_SID_CACHE_DURATION)) {
        return qnapSid;
    }

    // QNAP login mechanism needs verification. It might be:
    // 1. A global login (e.g., to /cgi-bin/authLogin.cgi) returning a system-wide SID.
    // 2. A specific login command to the Download Station CGI itself.
    // The API analysis mentioned: "Session cookie via login POST with username/password."
    // Endpoint: /cgi-bin/downloadStation/downloadStation.cgi
    // Assuming serverConfig.url is the base path to Download Station's CGI,
    // e.g., "http://<qnap_ip>:<port>/cgi-bin/downloadStation"
    // The actual CGI filename might be downloadStation.cgi, ds_control.cgi, etc.
    
    // Auth summary: GET to /cgi-bin/authLogin.cgi with user=<username>&pwd=<password>
    // serverConfig.url should be the QNAP base URL (e.g., http://<qnap_ip>:<port>)
    const loginUrl = `${serverConfig.url.replace(/\/$/, '')}/cgi-bin/authLogin.cgi`;
    
    const loginParams = new URLSearchParams();
    loginParams.append('user', serverConfig.username);
    loginParams.append('pwd', serverConfig.password); 

    try {
        const response = await fetch(`${loginUrl}?${loginParams.toString()}`, { 
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`QNAP auth request failed: ${response.status} ${response.statusText}`);
        }
        
        // QNAP authLogin.cgi typically returns XML. This needs robust parsing.
        // For this placeholder, we'll assume a best-case JSON or easily parsable text if it's not XML.
        // A proper implementation would require an XML parser if the response is XML.
        const responseText = await response.text();
        let sidFromResponse = null;

        // Attempt to parse as XML (very basic) to find <authSid> or <sid>
        // This is NOT a robust XML parser.
        let match = /<authSid>(\w+)<\/authSid>/.exec(responseText);
        if (match && match[1]) {
            sidFromResponse = match[1];
        } else {
            match = /<sid>(\w+)<\/sid>/.exec(responseText);
            if (match && match[1]) {
                sidFromResponse = match[1];
            }
        }
        
        // If not found in XML, try to parse as JSON (less likely for authLogin.cgi but possible)
        if (!sidFromResponse) {
            try {
                const data = JSON.parse(responseText);
                if (data && data.sid) {
                    sidFromResponse = data.sid;
                } else if (data && data.qtoken) { // As per auth summary
                    sidFromResponse = data.qtoken;
                }
            } catch (e) {
                // Not JSON or SID not found in JSON
            }
        }

        if (sidFromResponse) { 
            qnapSid = sidFromResponse;
            lastQnapLoginTime = now;
            return qnapSid; // Success
        } else {
            debug.error("QNAP Login response (couldn't find SID/qtoken in XML or JSON):", responseText);
            // This error will be caught by the catch block below
            throw new Error('QNAP login failed: SID/qtoken not found in response.');
        }
    } catch (error) { // Catches fetch errors or errors thrown above
        debug.error('Error fetching QNAP SID:', error);
        qnapSid = null;
        // This error is thrown and expected to be caught by the caller (makeQnapApiRequest)
        throw new Error(`SIDFetchErrorQNAP: ${error.message}`);
    }
}

async function makeQnapApiRequest(serverConfig, command, params = {}, httpMethod = 'GET') {
    let sid;
    try {
        sid = await getQnapSid(serverConfig);
    } catch (sidError) {
        return {
            success: false,
            error: {
                userMessage: "Failed to authenticate with QNAP. Check credentials and server URL.",
                technicalDetail: sidError.message.substring("SIDFetchErrorQNAP: ".length),
                errorCode: "AUTH_FAILED"
            }
        };
    }
    if (!sid) { // Should be caught by try/catch
        return {
            success: false,
            error: {
                userMessage: "Failed to obtain QNAP SID (unexpected).",
                errorCode: "SID_UNEXPECTED_FAILURE"
            }
        };
    }

    // Download Station commands go to /cgi-bin/downloadStation/downloadStation.cgi as per API analysis
    // serverConfig.url should be the QNAP base URL.
    const dsUrlPath = serverConfig.qnapDsPath || '/cgi-bin/downloadStation/downloadStation.cgi';
    const apiUrl = `${serverConfig.url.replace(/\/$/, '')}${dsUrlPath.startsWith('/') ? dsUrlPath : '/' + dsUrlPath}`;
    const queryParams = new URLSearchParams(params);
    queryParams.set('command', command);
    queryParams.set('sid', sid); // QNAP often uses 'sid' as a query parameter

    let requestOptions = { method: httpMethod };
    let fullUrl = apiUrl;

    if (httpMethod === 'GET') {
        fullUrl = `${apiUrl}?${queryParams.toString()}`;
    } else { // POST
        requestOptions.body = queryParams;
        requestOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }
    
    try {
        const response = await fetch(fullUrl, requestOptions);
        if (!response.ok) {
             // QNAP error handling might involve checking response body for error codes/messages
            const errorText = await response.text();
            debug.error("QNAP API Raw Error Response:", errorText);
            // Attempt to parse as JSON if possible
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson && (errorJson.error_code === -6 || errorJson.error_code === -7 || String(errorJson.error_code) === "104") && !params.retriedWithNewSid) { // SID invalid/expired (104 is common for invalid SID)
                    debug.log('QNAP request failed, possibly stale SID. Refetching SID and retrying.');
                    qnapSid = null; 
                    params.retriedWithNewSid = true;
                    return makeQnapApiRequest(serverConfig, command, params, httpMethod); // Retry
                }
                return { 
                    success: false, 
                    error: {
                        userMessage: "QNAP API request failed.",
                        technicalDetail: `Parsed Error: ${errorJson.error_msg || errorJson.error || errorText}`,
                        errorCode: `QNAP_API_ERR_${errorJson.error_code || 'UNKNOWN'}`
                    }
                };
            } catch (e_parse) { // Failed to parse errorText as JSON
                return { 
                    success: false, 
                    error: {
                        userMessage: "QNAP API request failed with non-JSON error response.",
                        technicalDetail: `API Error: ${response.status} ${response.statusText}. Response: ${errorText}`,
                        errorCode: "API_NON_JSON_ERROR"
                    }
                };
            }
        }

        const data = await response.json(); 
        if (data && (data.status === 1 || data.status === '1' || typeof data.error_code === 'undefined' || data.error_code === 0 || data.error_code === "0" || data.success === true)) { // Added data.success for some QNAP APIs
            return { success: true, data: data.data || data }; 
        } else {
            debug.error("QNAP API Error Data:", data);
            return { 
                success: false, 
                error: {
                    userMessage: "QNAP server reported an error.",
                    technicalDetail: `Error: ${data.error_msg || data.error || 'Unknown'}. Status: ${data.status}, Error Code: ${data.error_code}`,
                    errorCode: `QNAP_ERR_${data.error_code || data.status || 'UNKNOWN'}`
                }
            };
        }
    } catch (error) { // Catches network errors or errors from getQnapSid if not handled above
        debug.error('Error in QNAP API request:', error);
        if (error.message && error.message.startsWith("SIDFetchErrorQNAP:")) {
            return {
                success: false,
                error: {
                    userMessage: "Failed to authenticate with QNAP. Check credentials and server URL.",
                    technicalDetail: error.message.substring("SIDFetchErrorQNAP: ".length),
                    errorCode: "AUTH_FAILED"
                }
            };
        }
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the QNAP server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // serverConfig: { url, username, password, clientType }
    // torrentOptions: { downloadDir, paused, labels (category/tags) }

    // API analysis: method `task_add_url`, supports magnet via `url` parameter.
    // `move` for directory paths, `temp` for temporary labeling.
    const apiParams = {
        url: torrentUrl, // As per analysis
        // QNAP API often uses 'output=json' or similar to ensure JSON response
        // output: 'json', // This might be a global param or per-command
    };

    if (torrentOptions.downloadDir) {
        apiParams.move = torrentOptions.downloadDir; // As per analysis
    }
    if (torrentOptions.labels && torrentOptions.labels.length > 0) {
        apiParams.temp = torrentOptions.labels[0]; // As per analysis, for temporary labeling
    }
    if (torrentOptions.paused) {
        // Parameter for paused state is unknown. Common patterns: 'start=0', 'paused=1', 'add_paused=true'.
        // Needs verification from QNAP Download Station API documentation.
        debug.warn("QNAP: 'add paused' requested but specific parameter is unknown/not implemented. Torrent may start active.");
    }
    
    // API analysis suggests 'task_add_url'. HTTP method (GET/POST) also needs verification.
    // Assuming GET for now as it's simpler for URL-based additions.
    return makeQnapApiRequest(serverConfig, 'task_add_url', apiParams, 'GET');
}

export async function testConnection(serverConfig) {
    // Test by getting system info, which is a known valid command.
    try {
        const result = await makeQnapApiRequest(serverConfig, 'get_system_info', {}, 'GET'); 
        if (result.success && result.data) {
            return { 
                success: true, 
                data: { 
                    message: "Successfully connected to QNAP Download Station.",
                    version: result.data.version // The API returns a 'version' field
                } 
            };
        }
        return { 
            success: false, 
            error: result.error || {
                userMessage: 'Failed to get QNAP Download Station system info.',
                errorCode: "TEST_CONN_FAILED"
            }
        };
    } catch (error) {
         return { 
            success: false, 
            error: {
                userMessage: "QNAP connection test failed due to an unexpected error.",
                technicalDetail: error.message,
                errorCode: "TEST_CONN_EXCEPTION"
            }
        };
    }
}
