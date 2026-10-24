chrome.storage.local.get(['redactedCount'], (data) => {
  const count = data.redactedCount || 0;
  document.getElementById('redacted-count').innerText = String(count);
});
