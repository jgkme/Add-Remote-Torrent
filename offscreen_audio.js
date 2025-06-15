import { debug } from './debug';

try {
  chrome.storage.local.get('bgDebugEnabled', (result) => {
    const { bgDebugEnabled } = result;
    debug.setEnabled(bgDebugEnabled);
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
  // Acknowledge other messages if needed, or just return false for sync.
  // sendResponse({ success: false, error: 'Unknown action or missing soundFile' });
  return false; 
});

// Notify the service worker that the offscreen document is ready
chrome.runtime.sendMessage({ action: 'offscreenReady' });
debug.log('[Offscreen Audio] Document script loaded, listener set up, "offscreenReady" message sent.');
