// SaveMe.Space — Popup Script v2
'use strict';

const SAVEME_URL = 'https://saveme-f5af0.web.app';
const QUICK_SAVE_URL = 'https://us-central1-saveme-f5af0.cloudfunctions.net/quickSave';

// Category color map (mirrors the app's palette)
const CATEGORY_COLORS = {
  Work: '#3b82f6',
  Health: '#22c55e',
  Finance: '#f59e0b',
  Contacts: '#a78bfa',
  Ideas: '#f472b6',
  Books: '#fb923c',
  Personal: '#64748b',
  Notes: '#06b6d4',
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#64748b';
}

// DOM refs
const authBadge = document.getElementById('authBadge');
const authDot = document.getElementById('authDot');
const authLabel = document.getElementById('authLabel');
const saveForm = document.getElementById('saveForm');
const authRequired = document.getElementById('authRequired');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const categoryName = document.getElementById('categoryName');
const categoryDot = document.getElementById('categoryDot');
const categoryNovaTag = document.getElementById('categoryNovaTag');
const saveBtn = document.getElementById('saveBtn');
const saveBtnContent = document.getElementById('saveBtnContent');
const feedback = document.getElementById('feedback');
const feedbackTitle = document.getElementById('feedbackTitle');
const feedbackSub = document.getElementById('feedbackSub');

let isAuthenticated = false;
let currentToken = null;
let predictTimeout = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await prefillFromActiveTab();

  // Wire buttons
  document.getElementById('saveBtn').addEventListener('click', handleSave);
  document.getElementById('openBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${SAVEME_URL}/#/dashboard`, active: true });
    window.close();
  });
  document.getElementById('loginBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${SAVEME_URL}/#/login`, active: true });
    window.close();
  });
  document.getElementById('novaBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'open-brain-dump' });
    window.close();
  });

  // Live category preview as user types
  titleInput.addEventListener('input', schedulePrediction);
  contentInput.addEventListener('input', schedulePrediction);
});

// ── Auth check ────────────────────────────────────────────────────────────────
async function checkAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'authTokenExpiry'], (result) => {
      if (result.authToken && result.authTokenExpiry > Date.now()) {
        currentToken = result.authToken;
        isAuthenticated = true;
        setAuthState(true);
      } else {
        isAuthenticated = false;
        setAuthState(false);
      }
      resolve();
    });
  });
}

function setAuthState(loggedIn) {
  if (loggedIn) {
    authDot.className = 'dot green';
    authLabel.textContent = 'Connected';
    authBadge.className = 'auth-badge logged-in';
    saveForm.style.display = 'block';
    authRequired.style.display = 'none';
  } else {
    authDot.className = 'dot gray';
    authLabel.textContent = 'Not signed in';
    authBadge.className = 'auth-badge logged-out';
    saveForm.style.display = 'none';
    authRequired.style.display = 'block';
  }
}

// ── Prefill from active tab ───────────────────────────────────────────────────
async function prefillFromActiveTab() {
  if (!isAuthenticated) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Fill title with page title
    if (tab.title && !titleInput.value) {
      titleInput.value = tab.title;
    }

    // Try to get selected text from the tab
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim(),
      });
      const selected = results?.[0]?.result;
      if (selected && selected.length > 0) {
        contentInput.value = selected;
      }
    } catch {
      // Scripting may be restricted on some pages
    }

    // Store the page URL for later
    window._pageUrl = tab.url || '';
    window._pageTitle = tab.title || '';

    // Trigger initial prediction
    schedulePrediction();
  } catch (err) {
    console.warn('[SaveMe] Prefill failed:', err);
  }
}

// ── Category prediction (live) ────────────────────────────────────────────────
function schedulePrediction() {
  clearTimeout(predictTimeout);
  predictTimeout = setTimeout(predictCategory, 600);
}

async function predictCategory() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title && !content) {
    setCategoryDisplay('Personal', false);
    return;
  }

  if (!currentToken) return;

  setCategoryDisplay('Detecting...', false);

  try {
    const res = await fetch(QUICK_SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      // Dry-run flag — don't save, just predict (we'll add this to the API)
      body: JSON.stringify({
        title: title || window._pageTitle,
        content,
        url: window._pageUrl,
        dryRun: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCategoryDisplay(data.category || 'Personal', data.categoryPredicted);
    } else {
      setCategoryDisplay('Personal', false);
    }
  } catch {
    setCategoryDisplay('Personal', false);
  }
}

function setCategoryDisplay(category, novaPredicted) {
  categoryName.textContent = category;
  categoryDot.style.background = getCategoryColor(category);
  if (novaPredicted) {
    categoryNovaTag.style.display = 'inline';
  } else {
    categoryNovaTag.style.display = 'none';
  }
}

// ── Save ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!isAuthenticated) return;

  const title = titleInput.value.trim() || window._pageTitle || 'Saved from web';
  const content = contentInput.value.trim();

  setSaving(true);
  hideFeedback();

  try {
    const res = await fetch(QUICK_SAVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        title,
        content,
        url: window._pageUrl,
        pageTitle: window._pageTitle,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAuthState(false);
        showFeedback('error', '🔐 Session expired', 'Please sign in again');
      } else {
        showFeedback('error', '⚠️ Save failed', err.error || 'Please try again');
      }
      return;
    }

    const data = await res.json();
    showFeedback(
      'success',
      '✅ Saved to vault',
      `"${title.slice(0, 40)}" → ${data.category}${data.categoryPredicted ? ' (Nova)' : ''}`
    );

    // Clear form after success
    setTimeout(() => {
      titleInput.value = '';
      contentInput.value = '';
      setCategoryDisplay('Personal', false);
      hideFeedback();
    }, 2000);

  } catch (err) {
    showFeedback('error', '⚠️ Network error', 'Check your connection');
  } finally {
    setSaving(false);
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function setSaving(loading) {
  saveBtn.disabled = loading;
  saveBtnContent.innerHTML = loading
    ? '<div class="spinner"></div> Saving...'
    : '💾 Save to Vault';
}

function showFeedback(type, title, sub) {
  feedback.className = `feedback ${type}`;
  feedbackTitle.textContent = title;
  feedbackSub.textContent = sub;
  feedback.style.display = 'block';
}

function hideFeedback() {
  feedback.style.display = 'none';
}
