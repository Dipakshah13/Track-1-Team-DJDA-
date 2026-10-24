/**
 * Gemma Aegis — Extension Service Worker (MV3)
 * Tracks interception counters and badge state.
 * Privacy rule: Never receives or stores raw text. Only category names and counts.
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    redactedCount: 0,
    blockedInjections: 0,
    localDaemonUrl: 'http://localhost:8000',
    enabled: true
  });
  updateBadge(0);
});

function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#FF4B2B' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FINDINGS_INTERCEPTED') {
    chrome.storage.local.get(['redactedCount'], (data) => {
      const next = (data.redactedCount || 0) + (message.count || 1);
      chrome.storage.local.set({ redactedCount: next });
      updateBadge(next);
      sendResponse({ status: 'ok', total: next });
    });
    return true;
  }
  
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['redactedCount', 'blockedInjections', 'enabled'], (data) => {
      sendResponse(data);
    });
    return true;
  }
});
