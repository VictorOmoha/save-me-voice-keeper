// SaveMe Voice Keeper - Content Script
// Injected into saveme-f5af0.web.app pages to handle extension communication

(function() {
  'use strict';
  
  // Check if we're on SaveMe domain
  if (!window.location.hostname.includes('saveme-f5af0.web.app') && 
      !window.location.hostname.includes('localhost')) {
    return;
  }
  
  console.log('[SaveMe Extension] Content script loaded');
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start-brain-dump') {
      // Dispatch custom event that the React app listens for
      window.dispatchEvent(new CustomEvent('brain-dump:start-capture', {
        detail: {
          autoStart: request.autoStart || true,
          autoSpeak: request.autoSpeak || true
        }
      }));
      
      sendResponse({ success: true });
    }
    
    if (request.action === 'get-selection') {
      sendResponse({ 
        selection: window.getSelection().toString() 
      });
    }
    
    return true;
  });
  
  // Check URL parameters for autostart
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('autostart') === 'true') {
    // Wait for React app to mount
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('brain-dump:start-capture', {
        detail: {
          autoStart: true,
          autoSpeak: urlParams.get('autospeak') !== 'false'
        }
      }));
    }, 500);
  }
  
  // Pre-fill text if provided in URL
  const prefillText = urlParams.get('text');
  if (prefillText) {
    // Store for React app to pick up
    sessionStorage.setItem('brain_dump_prefill', prefillText);
  }
})();
