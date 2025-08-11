// Simplified debug system for offscreen document (no ES modules)
const debug = {
  enabled: true,
  log: (...args) => debug.enabled ? console.log(...args) : void 0,
  warn: (...args) => debug.enabled ? console.warn(...args) : void 0,
  error: (...args) => debug.enabled ? console.error(...args) : void 0,
  setEnabled: (enabled) => { debug.enabled = enabled; }
};

try {
  chrome.storage.local.get('bgDebugEnabled', (result) => {
    const { bgDebugEnabled } = result;
    // Enable if bgDebugEnabled is true or contains 'log', 'warn', or 'error'
    const shouldEnable = bgDebugEnabled === true ||
      (Array.isArray(bgDebugEnabled) && bgDebugEnabled.length > 0);
    debug.setEnabled(shouldEnable);
  });
} catch (error) {
  debug.setEnabled(true);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'playSound' && request.soundFile) {
    debug.log('[Offscreen Audio] Received playSound request for:', request.soundFile);
    try {
      const audio = new Audio(request.soundFile);
      audio.play()
        .then(() => {
          debug.log('[Offscreen Audio] Playback started for:', request.soundFile);
          sendResponse({ success: true, soundFile: request.soundFile });
        })
        .catch(e => {
          debug.error('[Offscreen Audio] Error during playback:', request.soundFile, e);
          sendResponse({ success: false, error: e.message, soundFile: request.soundFile });
        });
    } catch (e) {
      debug.error('[Offscreen Audio] Error creating Audio object:', request.soundFile, e);
      sendResponse({ success: false, error: e.message, soundFile: request.soundFile });
    }
    return true; // Indicates async response
  }
  return false;
});

// Notify the service worker that the offscreen document is ready
chrome.runtime.sendMessage({ action: 'offscreenReady' });
debug.log('[Offscreen Audio] Document script loaded, listener set up, "offscreenReady" message sent.');
