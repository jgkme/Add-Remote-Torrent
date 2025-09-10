// console.log("[ART Background] Service worker script loaded and running! (Minimal test)");
// const ART_BACKGROUND_LOADED = true; // Add a non-console statement

import { debug } from './debug';
import { getClientApi } from './api_handlers/api_client_factory.js';
import bencode from 'bencode'; // Use 'bencode' library, consistent with confirmAdd.js

// Global manager for the offscreen document
const offscreenDocumentManager = {
    creatingPromise: null,
    isReady: false,
    readyPromise: null,
    resolveReadyPromise: null,
    _setupReadyPromise: function() { 
        this.readyPromise = new Promise(resolve => {
            this.resolveReadyPromise = resolve;
        });
    },
    ensureReady: async function() {
        if (this.isReady) return;
        if (this.readyPromise) { 
            debug.log('[ART Background] Offscreen Manager: Waiting on existing readyPromise.');
            await this.readyPromise;
        }
    },
    markAsCreating: function() {
        this._setupReadyPromise(); 
        this.isReady = false; 
    },
    markAsReady: function() {
        this.isReady = true;
        if (this.resolveReadyPromise) {
            this.resolveReadyPromise();
        }
    },
    setCreatingPromise: function(promise) {
        this.creatingPromise = promise;
    },
    clearCreatingPromise: function() {
        this.creatingPromise = null;
    }
};
offscreenDocumentManager._setupReadyPromise(); // Initial setup

let dialogWindow = null;
const popAdvancedDialog = async (url, targetServer) => {
    debug.log("[ART Background] Creating advanced dialog. Link URL:", url, "Server ID:", targetServer.id, "Server Name:", targetServer.name);

    if (dialogWindow?.id) {
        // Make sure existing popups are closed before opening a new one
        chrome.windows.remove(dialogWindow.id).catch(() => {}); // Silently ignore errors
        dialogWindow = null;
    }

    const dialogUrl = chrome.runtime.getURL('confirmAdd/confirmAdd.html') +
        `?url=${encodeURIComponent(url || '')}&serverId=${encodeURIComponent(targetServer.id || '')}`;

    dialogWindow = await chrome.windows.create({
        url: dialogUrl,
        type: 'popup',
        width: 600,
        height: 580
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debug.log("[ART Background] Received message:", request); 

  if (request.action === 'offscreenReady') {
    debug.log('[ART Background] Received offscreenReady message from offscreen document.');
    offscreenDocumentManager.markAsReady();
    sendResponse({ status: 'Offscreen document ready acknowledged by service worker.' });
    return false; 
  }

  if (request.action === 'getStorageData') {
    chrome.storage.local.get([
        'servers',
        'activeServerId',
        'linkCatchingPatterns',
        'catchfrompage',
        'registerDelay',
        'linksfoundindicator',
        'contentDebugEnabled',
        'bgDebugEnabled',
    ], (result) => {
        if (chrome.runtime.lastError) {
            debug.error("Error in getStorageData:", chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
        }

        // Also update debug state (in background-script) when content_script reloads
        debug.setEnabled(result.bgDebugEnabled);

        const responsePayload = {
            ...result,
            servers: JSON.stringify(result.servers || []) 
        };
        sendResponse(responsePayload);
    });
    return true; 
  } else if (request.action === 'setStorageData') {
    let dataToStore = { ...request.data };
    if (dataToStore.servers && typeof dataToStore.servers === 'string') {
        try {
            dataToStore.servers = JSON.parse(dataToStore.servers);
        } catch (e) {
            debug.error("Error parsing servers string in setStorageData:", e);
            sendResponse({ success: false, error: "Invalid servers data format." });
            return true;
        }
    }
    chrome.storage.local.set(dataToStore, () => {
        if (chrome.runtime.lastError) {
            debug.error("Error in setStorageData:", chrome.runtime.lastError.message);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
            sendResponse({ success: true });
        }
    });
    return true;
  } else if (request.action === 'updateBadge') {
    const { count } = request;
    const text = count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text: text, tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: sender.tab.id });
    sendResponse({ status: "Badge updated." });
    return false;
  } else if (request.action === 'testConnection') {
    const serverConfig = request.config; 
    if (!serverConfig || !serverConfig.clientType || !serverConfig.url) {
      sendResponse({ success: false, message: 'Server configuration is incomplete for testing connection.' });
      return true; 
    }
    const apiClient = getClientApi(serverConfig.clientType);
    apiClient.testConnection(serverConfig)
      .then(response => {
        sendResponse(response); 
      })
      .catch(error => {
        debug.error(`Error during testConnection for ${serverConfig.clientType}:`, error);
        sendResponse({ success: false, message: `Failed to test connection: ${error.message}` });
      });
    return true; 
  } else if (request.action === 'addTorrentManually' && request.url) {
    addTorrentToClient(request.url);
    return false; 
  } else if (request.action === 'addTorrentWithCustomParams' && request.params) {
    const { url, server, tags, category, addPaused, selectedFileIndices, totalFileCount, downloadDir, contentLayout } = request.params;
    addTorrentToClient(url, server, tags, category, addPaused, null, downloadDir, selectedFileIndices, totalFileCount, contentLayout);
    return false; 
  } else if (request.action === 'addTorrent' && request.url) {
    const { url, pageUrl } = request;
    (async () => {
      try {
        const targetServer = await determineTargetServer(pageUrl);
        if (targetServer) {
          const { advancedAddDialog } = await chrome.storage.local.get('advancedAddDialog');
          const showAdvancedDialog = ['always', 'catch'].includes(advancedAddDialog);
          if (showAdvancedDialog) {
              popAdvancedDialog(url, targetServer);
          } else {
              addTorrentToClient(url, targetServer, null, null, null, pageUrl);
          }
          sendResponse({ status: "Torrent add request sent to background." });
        } else {
          const msg = 'No target server could be determined. Please configure servers in options and select an active one in the popup.';
          debug.log("[ART Background] Creating error notification (no target server):", msg);
          chrome.notifications.create({
            type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent Error',
            message: msg
          });
          updateActionHistory(msg);
          sendResponse({ error: msg });
        }
      } catch (error) {
        debug.error("Error in addTorrent action:", error);
        const errorMsg = `Error processing torrent link: ${error.message}`;
        chrome.notifications.create({
          type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent Error',
          message: errorMsg
        });
        updateActionHistory(errorMsg);
        sendResponse({ error: errorMsg });
      }
    })();
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  // Check and add default debug settings if missing
  let { contentDebugEnabled, bgDebugEnabled } = await chrome.storage.local.get(['contentDebugEnabled', 'bgDebugEnabled']);
    if (!Array.isArray(contentDebugEnabled)) {
        contentDebugEnabled = ['error'];
        chrome.storage.local.set({ contentDebugEnabled }, () => {});
    }
  if (!Array.isArray(bgDebugEnabled)) {
    bgDebugEnabled = ['log', 'warn', 'error'];
    chrome.storage.local.set({ bgDebugEnabled }, () => {});
  }
  debug.setEnabled(bgDebugEnabled);

  debug.log("[ART Background] onInstalled event triggered.");
  createContextMenus();
  // Setup the periodic server status check alarm
  chrome.alarms.create('serverStatusCheck', {
    delayInMinutes: 1, // Check 1 minute after startup
    periodInMinutes: 15 // Then check every 15 minutes
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'serverStatusCheck') {
        debug.log('[ART Background] Running periodic server status check...');
        const { servers } = await chrome.storage.local.get('servers');
        if (!servers || servers.length === 0) {
            debug.log('[ART Background] No servers configured, skipping status check.');
            return;
        }

        const updatedServers = await Promise.all(servers.map(async (server) => {
            const apiClient = getClientApi(server.clientType);
            if (!apiClient) {
                return { ...server, status: 'offline', lastChecked: new Date().toISOString() };
            }
            try {
                const result = await apiClient.testConnection(server);
                return { 
                    ...server, 
                    status: result.success ? 'online' : 'offline', 
                    lastChecked: new Date().toISOString(),
                    version: result.success ? result.data.version : server.version, // Update version/freespace on successful check
                    freeSpace: result.success ? result.data.freeSpace : server.freeSpace
                };
            } catch (e) {
                return { ...server, status: 'offline', lastChecked: new Date().toISOString() };
            }
        }));

        await chrome.storage.local.set({ servers: updatedServers });
        debug.log('[ART Background] Server status check complete. Updated server statuses in storage.');
    }
});

// Listen for storage changes to update context menu when servers are modified
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && (changes.servers || changes.enableServerSpecificContextMenu || changes.showDownloadDirInContextMenu)) {
    debug.log("[ART Background] Servers or context menu setting changed, updating context menu.");
    createContextMenus();
  }
});

// Function to create context menus dynamically based on registered servers
async function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      debug.error("Error removing context menus:", chrome.runtime.lastError.message);
    }
    
    chrome.storage.local.get(['servers', 'activeServerId', 'enableServerSpecificContextMenu', 'showDownloadDirInContextMenu'], (result) => {
      const servers = result.servers || [];
      const activeServerId = result.activeServerId;
      const enableServerSpecificContextMenu = result.enableServerSpecificContextMenu || false;
      const showDownloadDirInContextMenu = result.showDownloadDirInContextMenu || false;
      
      if (servers.length === 0) {
        chrome.contextMenus.create({
          id: "addTorrentSubmenu",
          title: "Add Torrent to Remote WebUI (No servers configured)",
          contexts: ["link"],
          enabled: false
        });
        return;
      }

      const parentId = chrome.contextMenus.create({
        id: "addTorrentParent",
        title: "Add Torrent to Remote WebUI",
        contexts: ["link"]
      });

      if (enableServerSpecificContextMenu) {
        // Show all servers, each with its own directory submenu
        servers.forEach(server => {
          const serverMenuId = `server_${server.id}`;
          chrome.contextMenus.create({
            id: serverMenuId,
            parentId: parentId,
            title: server.name,
            contexts: ["link"]
          });

          if (showDownloadDirInContextMenu) {
            const directories = server.downloadDirectories ? server.downloadDirectories.split(',').map(d => d.trim()).filter(d => d) : [];
            if (directories.length > 0) {
              directories.forEach(dir => {
                chrome.contextMenus.create({
                  id: `${server.id}|${dir}`,
                  parentId: serverMenuId,
                  title: dir,
                  contexts: ["link"]
                });
              });
            }
          }
        });
      } else {
        // Show only the active server with its directory submenu
        const activeServer = servers.find(s => s.id === activeServerId);
        if (activeServer) {
          if (showDownloadDirInContextMenu) {
            const directories = activeServer.downloadDirectories ? activeServer.downloadDirectories.split(',').map(d => d.trim()).filter(d => d) : [];
            if (directories.length > 0) {
              const serverMenuId = `server_${activeServer.id}`;
              chrome.contextMenus.create({
                id: serverMenuId,
                parentId: parentId,
                title: `Add to ${activeServer.name}`,
                contexts: ["link"]
              });
              directories.forEach(dir => {
                chrome.contextMenus.create({
                  id: `${activeServer.id}|${dir}`,
                  parentId: serverMenuId,
                  title: dir,
                  contexts: ["link"]
                });
              });
            } else {
              // If no directories, make the parent menu item clickable
              chrome.contextMenus.create({
                id: `server_${activeServer.id}`,
                parentId: parentId,
                title: `Add to ${activeServer.name}`
              });
            }
          } else {
            chrome.contextMenus.create({
              id: `server_${activeServer.id}`,
              parentId: parentId,
              title: `Add to ${activeServer.name}`
            });
          }
        }
      }
    });
  });
}

async function getActiveServerSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['servers', 'activeServerId'], (result) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      const servers = result.servers || [];
      const activeId = result.activeServerId;
      if (!activeId || servers.length === 0) {
        return resolve(null); 
      }
      const activeServer = servers.find(s => s.id === activeId);
      resolve(activeServer || null); 
    });
  });
}

async function determineTargetServer(pageUrl) {
    const settings = await chrome.storage.local.get([
        'servers', 
        'activeServerId', 
        'urlToServerMappings', 
        'enableUrlBasedServerSelection'
    ]);
    const servers = settings.servers || [];
    if (servers.length === 0) return null; 
    let targetServerId = settings.activeServerId; 
    if (settings.enableUrlBasedServerSelection && settings.urlToServerMappings && settings.urlToServerMappings.length > 0 && pageUrl) {
        const mappings = settings.urlToServerMappings;
        try {
            const currentHostname = new URL(pageUrl).hostname;
            for (const mapping of mappings) {
                const pattern = mapping.websitePattern;
                let matched = false;
                if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
                    if (pageUrl.startsWith(pattern)) {
                        matched = true;
                    }
                } else {
                    if (currentHostname === pattern || currentHostname.endsWith(`.${pattern}`)) {
                        matched = true;
                    }
                }
                if (matched) {
                    targetServerId = mapping.serverId;
                    break; 
                }
            }
        } catch (e) {
            debug.error("[TorrentAdder] Error parsing pageUrl for rule matching:", e);
        }
    }
    const targetServer = servers.find(s => s.id === targetServerId);
    if (!targetServer && servers.length > 0) {
        debug.warn(`[TorrentAdder] Target server ID "${targetServerId}" not found or invalid, falling back to first available server.`);
        return servers[0]; 
    }
    return targetServer || null;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const OFFSCREEN_DOCUMENT_PATH = 'offscreen_audio.html';

async function hasOffscreenDocument() {
    if (chrome.runtime.getContexts) { 
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
        });
        return existingContexts.length > 0;
    }
    return false; 
}

async function setupOffscreenDocument() {
    debug.log('[ART Background] setupOffscreenDocument: Checking status. isReady:', offscreenDocumentManager.isReady);
    if (await hasOffscreenDocument()) {
        debug.log('[ART Background] setupOffscreenDocument: Document already exists.');
        if (!offscreenDocumentManager.isReady) {
            debug.log('[ART Background] setupOffscreenDocument: Document exists but not marked ready. Waiting for readyPromise.');
            await offscreenDocumentManager.readyPromise;
        }
        debug.log('[ART Background] setupOffscreenDocument: Document confirmed ready or became ready.');
        return;
    }

    if (offscreenDocumentManager.creatingPromise) {
        debug.log('[ART Background] setupOffscreenDocument: Creation already in progress. Waiting.');
        await offscreenDocumentManager.creatingPromise;
        if (!offscreenDocumentManager.isReady) { 
             debug.log('[ART Background] setupOffscreenDocument: Waited for creation, now waiting for readyPromise again.');
             await offscreenDocumentManager.readyPromise;
        }
        return;
    }

    debug.log('[ART Background] setupOffscreenDocument: Creating new offscreen document.');
    offscreenDocumentManager.markAsCreating(); 

    const promise = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'Play notification sounds for torrent additions.',
    });
    offscreenDocumentManager.setCreatingPromise(promise);

    try {
        await promise;
        debug.log('[ART Background] setupOffscreenDocument: chrome.offscreen.createDocument resolved. Waiting for readyPromise (offscreenReady message).');
        await offscreenDocumentManager.readyPromise; 
        debug.log('[ART Background] setupOffscreenDocument: Offscreen document is now fully ready.');
    } catch (error) {
        if (error.message.startsWith('Only a single offscreen document may be created')) {
            debug.warn('[ART Background] setupOffscreenDocument: Race condition - document created by another call. Waiting for its readyPromise.');
            if (!offscreenDocumentManager.isReady) {
                 await offscreenDocumentManager.readyPromise;
            }
        } else {
            debug.error('[ART Background] setupOffscreenDocument: Error creating offscreen document:', error);
            offscreenDocumentManager.isReady = false;
            offscreenDocumentManager._setupReadyPromise(); 
            throw error; 
        }
    } finally {
        offscreenDocumentManager.clearCreatingPromise();
    }
}


async function updateActionHistory(newMessage) {
    const { actionHistory = [] } = await chrome.storage.local.get('actionHistory');
    const timestamp = new Date().toISOString();
    actionHistory.unshift({ message: newMessage, timestamp }); // Add new message to the front
    const truncatedHistory = actionHistory.slice(0, 10); // Keep only the last 10
    await chrome.storage.local.set({ actionHistory: truncatedHistory, lastActionStatus: newMessage }); // Keep lastActionStatus for popup
}

async function playSound(soundFile) {
  try {
    const { enableSoundNotifications } = await chrome.storage.local.get('enableSoundNotifications');
    if (!enableSoundNotifications) {
      return;
    }

    await setupOffscreenDocument(); 

    if (offscreenDocumentManager.isReady) {
        debug.log('[ART Background] playSound: Sending message to offscreen document for:', soundFile);
        chrome.runtime.sendMessage({
            action: 'playSound',
            soundFile: chrome.runtime.getURL(soundFile)
        }, (response) => {
            if (chrome.runtime.lastError) {
                debug.warn('[ART Background] playSound: Error sending message to offscreen document:', chrome.runtime.lastError.message, 'Sound file:', soundFile);
            } else if (response && response.error) {
                debug.warn('[ART Background] playSound: Offscreen document reported error playing sound:', response.error, 'Sound file:', soundFile);
            } else if (response && response.success) {
                debug.log('[ART Background] playSound: Offscreen document confirmed sound played for:', soundFile);
            } else {
                debug.warn('[ART Background] playSound: No specific response or error from offscreen document for:', soundFile, 'Response:', response);
            }
        });
    } else {
        debug.warn('[ART Background] Offscreen document not ready or available after setup to play sound:', soundFile);
    }

  } catch (e) {
    debug.warn(`[ART Background] Error in playSound setup or message sending:`, e);
  }
}

async function applyTrackerRulesLogic(announceUrls, currentTorrentOptions, currentTagsToUse) {
    let appliedRule = false;
    const { trackerUrlRules } = await chrome.storage.local.get('trackerUrlRules');

    if (trackerUrlRules && trackerUrlRules.length > 0 && announceUrls && announceUrls.length > 0) {
        debug.log('[ART Background] applyTrackerRulesLogic: Checking rules against announce URLs:', announceUrls);
        for (const rule of trackerUrlRules) {
            for (const announceUrl of announceUrls) {
                if (announceUrl.includes(rule.trackerUrlPattern)) {
                    debug.log(`[ART Background] Tracker rule matched: Pattern "${rule.trackerUrlPattern}" found in "${announceUrl}"`);
                    if (rule.label) {
                        currentTorrentOptions.category = rule.label;
                        currentTorrentOptions.labels = [rule.label];
                        if (currentTagsToUse) {
                             currentTorrentOptions.labels = currentTorrentOptions.labels.concat(currentTagsToUse.split(',').map(t => t.trim()).filter(t => t && t !== rule.label));
                        }
                        debug.log(`[ART Background] Applied label from rule: "${rule.label}"`);
                        appliedRule = true;
                    }
                    if (rule.directory) {
                        currentTorrentOptions.downloadDir = rule.directory;
                        debug.log(`[ART Background] Applied directory from rule: "${rule.directory}"`);
                        appliedRule = true;
                    }
                    if (appliedRule) break; 
                }
            }
            if (appliedRule) break; 
        }
    } else {
        debug.log('[ART Background] applyTrackerRulesLogic: No tracker rules configured or no/empty announce URLs to process.');
    }
    return { wasRuleApplied: appliedRule, torrentOptions: currentTorrentOptions };
}


async function addTorrentToClient(torrentUrl, serverConfigFromDialog = null, customTags = null, customCategory = null, customAddPaused = null, sourcePageUrl = null, customDownloadDir = null, selectedFileIndices = undefined, totalFileCount = undefined, customContentLayout = null) {
  let serverToUse = null;
  let serverDeterminedByRule = false;

  // Determine server logic:
  // 1. Check if a URL rule matches. If so, the rule-based server wins.
  // 2. If no rule matches, use the server from the context menu click (serverConfigFromDialog).
  // 3. If neither of the above, use the active server (which is the fallback inside determineTargetServer).
  
  const { activeServerId, enableUrlBasedServerSelection } = await chrome.storage.local.get(['activeServerId', 'enableUrlBasedServerSelection']);
  const ruleBasedServer = await determineTargetServer(sourcePageUrl);

  let useRuleServer = false;
  if (enableUrlBasedServerSelection && ruleBasedServer && ruleBasedServer.id !== activeServerId) {
      // A rule matched and gave a server different from the active one. This is a strong signal.
      useRuleServer = true;
      serverDeterminedByRule = true;
  } else if (enableUrlBasedServerSelection && ruleBasedServer && !activeServerId) {
      // Case where there is no active server set, but a rule matches.
      useRuleServer = true;
      serverDeterminedByRule = true;
  }

  if (useRuleServer) {
      serverToUse = ruleBasedServer;
  } else {
      // If no rule applied, use the server from the context click (if provided),
      // otherwise, fall back to the result from determineTargetServer (which would be the active server).
      serverToUse = serverConfigFromDialog || ruleBasedServer;
  }
  
  // Final fallback if no server could be determined at all.
  if (!serverToUse) {
    const { servers } = await chrome.storage.local.get('servers');
    if (servers && servers.length > 0) {
        serverToUse = servers.find(s => s.id === activeServerId) || servers[0];
    }
  }
  
  if (!serverToUse) {
    const msg = 'No target server could be determined. Please configure servers in options and select an active one in the popup.';
    debug.log("[ART Background] Creating error notification (no target server):", msg);
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent Error',
      message: msg
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        debug.error("[ART Background] Error creating no target server notification:", chrome.runtime.lastError.message);
      } else {
        debug.log("[ART Background] Notification created (no target server), ID:", notificationId);
      }
    });
    updateActionHistory(msg);
    return;
  }

  const tagsToUse = customTags !== null ? customTags : (serverToUse.tags || '');
  let categoryToUse = customCategory !== null ? customCategory : (serverToUse.category || ''); 
  let downloadDirToUse = customDownloadDir !== null ? customDownloadDir : (serverToUse.downloadDir || null); 

  let labelsArray = [];
  if (categoryToUse) labelsArray.push(categoryToUse); 
  if (tagsToUse) labelsArray = labelsArray.concat(tagsToUse.split(',').map(t => t.trim()).filter(t => t));
  
  let torrentOptions = { 
    downloadDir: downloadDirToUse, 
    paused: customAddPaused !== null ? customAddPaused : (serverToUse.addPaused || false),
    tags: tagsToUse, 
    category: categoryToUse, 
    labels: labelsArray,
    selectedFileIndices: selectedFileIndices,
    totalFileCount: totalFileCount,
    contentLayout: customContentLayout,
    torrentFileContentBase64: null, 
    originalTorrentUrl: torrentUrl 
  };

  const isMagnet = torrentUrl.startsWith("magnet:");
  let wasRuleApplied = false; 
  
  if (!isMagnet) { 
    debug.log(`[ART Background] Non-magnet link: ${torrentUrl}. Attempting to fetch content to check if it's a .torrent file.`);
    try {
      const response = await fetch(torrentUrl, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      debug.log(`[ART Background] Fetched ${torrentUrl}, Content-Type: ${contentType}`);
      if (contentType && (contentType.includes('application/x-bittorrent') || contentType.includes('application/octet-stream') || contentType.includes('application/torrent'))) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          torrentOptions.torrentFileContentBase64 = arrayBufferToBase64(arrayBuffer);
          debug.log(`[ART Background] Successfully fetched and base64 encoded .torrent content (Content-Type: ${contentType}) for: ${torrentUrl}`);
        } else {
          debug.warn(`[ART Background] URL ${torrentUrl} had .torrent Content-Type but empty/invalid body. Sending URL to client.`);
          torrentOptions.torrentFileContentBase64 = null; 
        }
      } else {
        debug.warn(`[ART Background] URL ${torrentUrl} did not return a .torrent Content-Type (got: ${contentType}). Assuming it is a torrent and attempting to use content anyway.`);
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          torrentOptions.torrentFileContentBase64 = arrayBufferToBase64(arrayBuffer);
          debug.log(`[ART Background] Successfully fetched and base64 encoded content despite wrong Content-Type for: ${torrentUrl}`);
        } else {
          debug.warn(`[ART Background] URL ${torrentUrl} had wrong Content-Type and empty/invalid body. Sending URL to client.`);
          torrentOptions.torrentFileContentBase64 = null;
        }
      }

    } catch (fetchError) {
      debug.warn(`[ART Background] Error attempting to fetch content for ${torrentUrl}:`, fetchError.message, ". Will send URL to client as is.");
      torrentOptions.torrentFileContentBase64 = null; 
    }
  }

  // Apply Tracker URL Rules
  let ruleApplicationResult; 

  if (isMagnet) {
    debug.log('[ART Background] Applying tracker URL rules for magnet link...');
    const magnetTrackers = [];
    try {
        const urlParams = new URLSearchParams(torrentUrl.substring(torrentUrl.indexOf('?') + 1));
        urlParams.forEach((value, key) => {
            if (key === 'tr') {
                magnetTrackers.push(decodeURIComponent(value)); 
            }
        });
    } catch(e) {
        debug.error('[ART Background] Error parsing magnet link for trackers:', e);
    }
    if (magnetTrackers.length > 0) {
        debug.log('[ART Background] Extracted magnet trackers:', magnetTrackers);
        let tempOptions = {...torrentOptions}; // Operate on a copy for rule application
        ruleApplicationResult = await applyTrackerRulesLogic(magnetTrackers, tempOptions, tagsToUse);
        torrentOptions = ruleApplicationResult.torrentOptions; 
    } else {
        ruleApplicationResult = { wasRuleApplied: false, torrentOptions }; // No trackers, no rules applied
    }
  } else if (torrentOptions.torrentFileContentBase64) {
    debug.log('[ART Background] Applying tracker URL rules for .torrent file...');
    try {
      const torrentDataBuffer = Uint8Array.from(atob(torrentOptions.torrentFileContentBase64), c => c.charCodeAt(0));
      const decodedTorrent = bencode.decode(torrentDataBuffer);
      let announceUrls = [];
      const decoder = new TextDecoder('utf-8');
      if (decodedTorrent.announce) {
        announceUrls.push(decoder.decode(decodedTorrent.announce));
      }
      if (decodedTorrent['announce-list'] && Array.isArray(decodedTorrent['announce-list'])) {
        decodedTorrent['announce-list'].forEach(tier => {
          if (Array.isArray(tier)) {
            tier.forEach(tracker => announceUrls.push(decoder.decode(tracker)));
          }
        });
      }
      announceUrls = [...new Set(announceUrls)];
      debug.log('[ART Background] Extracted .torrent announce URLs:', announceUrls);
      if (announceUrls.length > 0) {
        let tempOptions = {...torrentOptions}; // Operate on a copy
        ruleApplicationResult = await applyTrackerRulesLogic(announceUrls, tempOptions, tagsToUse);
        torrentOptions = ruleApplicationResult.torrentOptions; 
      } else {
        ruleApplicationResult = { wasRuleApplied: false, torrentOptions }; // No announce URLs, no rules applied
      }
    } catch (e) {
      debug.error('[ART Background] Error decoding .torrent or extracting trackers for rules:', e);
      ruleApplicationResult = { wasRuleApplied: false, torrentOptions }; // Error, no rules applied
    }
  } else {
    ruleApplicationResult = { wasRuleApplied: false, torrentOptions }; // Not a magnet, no .torrent content
  }
  
  wasRuleApplied = ruleApplicationResult.wasRuleApplied;

  const { name: serverName, clientType } = serverToUse; 
  const apiClient = getClientApi(clientType);

  if (!apiClient || typeof apiClient.addTorrent !== 'function') {
    const errorMsg = `No valid API handler found for client type: ${clientType}`;
    debug.error(errorMsg);
    debug.log("[ART Background] Creating error notification (no API handler):", errorMsg);
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent Error', message: errorMsg }, (notificationId) => {
      if (chrome.runtime.lastError) {
        debug.error("[ART Background] Error creating no API handler notification:", chrome.runtime.lastError.message);
      } else {
        debug.log("[ART Background] Notification created (no API handler), ID:", notificationId);
      }
    });
    updateActionHistory(errorMsg);
    return;
  }

  try {
    const { enableTextNotifications } = await chrome.storage.local.get('enableTextNotifications');
    const result = await apiClient.addTorrent(torrentOptions.originalTorrentUrl, serverToUse, torrentOptions);
    if (result.success) {
      let successMsg = `Successfully added to "${serverName}" (${clientType}): ${torrentUrl.substring(0, 50)}...`;
      if (result.duplicate) {
        successMsg = `Torrent already exists on "${serverName}" (${clientType}): ${torrentUrl.substring(0, 50)}...`;
      }
      if (serverDeterminedByRule) {
        successMsg += ` (Rule based)`;
      }
      if (wasRuleApplied) {
        successMsg += ` (Tracker rule applied)`;
      }
      if (enableTextNotifications) {
        debug.log("[ART Background] Creating success notification:", successMsg);
        chrome.notifications.create({
          type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent', 
          message: successMsg
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            debug.error("[ART Background] Error creating success notification:", chrome.runtime.lastError.message);
          } else {
            debug.log("[ART Background] Notification created (success), ID:", notificationId);
          }
        });
      }
      playSound('audio/success.mp3'); 
      updateActionHistory(successMsg);
    } else {
      let userFriendlyError = `Failed to add torrent to "${serverName}" (${clientType}).`;
      if (result.error && typeof result.error === 'object' && result.error.userMessage) {
        userFriendlyError = result.error.userMessage;
        debug.error(`Error adding torrent: ${result.error.technicalDetail || ''} (Code: ${result.error.errorCode || 'N/A'})`);
      } else if (result.error) { 
        userFriendlyError = String(result.error);
        debug.error(`Error adding torrent (string): ${result.error}`);
      }
      throw new Error(userFriendlyError); 
    }
  } catch (error) { 
    const { enableTextNotifications } = await chrome.storage.local.get('enableTextNotifications');
    debug.error(`Error in addTorrentToClient for "${serverName}" (${clientType}):`, error.message);
    const notificationErrorMessage = error.message.substring(0, 150);
    if (enableTextNotifications) {
      debug.log("[ART Background] Creating error notification (addTorrentToClient catch):", notificationErrorMessage);
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent Error',
        message: notificationErrorMessage
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          debug.error("[ART Background] Error creating addTorrentToClient catch notification:", chrome.runtime.lastError.message);
        } else {
            debug.log("[ART Background] Notification created (addTorrentToClient catch), ID:", notificationId);
          }
        });
    }
      playSound('audio/failure.mp3'); 
      updateActionHistory(notificationErrorMessage);
  }
}

chrome.action.onClicked.addListener((tab) => {
    chrome.windows.create({
        url: 'add/add.html',
        type: 'popup',
        width: 400,
        height: 200
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuItemId = String(info.menuItemId);
  const linkUrl = info.linkUrl;

  if (!linkUrl) return;

  let serverId;
  let downloadDir = null;

  if (menuItemId.includes('|')) {
    [serverId, downloadDir] = menuItemId.split('|');
  } else if (menuItemId.startsWith('server_')) {
    serverId = menuItemId.replace('server_', '');
  } else if (menuItemId === 'addTorrentParent') {
    const activeServer = await getActiveServerSettings();
    if (activeServer) {
      serverId = activeServer.id;
    }
  } else {
    return; // Not a menu item we handle
  }

  if (!serverId) {
    debug.error("Could not determine a server ID from the context menu click.");
    return;
  }

  const { servers } = await chrome.storage.local.get('servers');
  const selectedServer = (servers || []).find(s => s.id === serverId);

  if (!selectedServer) {
    debug.error(`Server not found for ID: ${serverId}`);
    return;
  }

  debug.log(`[ART Background] Context menu clicked. Server: ${selectedServer.name}, Directory: ${downloadDir || 'Default'}`);

  const { advancedAddDialog } = await chrome.storage.local.get('advancedAddDialog');
  const showAdvancedDialog = ['always', 'manual'].includes(advancedAddDialog);

  if (showAdvancedDialog) {
    popAdvancedDialog(linkUrl, selectedServer);
  } else {
    addTorrentToClient(linkUrl, selectedServer, null, null, null, info.pageUrl, downloadDir);
  }
});
