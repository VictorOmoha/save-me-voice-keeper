// SaveMe Voice Keeper - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const SAVE_ME_URL = 'https://saveme-f5af0.web.app';
  
  // Start Brain Dump button
  document.getElementById('captureBtn').addEventListener('click', async () => {
    try {
      // Open brain dump with auto-start
      await chrome.tabs.create({
        url: `${SAVE_ME_URL}/brain-dump?autostart=true`,
        active: true
      });
      window.close();
    } catch (error) {
      console.error('Error opening brain dump:', error);
    }
  });
  
  // Open Dashboard button
  document.getElementById('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({
      url: `${SAVE_ME_URL}/dashboard`,
      active: true
    });
    window.close();
  });
  
  // Check if extension has proper permissions
  chrome.permissions.contains({
    permissions: ['commands']
  }, (hasPermission) => {
    const status = document.querySelector('.status');
    if (!hasPermission) {
      status.textContent = '⚠️ Limited permissions — some features disabled';
      status.className = 'status';
    }
  });
});

// Optional: Update popup with current tab info
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url) {
    const url = new URL(tabs[0].url);
    if (url.hostname.includes('saveme-f5af0.web.app')) {
      document.getElementById('captureBtn').textContent = '🎯 Continue Brain Dump';
    }
  }
});
