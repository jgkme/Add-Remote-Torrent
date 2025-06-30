import { debug } from '../debug';

// rTorrent API Handler
// This file will contain the logic for interacting with rTorrent via XML-RPC.

// Note: XML-RPC is more complex to handle with basic fetch than JSON-RPC.
// A proper implementation might require an XML-RPC client library or more
// sophisticated request body construction and response parsing.
// This handler will be a placeholder for now, outlining the expected structure.

// b64_encode function provided by user (or use window.btoa if input is stringified binary)
function b64_encode_bytes(inputBytes) { // Expects Uint8Array or array of byte values
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	while (i < inputBytes.length) {
		chr1 = inputBytes[i++];
		chr2 = inputBytes[i++];
		chr3 = inputBytes[i++];
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		output = output +
		_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
		_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
	}
	return output;
}


async function makeXmlRpcRequest(serverConfig, methodName, params = []) {
    // serverConfig.url can be the WebUI (e.g., ruTorrent) or the direct XML-RPC endpoint.
    // serverConfig.scgiPath should be the specific XML-RPC endpoint if different from a general WebUI URL.
    // serverConfig.username and serverConfig.password for Basic Auth if enabled.

    const rpcEndpoint = serverConfig.scgiPath || serverConfig.url; // Prioritize scgiPath

    debug.warn('rTorrent XML-RPC makeXmlRpcRequest is a basic implementation.');
    
    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
            return c;
        });
    }

    // XML parameter construction
    const paramsXml = params.map(p => {
        let valueXml;
        if (p && typeof p === 'object' && p.type === 'base64') { // Special handling for base64
            valueXml = `<base64>${p.value}</base64>`; // p.value should already be base64 string
        } else if (typeof p === 'string') {
            valueXml = `<string>${escapeXml(p)}</string>`;
        } else if (typeof p === 'number' && Number.isInteger(p)) {
            valueXml = `<i4>${p}</i4>`; // or <int>
        } else if (typeof p === 'boolean') {
            valueXml = `<boolean>${p ? 1 : 0}</boolean>`;
        } else {
            // TODO: Add support for other types like double, array, struct if needed
            debug.warn(`rTorrent handler: Parameter type ${typeof p} not fully supported, sending as string.`);
            valueXml = `<string>${escapeXml(String(p))}</string>`;
        }
        return `<param><value>${valueXml}</value></param>`;
    }).join('');

    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>${methodName}</methodName><params>${paramsXml}</params></methodCall>`;
    
    const headers = {
        'Content-Type': 'text/xml; charset=utf-8',
    };
    if (serverConfig.username && serverConfig.password) {
        headers['Authorization'] = `Basic ${btoa(`${serverConfig.username}:${serverConfig.password}`)}`;
    }

    try {
        const response = await fetch(rpcEndpoint, {
            method: 'POST',
            headers: headers,
            body: xmlBody,
        });

        if (!response.ok) {
            let errorCode = "API_ERROR";
            if (response.status === 401 || response.status === 403) errorCode = "AUTH_FAILED";
            return { 
                success: false, 
                error: {
                    userMessage: "rTorrent API request failed.",
                    technicalDetail: `API Error: ${response.status} ${response.statusText}`,
                    errorCode: errorCode
                }
            };
        }

        const responseText = await response.text();
        // TODO: Implement a proper XML parser for robust response handling.
        if (responseText.includes("<fault>")) {
            debug.error('rTorrent XML-RPC fault response:', responseText);
            // Try to extract faultString
            const faultStringMatch = /<name>faultString<\/name>\s*<value>\s*<string>(.*?)<\/string>\s*<\/value>/s.exec(responseText);
            const faultCodeMatch = /<name>faultCode<\/name>\s*<value>\s*<int>(.*?)<\/int>\s*<\/value>/s.exec(responseText);
            let errorMsg = 'rTorrent XML-RPC fault occurred.';
            if (faultStringMatch && faultStringMatch[1]) {
                errorMsg = `rTorrent fault: ${faultStringMatch[1]}`;
            }
            if (faultCodeMatch && faultCodeMatch[1]) {
                errorMsg += ` (Code: ${faultCodeMatch[1]})`;
            }
            return { 
                success: false, 
                error: {
                    userMessage: "rTorrent server reported an XML-RPC fault.",
                    technicalDetail: errorMsg,
                    errorCode: "XMLRPC_FAULT"
                }
            };
        }
        
        const stringResultMatch = /<methodResponse>\s*<params>\s*<param>\s*<value>\s*<string>(.*?)<\/string>\s*<\/value>\s*<\/param>\s*<\/params>\s*<\/methodResponse>/s.exec(responseText);
        if (stringResultMatch && stringResultMatch[1]) {
            return { success: true, data: stringResultMatch[1] };
        }

        if (methodName.startsWith('load.')) {
            const isEmptySuccess = /<methodResponse>\s*<params\/>\s*<\/methodResponse>/s.test(responseText) ||
                                   /<methodResponse>\s*<params>\s*<param>\s*<value>\s*(<i4>0<\/i4>|<int>0<\/int>)?\s*<\/value>\s*<\/param>\s*<\/params>\s*<\/methodResponse>/s.test(responseText);
            if (isEmptySuccess) {
                return { success: true, data: "Load command sent successfully." };
            }
        }
        
        debug.warn("rTorrent: Could not parse specific success data from XML response:", responseText.substring(0, 500));
        return { success: true, data: responseText }; 

    } catch (error) {
        debug.error('Error in rTorrent XML-RPC request or response parsing:', error);
        return { 
            success: false, 
            error: {
                userMessage: "A network error occurred or the rTorrent server could not be reached.",
                technicalDetail: error.message,
                errorCode: "NETWORK_ERROR"
            }
        };
    }
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
    // torrentUrl is originalTorrentUrl from background.js
    const { 
        paused, 
        torrentFileContentBase64,
        // originalTorrentUrl is already passed as torrentUrl parameter
    } = torrentOptions;

    const isMagnet = torrentUrl.startsWith('magnet:');
    let methodToCall;
    let params;

    if (torrentFileContentBase64 && !isMagnet) {
        methodToCall = paused ? 'load.raw' : 'load.raw_start';
        // The first parameter for load.raw_start can be an empty string (target for commands, not file path)
        // The second parameter is the base64 encoded torrent data.
        params = ["", { type: 'base64', value: torrentFileContentBase64 }];
        debug.log(`rTorrent: Calling ${methodToCall} with base64 torrent content.`);
    } else {
        methodToCall = paused ? 'load.normal' : 'load.start';
        params = ["", torrentUrl]; // Standard parameters for adding by URL
        debug.log(`rTorrent: Calling ${methodToCall} with URL: ${torrentUrl}`);
    }

    // Optional parameters like download directory or labels are more complex with rTorrent's
    // XML-RPC. They often require using "execute" commands or setting properties post-add.
    // For this basic "Add Torrent" functionality, we'll focus on just adding the URL.
    // Example: d.directory.set=, d.priority.set=, d.custom1.set=label
    // These usually require multi-call XML-RPC or specific "execute" commands during load.
    // For now, these are not implemented.
    if (torrentOptions.downloadDir) {
        debug.warn("rTorrent: downloadDir specified but setting it during initial load is not implemented in this basic handler. Requires post-add commands or complex load command.");
        // Example of how it *might* be done with a more complex load command (highly dependent on rTorrent version/setup):
        // if (methodToCall.startsWith('load.normal') || methodToCall.startsWith('load.start')) {
        //     // This would require params to be an array of structs or more complex XML
        //     // params.push({type: 'string', value: `d.directory.set=${torrentOptions.downloadDir}`}); // Incorrect XML-RPC param structure
        // }
    }
    if (torrentOptions.labels && torrentOptions.labels.length > 0) {
        debug.warn("rTorrent: Labels/tags specified but setting them during initial load is not implemented. Requires post-add commands or complex load command.");
        // Example: params.push(`d.custom1.set=${torrentOptions.labels[0]}`);
    }

    // Note: File selection (selectedFileIndices, totalFileCount) is not handled here yet.
    // That would require post-add calls like d.set_file_priority for each file.

    const result = await makeXmlRpcRequest(serverConfig, methodToCall, params);
    // A successful load.start/load.normal usually returns 0 or an empty response.
    // The makeXmlRpcRequest tries to parse this.
    if (result.success) {
        // Check if data indicates an error despite HTTP 200 OK (some rTorrent setups might do this)
        // For example, if result.data is a string containing "Error" or similar.
        // This is speculative as rTorrent fault handling should be primary.
        if (typeof result.data === 'string' && /error|fail/i.test(result.data)) {
            return {
                success: false,
                error: {
                    userMessage: "rTorrent reported an issue after command execution.",
                    technicalDetail: result.data,
                    errorCode: "RTORRENT_POST_EXEC_ISSUE"
                }
            };
        }
    }
    return result; 
}

export async function testConnection(serverConfig) {
    const result = await makeXmlRpcRequest(serverConfig, 'system.client_version', []);
    if (result.success) {
        return { success: true, data: { version: result.data } }; // result.data is the version string
    }
    // result.error should already be the standardized error object from makeXmlRpcRequest
    return { 
        success: false, 
        error: result.error || {
            userMessage: "Failed to connect or get rTorrent version.",
            errorCode: "TEST_CONN_FAILED"
        }
    };
}
