// SaveMe.Space — Background Service Worker v2
// Handles hotkeys, context menus, auth token relay, and quick save

const SAVEME_URL = 'https://saveme-f5af0.web.app';
const QUICK_SAVE_URL = 'https://us-central1-saveme-f5af0.cloudfunctions.net/quickSave';
const BRAIN_DUMP_URL = `${SAVEME_URL}/#/brain-dump`;

// ── Command listener ──────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === '_execute_action') {
    // Ctrl+Shift+S → open popup (handled by _execute_action automatically)
    // Nothing needed here — action popup handles this
  } else if (command === 'brain-dump') {
    openBrainDump();
  }
});

// ── Context menu setup ────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'quick-save-selection',
      title: '💾 Save to SaveMe.Space',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'quick-save-page',
      title: '💾 Save this page to SaveMe.Space',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      contexts: ['selection', 'page'],
    });
    chrome.contextMenus.create({
      id: 'brain-dump',
      title: '🎤 Nova Brain Dump',
      contexts: ['selection', 'page'],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'quick-save-selection' || info.menuItemId === 'quick-save-page') {
    const selectedText = info.selectionText || '';
    const pageTitle = tab?.title || '';
    const pageUrl = tab?.url || '';
    await quickSaveFromContext(selectedText, pageTitle, pageUrl, tab?.id);
  } else if (info.menuItemId === 'brain-dump') {
    openBrainDump();
  }
});

// ── Auth token retrieval ──────────────────────────────────────────────────────
// Content script on saveme.space relays the Firebase auth token to us
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'relay-auth-token' && request.token) {
    chrome.storage.local.set({
      authToken: request.token,
      authTokenExpiry: Date.now() + (55 * 60 * 1000), // 55 min (Firebase tokens last 1h)
    });
    sendResponse({ ok: true });
  }

  if (request.action === 'get-selection') {
    chrome.scripting.executeScript(
      { target: { tabId: sender.tab.id }, func: () => window.getSelection().toString() },
      (results) => sendResponse({ selection: results?.[0]?.result || '' })
    );
    return true;
  }

  if (request.action === 'quick-save') {
    const { title, content, url } = request;
    performQuickSave(title, content, url).then((result) => sendResponse(result));
    return true;
  }
});

// ── Core quick save ───────────────────────────────────────────────────────────
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'authTokenExpiry'], (result) => {
      if (result.authToken && result.authTokenExpiry > Date.now()) {
        resolve(result.authToken);
      } else {
        resolve(null);
      }
    });
  });
}

async function performQuickSave(title, content, url) {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: 'not_authenticated' };
  }

  try {
    const res = await fetch(QUICK_SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, url }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) return { success: false, error: 'not_authenticated' };
      return { success: false, error: err.error || 'save_failed' };
    }

    return await res.json();
  } catch (err) {
    console.error('[SaveMe] Quick save failed:', err);
    return { success: false, error: 'network_error' };
  }
}

async function quickSaveFromContext(selectedText, pageTitle, pageUrl, tabId) {
  const title = selectedText
    ? selectedText.slice(0, 80) + (selectedText.length > 80 ? '...' : '')
    : pageTitle;
  const content = selectedText || '';

  const result = await performQuickSave(title, content, pageUrl);

  if (result.success) {
    showNotification(
      '✅ Saved to vault',
      `"${title.slice(0, 50)}" → ${result.category}`
    );
  } else if (result.error === 'not_authenticated') {
    showNotification('🔐 Sign in required', 'Open SaveMe.Space to authenticate');
    chrome.tabs.create({ url: `${SAVEME_URL}/#/login`, active: true });
  } else {
    showNotification('⚠️ Save failed', 'Check your connection and try again');
  }
}

// ── Brain dump ────────────────────────────────────────────────────────────────
async function openBrainDump() {
  try {
    const tabs = await chrome.tabs.query({ url: '*://saveme-f5af0.web.app/*' });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'start-brain-dump', autoStart: true });
    } else {
      await chrome.tabs.create({ url: `${BRAIN_DUMP_URL}?autostart=true`, active: true });
    }
  } catch {
    chrome.tabs.create({ url: `${BRAIN_DUMP_URL}?autostart=true` });
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title,
    message,
    priority: 1,
  });
}
