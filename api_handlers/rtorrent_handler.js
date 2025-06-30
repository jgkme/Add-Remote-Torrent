import { debug } from '../debug';

// rTorrent API Handler
// Improved: post-add directory/label/file selection, robust XML parsing, error handling

function b64_encode_bytes(inputBytes) {
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
	const rpcEndpoint = serverConfig.scgiPath || serverConfig.url;
	function escapeXml(unsafe) {
		return unsafe.replace(/[<>&'"]/g, function (c) {
			switch (c) {
				case '<': return '<';
				case '>': return '>';
				case '&': return '&';
				case '\'': return ''';
				case '"': return '"';
			}
			return c;
		});
	}
	const paramsXml = params.map(p => {
		let valueXml;
		if (p && typeof p === 'object' && p.type === 'base64') {
			valueXml = `<base64>${p.value}</base64>`;
		} else if (typeof p === 'string') {
			valueXml = `<string>${escapeXml(p)}</string>`;
		} else if (typeof p === 'number' && Number.isInteger(p)) {
			valueXml = `<i4>${p}</i4>`;
		} else if (typeof p === 'boolean') {
			valueXml = `<boolean>${p ? 1 : 0}</boolean>`;
		} else {
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
		if (responseText.includes("<fault>")) {
			debug.error('rTorrent XML-RPC fault response:', responseText);
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

// Helper: Get torrent hash by name (since rTorrent returns no hash on add)
async function getLatestTorrentHash(serverConfig) {
	const result = await makeXmlRpcRequest(serverConfig, 'download_list', []);
	if (result.success && typeof result.data === 'string') {
		const hashList = result.data.split('\n').filter(Boolean);
		return hashList[hashList.length - 1]; // Last added
	}
	return null;
}

export async function addTorrent(torrentUrl, serverConfig, torrentOptions) {
	const {
		paused,
		torrentFileContentBase64,
		downloadDir,
		labels,
		selectedFileIndices,
	} = torrentOptions;

	const isMagnet = torrentUrl.startsWith('magnet:');
	let methodToCall, params;

	if (torrentFileContentBase64 && !isMagnet) {
		methodToCall = paused ? 'load.raw' : 'load.raw_start';
		params = ["", { type: 'base64', value: torrentFileContentBase64 }];
		debug.log(`rTorrent: Calling ${methodToCall} with base64 torrent content.`);
	} else {
		methodToCall = paused ? 'load.normal' : 'load.start';
		params = ["", torrentUrl];
		debug.log(`rTorrent: Calling ${methodToCall} with URL: ${torrentUrl}`);
	}

	const result = await makeXmlRpcRequest(serverConfig, methodToCall, params);
	if (!result.success) return result;

	// Post-add: set directory, label, file priorities if needed
	let hash = await getLatestTorrentHash(serverConfig);
	if (!hash) {
		debug.warn("rTorrent: Could not determine torrent hash after add. Skipping post-add steps.");
		return result;
	}

	// Set download directory
	if (downloadDir) {
		await makeXmlRpcRequest(serverConfig, 'd.directory.set', [hash, downloadDir]);
		debug.log(`rTorrent: Set download directory for ${hash}: ${downloadDir}`);
	}
	// Set label (custom1)
	if (labels && labels.length > 0) {
		await makeXmlRpcRequest(serverConfig, 'd.custom1.set', [hash, labels[0]]);
		debug.log(`rTorrent: Set label for ${hash}: ${labels[0]}`);
	}
	// Set file priorities
	if (selectedFileIndices && Array.isArray(selectedFileIndices)) {
		// Get file count
		const fileCountResult = await makeXmlRpcRequest(serverConfig, 'd.size_files', [hash]);
		let fileCount = 0;
		if (fileCountResult.success && fileCountResult.data) {
			fileCount = parseInt(fileCountResult.data, 10);
		}
		for (let i = 0; i < fileCount; i++) {
			const wanted = selectedFileIndices.includes(i) ? 1 : 0;
			await makeXmlRpcRequest(serverConfig, 'f.priority.set', [hash, i, wanted]);
		}
		debug.log(`rTorrent: Set file priorities for ${hash}: wanted indices ${selectedFileIndices.join(',')}`);
	}

	return result;
}

export async function testConnection(serverConfig) {
	const result = await makeXmlRpcRequest(serverConfig, 'system.client_version', []);
	if (result.success) {
		return { success: true, data: { version: result.data } };
	}
	return {
		success: false,
		error: result.error || {
			userMessage: "Failed to connect or get rTorrent version.",
			errorCode: "TEST_CONN_FAILED"
		}
	};
}
