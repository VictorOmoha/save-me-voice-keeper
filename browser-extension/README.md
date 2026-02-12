# SaveMe Voice Keeper Extension

🎤 **Zero-Friction Brain Dump Capture**

Global hotkey extension that instantly opens SaveMe's Brain Dump from anywhere on your browser.

## Features

- ⚡ **Ctrl+Space** — Global hotkey opens brain dump instantly
- 📋 **Right-click** — "Save to SaveMe" context menu for selected text
- 🎯 **Auto-start** — Recording begins automatically when opened via hotkey
- 🔗 **Context capture** — Grabs selected text from current page

## Installation

### Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Add "SaveMe Voice Keeper"

### Developer Install (Manual)

1. Download this folder as ZIP
2. Extract to a permanent location
3. Open Chrome → `chrome://extensions/`
4. Enable "Developer mode" (toggle top-right)
5. Click "Load unpacked" → Select this folder
6. Extension icon appears in toolbar

## Usage

### Global Hotkey
Press **Ctrl+Space** (Mac: **Cmd+Space**) from any tab to:
- Open SaveMe Brain Dump
- Auto-focus the tab
- Immediately start voice capture
- Capture any text you have selected

### Context Menu
1. Select text on any webpage
2. Right-click → **"Save to SaveMe"**
3. Opens brain dump with text pre-filled

### Extension Popup
Click the extension icon to:
- 🎯 **Start Brain Dump** — Opens capture with auto-start
- 📊 **Open Dashboard** — View all entries
- See quick shortcuts reference

## Permissions

- `commands` — For Ctrl+Space hotkey
- `activeTab` — To read current page title/URL
- `contextMenus` — Right-click menu
- `scripting` — Content script injection

## Files

- `manifest.json` — Extension config
- `background.js` — Service worker (global hotkey handler)
- `content-script.js` — Injected into saveme-f5af0.web.app
- `popup.html/js` — Extension popup UI
- `icons/` — Extension icons

## Development

To modify:
1. Edit files
2. Refresh extension at `chrome://extensions/`
3. Test hotkey / popup / context menu

## Extracted

This extension is extracted from the main SaveMe Voice Keeper application for standalone installation.

---

**Version:** 1.0.0  
**Manifest:** V3  
**Requirements:** Chrome 88+
