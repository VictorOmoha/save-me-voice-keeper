// SaveMe.Space — Content Script v2
// Runs on saveme.space: relays auth token to background + handles brain dump trigger

(function () {
  'use strict';

  // ── Auth token relay ─────────────────────────────────────────────────────
  // Firebase stores auth in IndexedDB. We grab the token via the app's own API.
  function grabAndRelayToken() {
    // Try to get a fresh token via Firebase's global auth object
    try {
      // Firebase Auth stores the current user — trigger a token refresh
      const intervalId = setInterval(() => {
        const fbApp = window.__FIREBASE_APP__ || (window.firebase && window.firebase.app && window.firebase.app());
        if (fbApp) {
          clearInterval(intervalId);
          return;
        }

        // Fallback: look for firebase auth in common locations
        const authToken = localStorage.getItem('firebase:authUser:AIzaSy') ||
          Object.keys(localStorage).filter(k => k.startsWith('firebase:authUser:')).map(k => {
            try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
          }).find(Boolean);

        if (authToken) clearInterval(intervalId);
      }, 500);

      // Listen for custom event dispatched by the React app
      window.addEventListener('saveme:auth-token', (e) => {
        if (e.detail && e.detail.token) {
          chrome.runtime.sendMessage({
            action: 'relay-auth-token',
            token: e.detail.token,
          });
        }
      });

      // Dispatch a request to the app to provide the token
      window.dispatchEvent(new CustomEvent('saveme:request-token'));

    } catch (err) {
      // Content script may be restricted — fail silently
    }
  }

  // ── Brain dump trigger ───────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'start-brain-dump') {
      window.dispatchEvent(new CustomEvent('saveme:start-brain-dump', {
        detail: { autoStart: request.autoStart, autoSpeak: request.autoSpeak },
      }));
    }
  });

  // ── Run on load ──────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', grabAndRelayToken);
  } else {
    grabAndRelayToken();
  }
})();
