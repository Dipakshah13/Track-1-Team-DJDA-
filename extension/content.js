/**
 * Gemma Aegis — Content Script
 * Intercepts clipboard paste on AI chat surfaces (ChatGPT, Claude, Gemini).
 * Injects Shadow DOM chip for prompt sanitization.
 */

(function () {
  const LOCAL_DAEMON = 'http://localhost:8000/api/shield/text';
  let activeOverlay = null;

  function findTargetInput(e) {
    const target = e.target;
    if (!target) return null;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return target;
    if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
      return target.closest('[contenteditable="true"]') || target;
    }
    return null;
  }

  document.addEventListener('paste', async (event) => {
    const inputElem = findTargetInput(event);
    if (!inputElem) return;

    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text');
    if (!pastedText || pastedText.trim().length < 6) return;

    // Check if Aegis daemon is active or perform regex pre-scan
    const regexes = {
      SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
      PHONE: /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
      EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      IBAN: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g
    };

    let findings = [];
    let redactedText = pastedText;

    for (const [cat, rx] of Object.entries(regexes)) {
      const matches = pastedText.match(rx);
      if (matches) {
        matches.forEach((m, idx) => {
          const placeholder = `[${cat}-${idx + 1}]`;
          findings.push({ category: cat, original: m, placeholder });
          redactedText = redactedText.replace(m, placeholder);
        });
      }
    }

    // Attempt local daemon scan if available
    try {
      const resp = await fetch(LOCAL_DAEMON, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedText }),
        signal: AbortSignal.timeout(600)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.findings && data.findings.length > 0) {
          findings = data.findings;
          redactedText = data.redacted_text || redactedText;
        }
      }
    } catch {
      // Daemon offline: regex fallback holds
    }

    if (findings.length === 0) return;

    // Intercept paste event
    event.preventDefault();
    event.stopPropagation();

    // Notify background for badge count
    chrome.runtime.sendMessage({
      type: 'FINDINGS_INTERCEPTED',
      count: findings.length
    });

    // Remove existing overlay if any
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
    }

    // Render Shadow DOM Chip
    showChipOverlay(inputElem, pastedText, redactedText, findings);
  }, true);

  function insertText(target, text) {
    target.focus();
    if (target.isContentEditable) {
      document.execCommand('insertText', false, text);
    } else {
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const val = target.value || '';
      target.value = val.substring(0, start) + text + val.substring(end);
      target.selectionStart = target.selectionEnd = start + text.length;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function showChipOverlay(target, originalText, redactedText, findings) {
    const host = document.createElement('div');
    host.id = 'gemma-aegis-root';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    
    const rect = target.getBoundingClientRect();
    host.style.left = `${Math.max(16, rect.left)}px`;
    host.style.top = `${Math.max(16, rect.top - 54)}px`;

    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0E0E10;
          color: #F4F0E6;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
          font-size: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          border: 1px solid #D6D0C2;
          animation: pop 0.15s ease-out;
        }
        @keyframes pop {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .tag {
          color: #FF4B2B;
          font-weight: 700;
        }
        .btn {
          cursor: pointer;
          border: none;
          padding: 4px 8px;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 600;
          transition: opacity 0.15s;
        }
        .btn:hover { opacity: 0.9; }
        .btn-redact {
          background: #FF4B2B;
          color: #F4F0E6;
        }
        .btn-orig {
          background: #1A1A1E;
          color: #D6D0C2;
          border: 1px solid #333;
        }
      </style>
      <div class="chip">
        <span class="tag">AEGIS: ${findings.length} secret${findings.length > 1 ? 's' : ''} found</span>
        <button class="btn btn-redact" id="btn-redact">Redact and paste</button>
        <button class="btn btn-orig" id="btn-orig">Paste original</button>
      </div>
    `;

    shadow.getElementById('btn-redact').onclick = () => {
      insertText(target, redactedText);
      host.remove();
      activeOverlay = null;
    };

    shadow.getElementById('btn-orig').onclick = () => {
      insertText(target, originalText);
      host.remove();
      activeOverlay = null;
    };

    document.body.appendChild(host);
    activeOverlay = host;
  }
})();
