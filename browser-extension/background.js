// SaveMe Voice Keeper - Background Script
// Handles global hotkey (Ctrl+Space) to open brain dump

// Global command listener (Ctrl+Space / Cmd+Space)
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    openBrainDump();
  }
});

// Function to open brain dump in focused tab or new tab
async function openBrainDump() {
  const SAVE_ME_URL = 'https://saveme-f5af0.web.app/brain-dump';
  
  try {
    // Check if SaveMe is already open in any tab
    const tabs = await chrome.tabs.query({ url: '*://saveme-f5af0.web.app/*' });
    
    if (tabs.length > 0) {
      // Focus existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      
      // Send message to trigger brain dump capture with auto-start
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'start-brain-dump',
        autoStart: true,
        autoSpeak: true
      });
    } else {
      // Open new tab with brain dump
      await chrome.tabs.create({ 
        url: `${SAVE_ME_URL}?autostart=true`,
        active: true 
      });
    }
  } catch (error) {
    console.error('Error opening brain dump:', error);
    // Fallback: open new tab
    chrome.tabs.create({ url: `${SAVE_ME_URL}?autostart=true` });
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get-selection') {
    // Get selected text from active tab
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => window.getSelection().toString()
    }, (results) => {
      sendResponse({ selection: results[0]?.result || '' });
    });
    return true; // Keep message channel open for async
  }
});

// Optional: Context menu for "Save to SaveMe"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-saveme',
    title: '🎤 Save to SaveMe',
    contexts: ['selection', 'page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-saveme') {
    const text = info.selectionText || '';
    const url = `https://saveme-f5af0.web.app/brain-dump?text=${encodeURIComponent(text)}&autostart=true`;
    chrome.tabs.create({ url, active: true });
  }
});
