// console.log("[RTWA Background] Service worker script loaded and running! (Minimal test)");
// const RTA_BACKGROUND_LOADED = true; // Add a non-console statement

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
            console.log('[RTWA Background] Offscreen Manager: Waiting on existing readyPromise.');
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[RTWA Background] Received message:", request); 

  if (request.action === 'offscreenReady') {
    console.log('[RTWA Background] Received offscreenReady message from offscreen document.');
    offscreenDocumentManager.markAsReady();
    sendResponse({ status: 'Offscreen document ready acknowledged by service worker.' });
    return false; 
  }

  if (request.action === 'getStorageData') {
    chrome.storage.local.get([
        'servers', 
        'activeServerId', 
        'linkmatches', 
        'catchfrompage', 
        'registerDelay', 
        'linksfoundindicator', 
    ], (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error in getStorageData:", chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
        }
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
            sendResponse({ success: true });
        }
    });
    return true;
  } else if (request.action === 'pageActionToggle') {
    console.log("pageActionToggle requested by content script. Tab ID:", sender.tab ? sender.tab.id : "unknown");
    sendResponse({ status: "Logged pageActionToggle request." }); 
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
        console.error(`Error during testConnection for ${serverConfig.clientType}:`, error);
        sendResponse({ success: false, message: `Failed to test connection: ${error.message}` });
      });
    return true; 
  } else if (request.action === 'addTorrentManually' && request.url) {
    addTorrentToClient(request.url);
    return false; 
  } else if (request.action === 'addTorrentWithCustomParams' && request.params) {
    const { url, server, tags, category, addPaused, selectedFileIndices, totalFileCount } = request.params; 
    addTorrentToClient(url, server, tags, category, addPaused, null, null, selectedFileIndices, totalFileCount); 
    return false; 
  } else if (request.action === 'addTorrent' && request.url) { 
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
        console.log("[RTWA Background] Creating error notification (context menu creation):", 'Failed to create context menu.');
        chrome.notifications.create({
            type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Torrent Adder - Menu Error',
            message: 'Failed to create context menu. Please report this.'
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error("[RTWA Background] Error creating context menu error notification:", chrome.runtime.lastError.message);
          } else {
            console.log("[RTWA Background] Notification created (context menu error), ID:", notificationId);
          }
        });
      } else {
        console.log('[RTWA Background] Generic torrent context menu ("addTorrentGeneric") registered.'); 
      }
    });
  });
});

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
            console.error("[TorrentAdder] Error parsing pageUrl for rule matching:", e);
        }
    }
    const targetServer = servers.find(s => s.id === targetServerId);
    if (!targetServer && servers.length > 0) {
        console.warn(`[TorrentAdder] Target server ID "${targetServerId}" not found or invalid, falling back to first available server.`);
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
    console.log('[RTWA Background] setupOffscreenDocument: Checking status. isReady:', offscreenDocumentManager.isReady);
    if (await hasOffscreenDocument()) {
        console.log('[RTWA Background] setupOffscreenDocument: Document already exists.');
        if (!offscreenDocumentManager.isReady) {
            console.log('[RTWA Background] setupOffscreenDocument: Document exists but not marked ready. Waiting for readyPromise.');
            await offscreenDocumentManager.readyPromise;
        }
        console.log('[RTWA Background] setupOffscreenDocument: Document confirmed ready or became ready.');
        return;
    }

    if (offscreenDocumentManager.creatingPromise) {
        console.log('[RTWA Background] setupOffscreenDocument: Creation already in progress. Waiting.');
        await offscreenDocumentManager.creatingPromise;
        if (!offscreenDocumentManager.isReady) { 
             console.log('[RTWA Background] setupOffscreenDocument: Waited for creation, now waiting for readyPromise again.');
             await offscreenDocumentManager.readyPromise;
        }
        return;
    }

    console.log('[RTWA Background] setupOffscreenDocument: Creating new offscreen document.');
    offscreenDocumentManager.markAsCreating(); 

    const promise = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'Play notification sounds for torrent additions.',
    });
    offscreenDocumentManager.setCreatingPromise(promise);

    try {
        await promise;
        console.log('[RTWA Background] setupOffscreenDocument: chrome.offscreen.createDocument resolved. Waiting for readyPromise (offscreenReady message).');
        await offscreenDocumentManager.readyPromise; 
        console.log('[RTWA Background] setupOffscreenDocument: Offscreen document is now fully ready.');
    } catch (error) {
        if (error.message.startsWith('Only a single offscreen document may be created')) {
            console.warn('[RTWA Background] setupOffscreenDocument: Race condition - document created by another call. Waiting for its readyPromise.');
            if (!offscreenDocumentManager.isReady) {
                 await offscreenDocumentManager.readyPromise;
            }
        } else {
            console.error('[RTWA Background] setupOffscreenDocument: Error creating offscreen document:', error);
            offscreenDocumentManager.isReady = false;
            offscreenDocumentManager._setupReadyPromise(); 
            throw error; 
        }
    } finally {
        offscreenDocumentManager.clearCreatingPromise();
    }
}


async function playSound(soundFile) {
  try {
    const { enableSoundNotifications } = await chrome.storage.local.get('enableSoundNotifications');
    if (!enableSoundNotifications) {
      return;
    }

    await setupOffscreenDocument(); 

    if (offscreenDocumentManager.isReady) {
        console.log('[RTWA Background] playSound: Sending message to offscreen document for:', soundFile);
        chrome.runtime.sendMessage({
            action: 'playSound',
            soundFile: chrome.runtime.getURL(soundFile)
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('[RTWA Background] playSound: Error sending message to offscreen document:', chrome.runtime.lastError.message, 'Sound file:', soundFile);
            } else if (response && response.error) {
                console.warn('[RTWA Background] playSound: Offscreen document reported error playing sound:', response.error, 'Sound file:', soundFile);
            } else if (response && response.success) {
                console.log('[RTWA Background] playSound: Offscreen document confirmed sound played for:', soundFile);
            } else {
                console.warn('[RTWA Background] playSound: No specific response or error from offscreen document for:', soundFile, 'Response:', response);
            }
        });
    } else {
        console.warn('[RTWA Background] Offscreen document not ready or available after setup to play sound:', soundFile);
    }

  } catch (e) {
    console.warn(`[RTWA Background] Error in playSound setup or message sending:`, e);
  }
}

async function applyTrackerRulesLogic(announceUrls, currentTorrentOptions, currentTagsToUse) {
    let appliedRule = false;
    const { trackerUrlRules } = await chrome.storage.local.get('trackerUrlRules');

    if (trackerUrlRules && trackerUrlRules.length > 0 && announceUrls && announceUrls.length > 0) {
        console.log('[RTWA Background] applyTrackerRulesLogic: Checking rules against announce URLs:', announceUrls);
        for (const rule of trackerUrlRules) {
            for (const announceUrl of announceUrls) {
                if (announceUrl.includes(rule.trackerUrlPattern)) {
                    console.log(`[RTWA Background] Tracker rule matched: Pattern "${rule.trackerUrlPattern}" found in "${announceUrl}"`);
                    if (rule.label) {
                        currentTorrentOptions.category = rule.label;
                        currentTorrentOptions.labels = [rule.label];
                        if (currentTagsToUse) {
                             currentTorrentOptions.labels = currentTorrentOptions.labels.concat(currentTagsToUse.split(',').map(t => t.trim()).filter(t => t && t !== rule.label));
                        }
                        console.log(`[RTWA Background] Applied label from rule: "${rule.label}"`);
                        appliedRule = true;
                    }
                    if (rule.directory) {
                        currentTorrentOptions.downloadDir = rule.directory;
                        console.log(`[RTWA Background] Applied directory from rule: "${rule.directory}"`);
                        appliedRule = true;
                    }
                    if (appliedRule) break; 
                }
            }
            if (appliedRule) break; 
        }
    } else {
        console.log('[RTWA Background] applyTrackerRulesLogic: No tracker rules configured or no/empty announce URLs to process.');
    }
    return { wasRuleApplied: appliedRule, torrentOptions: currentTorrentOptions };
}


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
      console.log("[RTWA Background] Creating error notification (determineTargetServer):", errorMsg);
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Remote Torrent Adder Error',
        message: errorMsg
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error("[RTWA Background] Error creating determineTargetServer notification:", chrome.runtime.lastError.message);
        } else {
          console.log("[RTWA Background] Notification created (determineTargetServer), ID:", notificationId);
        }
      });
      chrome.storage.local.set({ lastActionStatus: errorMsg });
      return;
    }
  }
  
  if (!serverToUse) {
    const msg = 'No target server could be determined. Please configure servers in options and select an active one in the popup.';
    console.log("[RTWA Background] Creating error notification (no target server):", msg);
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Remote Torrent Adder Error',
      message: msg
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("[RTWA Background] Error creating no target server notification:", chrome.runtime.lastError.message);
      } else {
        console.log("[RTWA Background] Notification created (no target server), ID:", notificationId);
      }
    });
    chrome.storage.local.set({ lastActionStatus: msg });
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
    torrentFileContentBase64: null, 
    originalTorrentUrl: torrentUrl 
  };

  const isMagnet = torrentUrl.startsWith("magnet:");
  let wasRuleApplied = false; 
  
  if (!isMagnet) { 
    console.log(`[RTWA Background] Non-magnet link: ${torrentUrl}. Attempting to fetch content to check if it's a .torrent file.`);
    try {
      const response = await fetch(torrentUrl, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      console.log(`[RTWA Background] Fetched ${torrentUrl}, Content-Type: ${contentType}`);
      if (contentType && (contentType.includes('application/x-bittorrent') || contentType.includes('application/octet-stream') || contentType.includes('application/torrent'))) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          torrentOptions.torrentFileContentBase64 = arrayBufferToBase64(arrayBuffer);
          console.log(`[RTWA Background] Successfully fetched and base64 encoded .torrent content (Content-Type: ${contentType}) for: ${torrentUrl}`);
        } else {
          console.warn(`[RTWA Background] URL ${torrentUrl} had .torrent Content-Type but empty/invalid body. Sending URL to client.`);
          torrentOptions.torrentFileContentBase64 = null; 
        }
      } else {
        console.log(`[RTWA Background] URL ${torrentUrl} did not return a .torrent Content-Type (got: ${contentType}). Will send URL to client as is.`);
        torrentOptions.torrentFileContentBase64 = null; 
      }
    } catch (fetchError) {
      console.warn(`[RTWA Background] Error attempting to fetch content for ${torrentUrl}:`, fetchError.message, ". Will send URL to client as is.");
      torrentOptions.torrentFileContentBase64 = null; 
    }
  }

  // Apply Tracker URL Rules
  let ruleApplicationResult; 

  if (isMagnet) {
    console.log('[RTWA Background] Applying tracker URL rules for magnet link...');
    const magnetTrackers = [];
    try {
        const urlParams = new URLSearchParams(torrentUrl.substring(torrentUrl.indexOf('?') + 1));
        urlParams.forEach((value, key) => {
            if (key === 'tr') {
                magnetTrackers.push(decodeURIComponent(value)); 
            }
        });
    } catch(e) {
        console.error('[RTWA Background] Error parsing magnet link for trackers:', e);
    }
    if (magnetTrackers.length > 0) {
        console.log('[RTWA Background] Extracted magnet trackers:', magnetTrackers);
        let tempOptions = {...torrentOptions}; // Operate on a copy for rule application
        ruleApplicationResult = await applyTrackerRulesLogic(magnetTrackers, tempOptions, tagsToUse);
        torrentOptions = ruleApplicationResult.torrentOptions; 
    } else {
        ruleApplicationResult = { wasRuleApplied: false, torrentOptions }; // No trackers, no rules applied
    }
  } else if (torrentOptions.torrentFileContentBase64) {
    console.log('[RTWA Background] Applying tracker URL rules for .torrent file...');
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
      console.log('[RTWA Background] Extracted .torrent announce URLs:', announceUrls);
      if (announceUrls.length > 0) {
        let tempOptions = {...torrentOptions}; // Operate on a copy
        ruleApplicationResult = await applyTrackerRulesLogic(announceUrls, tempOptions, tagsToUse);
        torrentOptions = ruleApplicationResult.torrentOptions; 
      } else {
        ruleApplicationResult = { wasRuleApplied: false, torrentOptions }; // No announce URLs, no rules applied
      }
    } catch (e) {
      console.error('[RTWA Background] Error decoding .torrent or extracting trackers for rules:', e);
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
    console.error(errorMsg);
    console.log("[RTWA Background] Creating error notification (no API handler):", errorMsg);
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Add Remote Torrent Error', message: errorMsg }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("[RTWA Background] Error creating no API handler notification:", chrome.runtime.lastError.message);
      } else {
        console.log("[RTWA Background] Notification created (no API handler), ID:", notificationId);
      }
    });
    chrome.storage.local.set({ lastActionStatus: errorMsg });
    return;
  }

  try {
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
      console.log("[RTWA Background] Creating success notification:", successMsg);
      chrome.notifications.create({
        type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Remote Torrent Adder', 
        message: successMsg
      }, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error("[RTWA Background] Error creating success notification:", chrome.runtime.lastError.message);
        } else {
          console.log("[RTWA Background] Notification created (success), ID:", notificationId);
        }
      });
      playSound('audio/success.mp3'); 
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
    console.log("[RTWA Background] Creating error notification (addTorrentToClient catch):", notificationErrorMessage);
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Remote Torrent Adder Error',
      message: notificationErrorMessage
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("[RTWA Background] Error creating addTorrentToClient catch notification:", chrome.runtime.lastError.message);
      } else {
          console.log("[RTWA Background] Notification created (addTorrentToClient catch), ID:", notificationId);
        }
      });
      playSound('audio/failure.mp3'); 
      chrome.storage.local.set({ lastActionStatus: notificationErrorMessage });
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addTorrentGeneric" && info.linkUrl) {
    const linkUrl = info.linkUrl;
    let isMagnet = linkUrl.startsWith("magnet:");
    let isTorrentFile = /\.torrent($|\?|#)/i.test(linkUrl); 
    if (!isMagnet && !isTorrentFile) {
      console.log(`[RTWA Background] Link URL "${linkUrl}" does not strictly end with .torrent. Proceeding to addTorrentToClient for content type check.`);
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
        console.log("[RTWA Background] Creating error notification (determineTargetServer in onClicked):", errorMsg);
        chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Remote Torrent Adder Error', message: errorMsg }, (notificationId) => {
            if(chrome.runtime.lastError) {
                console.error("[RTWA Background] Error creating determineTargetServer (onClicked) notification:", chrome.runtime.lastError.message);
            } else {
                console.log("[RTWA Background] Notification created (determineTargetServer onClicked), ID:", notificationId);
            }
        });
        chrome.storage.local.set({ lastActionStatus: errorMsg });
        return; 
    }
    if (!serverForDialog || !serverForDialog.clientType) { 
        const msg = 'No target server determined or server config is incomplete (missing clientType). Configure servers in options.';
        console.log("[RTWA Background] Creating error notification (no serverForDialog in onClicked):", msg);
        chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon-48x48.png', title: 'Remote Torrent Adder Error', message: msg }, (notificationId) => {
            if(chrome.runtime.lastError) {
                console.error("[RTWA Background] Error creating no serverForDialog (onClicked) notification:", chrome.runtime.lastError.message);
            } else {
                console.log("[RTWA Background] Notification created (no serverForDialog onClicked), ID:", notificationId);
            }
        });
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
        width: 600, 
        height: 580 
      });
    } else {
      addTorrentToClient(info.linkUrl, serverForDialog, null, null, null, pageUrlForRules); 
    }
  }
});
