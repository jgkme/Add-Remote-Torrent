// console.log("[RTWA Background] Service worker script loaded and running! (Minimal test)");
// const RTA_BACKGROUND_LOADED = true; // Add a non-console statement

import { getClientApi } from './api_handlers/api_client_factory.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Log all incoming messages for debugging
  console.log("[RTWA Background] Received message:", request); // Uncommented for this debugging session

  if (request.action === 'getStorageData') {
    // Content script needs: servers (as JSON string), activeServerId, linkmatches, 
    // catchfrompage, registerDelay, linksfoundindicator, and potentially client-specific "ask" flags.
    // We need to define where linkmatches, catchfrompage etc. are stored. Assume global settings for now.
    chrome.storage.local.get([
        'servers', 
        'activeServerId', 
        'linkmatches', // Need to add to storage if not there
        'catchfrompage', // Need to add to storage
        'registerDelay', // Need to add to storage
        'linksfoundindicator', // Need to add to storage
        // Add any other global settings the content script might need
    ], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error in getStorageData:", chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
        }
        // Content script expects servers as a JSON string
        const responsePayload = {
            ...result,
            servers: JSON.stringify(result.servers || []) 
        };
        // console.log("Sending to content script:", responsePayload);
        sendResponse(responsePayload);
    });
    return true; // Indicates that the response will be sent asynchronously
  } else if (request.action === 'setStorageData') {
    // Content script sends the entire data object to be saved.
    // This is used by its setNewSettings to update dirlist/labellist.
    // The 'data' object from content script will have 'servers' as a JSON string.
    // We need to parse it before saving if our main storage expects an array.
    // However, the content script's setNewSettings seems to expect the background to handle
    // the full settings object as it was retrieved.
    // Let's assume request.data contains keys like 'servers' (JSON string), 'activeServerId', etc.
    // and we save them directly.
    // A more robust approach would be to only update specific fields (e.g. a single server's dirlist/labellist).
    
    let dataToStore = { ...request.data };
    if (dataToStore.servers && typeof dataToStore.servers === 'string') {
        try {
            // Our main storage expects servers as an array of objects.
            dataToStore.servers = JSON.parse(dataToStore.servers);
        } catch (e) {
            console.error("Error parsing servers string in setStorageData:", e);
            sendResponse({ success: false, error: "Invalid servers data format." });
            return true;
        }
    }

    chrome.storage.local.set(dataToStore, () => {
        if (chrome.runtime.lastError) {
            console.error("Error in setStorageData:", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
            // console.log("Storage data set successfully by content script's request.");
            sendResponse({ success: true });
        }
    });
    return true;
  } else if (request.action === 'pageActionToggle') {
    // In MV3, page actions are different. We can use action.setIcon, action.setBadgeText, etc.
    // For now, just log. This indicates content script found links.
    console.log("pageActionToggle requested by content script. Tab ID:", sender.tab ? sender.tab.id : "unknown");
    // Example: chrome.action.setBadgeText({text: 'ON', tabId: sender.tab.id});
    sendResponse({ status: "Logged pageActionToggle request." }); // Acknowledge
    return false;
  } else if (request.action === 'testConnection') {
    const serverConfig = request.config; // Expect full server config including clientType

    if (!serverConfig || !serverConfig.clientType || !serverConfig.url) {
      sendResponse({ success: false, message: 'Server configuration is incomplete for testing connection.' });
      return true; 
    }

    const apiClient = getClientApi(serverConfig.clientType);
    
    apiClient.testConnection(serverConfig)
      .then(response => {
        sendResponse(response); // Send the response from the handler
      })
      .catch(error => {
        // This catch is for unexpected errors in testConnection itself or the promise chain
        console.error(`Error during testConnection for ${serverConfig.clientType}:`, error);
        sendResponse({ success: false, message: `Failed to test connection: ${error.message}` });
      });

    return true; // Indicates that the response will be sent asynchronously
  } else if (request.action === 'addTorrentManually' && request.url) {
    // Call the new addTorrentToClient function
    addTorrentToClient(request.url);
    // Optionally send an immediate response back to popup if needed,
    // but primary feedback is via storage update of lastActionStatus
    // sendResponse({status: "Processing..."});
    // For now, no direct response, relies on storage change for UI update.
    return false; // Or true if we were to send an async response
  } else if (request.action === 'addTorrentWithCustomParams' && request.params) {
    const { url, server, tags, category, addPaused, selectedFileIndices, totalFileCount } = request.params; // Added totalFileCount
    // Call addTorrentToClient, pass the server object and custom params directly
    addTorrentToClient(url, server, tags, category, addPaused, null, null, selectedFileIndices, totalFileCount); 
    return false; // No direct response needed
  } else if (request.action === 'addTorrent' && request.url) { // New message from content_script.js
    // This comes from the content script's on-page modal or direct click.
    // request includes: url, label, dir, server (full object), referer
    const { url, label, dir, server, referer } = request;
    
    let serverToUse = server; 
    if (!serverToUse || !serverToUse.id || !serverToUse.clientType) {
        console.error("Incomplete server data received from content script for addTorrent:", server);
    }
    addTorrentToClient(url, serverToUse, null, label, null, referer, dir);
    sendResponse({ status: "Torrent add request sent to background." }); 
    return false;
  } else if (request.action === 'getTorrentAddPreflightInfo') {
    const { linkUrl, pageUrl } = request;
    console.log(`[RTWA Background] Action getTorrentAddPreflightInfo: linkUrl=${linkUrl}, pageUrl=${pageUrl}`);
    (async () => {
      try {
        const targetServer = await determineTargetServer(pageUrl);
        console.log("[RTWA Background] Preflight - Determined targetServer:", targetServer ? {id: targetServer.id, name: targetServer.name, ask: targetServer.askForLabelDirOnPage} : null);

        if (targetServer && targetServer.askForLabelDirOnPage) {
          const serverInfo = { 
            id: targetServer.id, 
            name: targetServer.name, 
            clientType: targetServer.clientType,
            defaultLabel: targetServer.category || '', 
            defaultDir: targetServer.downloadDir || '',
            // Pass dirlist and labellist if they exist on the server object
            // These are expected to be JSON strings by the content script's modal
            dirlist: targetServer.dirlist || '[]', 
            labellist: targetServer.labellist || '[]'
          };
          console.log("[RTWA Background] Preflight - Responding: shouldShowModal=true, serverInfo:", serverInfo);
          sendResponse({ shouldShowModal: true, serverInfo: serverInfo, linkUrl: linkUrl });
        } else if (targetServer) {
          console.log(`[RTWA Background] Preflight: Modal not needed for ${targetServer.name}. Adding directly.`);
          addTorrentToClient(linkUrl, targetServer, null, null, null, pageUrl); 
          console.log("[RTWA Background] Preflight - Responding: shouldShowModal=false, addedDirectly=true");
          sendResponse({ shouldShowModal: false, addedDirectly: true }); 
        } else {
          console.log("[RTWA Background] Preflight - Responding: shouldShowModal=false, error: No target server.");
          sendResponse({ shouldShowModal: false, error: "No target server determined." });
        }
      } catch (e) {
        console.error("[RTWA Background] Error in getTorrentAddPreflightInfo:", e);
        sendResponse({ shouldShowModal: false, error: e.message });
      }
    })();
    return true; 
  }
});

// Create context menu items on installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log("[RTWA Background] onInstalled event triggered."); 
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error("Error removing context menus:", chrome.runtime.lastError.message);
    }

    chrome.contextMenus.create({
      id: "addTorrentGeneric",
      title: "Add Torrent to Remote WebUI",
      contexts: ["link"] 
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error creating 'Add Torrent to Remote WebUI' context menu:", chrome.runtime.lastError.message);
        chrome.notifications.create({
            type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Torrent Adder - Menu Error',
            message: 'Failed to create context menu. Please report this.'
        });
      } else {
        console.log('[RTWA Background] Generic torrent context menu ("addTorrentGeneric") registered.'); 
      }
    });
  });
});

// Helper function to get stored settings for the active server
async function getActiveServerSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['servers', 'activeServerId'], (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      const servers = result.servers || [];
      const activeId = result.activeServerId;
      if (!activeId || servers.length === 0) {
        return resolve(null); // No active server or no servers configured
      }
      const activeServer = servers.find(s => s.id === activeId);
      resolve(activeServer || null); // Return server or null if ID not found
    });
  });
}

// Helper function to determine target server based on URL rules or active selection
async function determineTargetServer(pageUrl) {
    const settings = await chrome.storage.local.get([
        'servers', 
        'activeServerId', 
        'urlToServerMappings', 
        'enableUrlBasedServerSelection'
    ]);

    const servers = settings.servers || [];
    if (servers.length === 0) return null; // No servers configured

    let targetServerId = settings.activeServerId; // Default to manually selected active server

    if (settings.enableUrlBasedServerSelection && settings.urlToServerMappings && settings.urlToServerMappings.length > 0 && pageUrl) {
        const mappings = settings.urlToServerMappings;
        try {
            const currentHostname = new URL(pageUrl).hostname;
            for (const mapping of mappings) {
                const pattern = mapping.websitePattern;
                let matched = false;
                if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
                    // Prefix match
                    if (pageUrl.startsWith(pattern)) {
                        matched = true;
                    }
                } else {
                    // Domain match (pattern is example.com, matches example.com, www.example.com, sub.example.com)
                    if (currentHostname === pattern || currentHostname.endsWith(`.${pattern}`)) {
                        matched = true;
                    }
                }
                if (matched) {
                    targetServerId = mapping.serverId;
                    // console.log(`[TorrentAdder] URL rule matched: ${pattern} -> server ${targetServerId}`);
                    break; // First match wins
                }
            }
        } catch (e) {
            console.error("[TorrentAdder] Error parsing pageUrl for rule matching:", e);
        }
    }
    
    const targetServer = servers.find(s => s.id === targetServerId);
    // If targetServerId from rule is invalid or activeServerId was initially invalid, try to find a fallback
    if (!targetServer && servers.length > 0) {
        console.warn(`[TorrentAdder] Target server ID "${targetServerId}" not found or invalid, falling back to first available server.`);
        return servers[0]; 
    }
    return targetServer || null;
}


// Main function to handle adding a torrent
async function addTorrentToClient(torrentUrl, serverConfigFromDialog = null, customTags = null, customCategory = null, customAddPaused = null, sourcePageUrl = null, customDownloadDir = null, selectedFileIndices = undefined, totalFileCount = undefined) {
  let serverToUse = serverConfigFromDialog; 
  let serverDeterminedByRule = false;

  if (!serverToUse) {
    try {
      serverToUse = await determineTargetServer(sourcePageUrl); 
      if (sourcePageUrl && serverToUse) { 
          const settings = await chrome.storage.local.get(['activeServerId', 'enableUrlBasedServerSelection']);
          if (settings.enableUrlBasedServerSelection && serverToUse.id !== settings.activeServerId) {
              serverDeterminedByRule = true; 
          }
      }
    } catch (error) {
      console.error("Error determining target server:", error);
      const errorMsg = `Error determining target server: ${error.message}`;
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder Error',
        message: errorMsg
      });
      chrome.storage.local.set({ lastActionStatus: errorMsg });
      return;
    }
  }
  
  if (!serverToUse) {
    const msg = 'No target server could be determined. Please configure servers in options and select an active one in the popup.';
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder Error',
      message: msg
    });
    chrome.storage.local.set({ lastActionStatus: msg });
    return;
  }

  const tagsToUse = customTags !== null ? customTags : (serverToUse.tags || '');
  const categoryToUse = customCategory !== null ? customCategory : (serverToUse.category || ''); 
  const addPausedToUse = customAddPaused !== null ? customAddPaused : (serverToUse.addPaused || false);
  const downloadDirToUse = customDownloadDir !== null ? customDownloadDir : (serverToUse.downloadDir || null); 

  let labelsArray = [];
  if (categoryToUse) labelsArray.push(categoryToUse); 
  if (tagsToUse) labelsArray = labelsArray.concat(tagsToUse.split(',').map(t => t.trim()).filter(t => t));
  
  const torrentOptions = {
    downloadDir: downloadDirToUse, 
    paused: addPausedToUse,
    tags: tagsToUse, 
    category: categoryToUse, 
    labels: labelsArray,
    selectedFileIndices: selectedFileIndices,
    totalFileCount: totalFileCount // Pass this to the API handler
  };

  const { name: serverName, clientType } = serverToUse; 
  const apiClient = getClientApi(clientType);

  if (!apiClient || typeof apiClient.addTorrent !== 'function') {
    const errorMsg = `No valid API handler found for client type: ${clientType}`;
    console.error(errorMsg);
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder Error', message: errorMsg });
    chrome.storage.local.set({ lastActionStatus: errorMsg });
    return;
  }

  try {
    const result = await apiClient.addTorrent(torrentUrl, serverToUse, torrentOptions);

    if (result.success) {
      let successMsg = `Successfully added to "${serverName}" (${clientType}): ${torrentUrl.substring(0, 50)}...`;
      if (result.duplicate) {
        successMsg = `Torrent already exists on "${serverName}" (${clientType}): ${torrentUrl.substring(0, 50)}...`;
      }
      if (serverDeterminedByRule) {
        successMsg += ` (Rule based)`;
      }
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder', 
        message: successMsg
      });
      chrome.storage.local.set({ lastActionStatus: successMsg });
    } else {
      let userFriendlyError = `Failed to add torrent to "${serverName}" (${clientType}).`;
      if (result.error && typeof result.error === 'object' && result.error.userMessage) {
        userFriendlyError = result.error.userMessage;
        console.error(`Error adding torrent: ${result.error.technicalDetail || ''} (Code: ${result.error.errorCode || 'N/A'})`);
      } else if (result.error) { 
        userFriendlyError = String(result.error);
        console.error(`Error adding torrent (string): ${result.error}`);
      }
      throw new Error(userFriendlyError); 
    }
  } catch (error) { 
    console.error(`Error in addTorrentToClient for "${serverName}" (${clientType}):`, error.message);
    const notificationErrorMessage = error.message.substring(0, 150); 
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder Error',
      message: notificationErrorMessage
    });
    chrome.storage.local.set({ lastActionStatus: notificationErrorMessage });
  }
}


// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addTorrentGeneric" && info.linkUrl) {
    const linkUrl = info.linkUrl;
    let isMagnet = linkUrl.startsWith("magnet:");
    // Regex to check for .torrent extension, allowing for query strings or fragments
    let isTorrentFile = /\.torrent($|\?|#)/i.test(linkUrl); 

    if (!isMagnet && !isTorrentFile) {
      console.log("Link is not a recognized magnet or .torrent file URL:", linkUrl);
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder',
        message: 'The clicked link is not a recognized magnet or .torrent file URL.'
      });
      return;
    }

    console.log(`[RTWA Background] Context menu clicked. Item ID: ${info.menuItemId}, Link URL: ${info.linkUrl}, Page URL: ${info.pageUrl}`);
    console.log(`[RTWA Background] Link type detection: isMagnet=${isMagnet}, isTorrentFile=${isTorrentFile}`);

    const settings = await chrome.storage.local.get(['showAdvancedAddDialog', 'servers', 'activeServerId', 'enableUrlBasedServerSelection', 'urlToServerMappings']);
    const showAdvancedDialog = settings.showAdvancedAddDialog || false;
    console.log("[RTWA Background] showAdvancedAddDialog from storage:", settings.showAdvancedAddDialog, "Effective value:", showAdvancedDialog);
    
    let serverForDialog = null; 
    let pageUrlForRules = info.pageUrl; 

    try {
        serverForDialog = await determineTargetServer(pageUrlForRules);
        console.log("[RTWA Background] Determined serverForDialog:", serverForDialog ? {id: serverForDialog.id, name: serverForDialog.name, clientType: serverForDialog.clientType } : null);
    } catch (e) { 
        console.error("[RTWA Background] Error in determineTargetServer:", e);
        const errorMsg = `Error determining server: ${e.message}`;
        chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder Error', message: errorMsg });
        chrome.storage.local.set({ lastActionStatus: errorMsg });
        return; 
    }

    if (!serverForDialog || !serverForDialog.clientType) { 
        const msg = 'No target server determined or server config is incomplete (missing clientType). Configure servers in options.';
        chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon48.svg', title: 'Remote Torrent Adder Error', message: msg });
        chrome.storage.local.set({ lastActionStatus: msg });
        return;
    }

    if (showAdvancedDialog) {
      console.log("[RTWA Background] Creating advanced dialog. Link URL:", info.linkUrl, "Server ID:", serverForDialog.id, "Server Name:", serverForDialog.name);
      const dialogUrl = chrome.runtime.getURL('confirmAdd/confirmAdd.html') +
                        `?url=${encodeURIComponent(info.linkUrl || '')}&serverId=${encodeURIComponent(serverForDialog.id || '')}`; 
      chrome.windows.create({
        url: dialogUrl,
        type: 'popup',
        width: 600, // Increased width
        height: 580 
      });
    } else {
      addTorrentToClient(info.linkUrl, serverForDialog, null, null, null, pageUrlForRules); 
    }
  }
});
