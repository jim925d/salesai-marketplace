# SalesAI Key Vault — Integration Guide

## Overview

The Key Vault system has two layers:

**Level 1 (Default):** AES-256-GCM encrypted localStorage. Works immediately, no install needed.

**Level 2 (Upgrade):** Chrome extension with sandboxed `chrome.storage`. Auto-detected — when the extension is installed, the vault silently upgrades. Keys in localStorage are migrated to the extension and deleted from localStorage.

The user experience: enter key once → every purchased app just works.

---

## File Map

```
key-vault.js                        → Import into your marketplace React app
salesai-key-vault-extension.zip     → Chrome extension (load unpacked or publish to store)
```

---

## 1. Wire Into Your Marketplace

In your marketplace React app (e.g., `salesai-marketplace.jsx`):

```js
import { KeyVault, KeyBridge } from './key-vault.js';

// ── IN YOUR SETTINGS PANEL ──
// Replace the existing API key save logic with:

async function handleSaveKey(provider, key) {
  const result = await KeyVault.saveKey(provider, key);
  console.log(`Key saved via ${result.backend}`); // 'extension' or 'local'
}

// ── IN YOUR DASHBOARD ──
// Show which backend is active:

const status = await KeyVault.getStatus();
// → { backend: 'extension', openai: true, anthropic: false, extensionAvailable: true }

// ── IN YOUR APP LAUNCHER ──
// When launching an app in an iframe:

const iframe = document.getElementById('app-iframe');
iframe.addEventListener('load', async () => {
  const provider = 'openai'; // or read from user preference
  await KeyBridge.sendKeyToApp(iframe, provider, window.location.origin);
});

// Also start listening for key requests from apps:
KeyBridge.startListening(window.location.origin);
```

---

## 2. Wire Into Each HTML App

Add this before the closing `</body>` tag in each app HTML file:

```html
<script>
(function() {
  // SET THIS to your marketplace domain
  var MARKETPLACE_ORIGIN = 'https://app.salesai.com';

  window.addEventListener('message', function(event) {
    if (MARKETPLACE_ORIGIN && event.origin !== MARKETPLACE_ORIGIN) return;

    if (event.data && event.data.type === 'salesai-key-delivery') {
      var key = event.data.key;
      var provider = event.data.provider;

      if (key && provider) {
        var providerEl = document.getElementById('provider');
        if (providerEl) providerEl.value = provider;

        var keyEl = document.getElementById('apiKey');
        if (keyEl) keyEl.value = key;

        if (typeof saveSettings === 'function') saveSettings();
        if (typeof updateKeyStatus === 'function') updateKeyStatus();
      }
    }
  });

  // If in iframe, request key from parent
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: 'salesai-key-request', provider: 'openai' },
      '*' // Will be validated by parent's origin check
    );
  }
})();
</script>
```

This works because all 10 apps already have:
- `<select id="provider">` — provider dropdown
- `<input id="apiKey">` — key input field
- `saveSettings()` function — persists to localStorage
- `updateKeyStatus()` function — updates the UI

The bridge just fills in those fields programmatically.

---

## 3. Install the Extension (Dev)

1. Unzip `salesai-key-vault-extension.zip`
2. Chrome → `chrome://extensions/` → Enable Developer Mode
3. Click "Load unpacked" → select the `extension/` folder
4. Icon appears in toolbar — click to manage keys
5. Visit your marketplace — extension auto-detected

---

## 4. How Auto-Detection Works

```
Page loads
  → key-vault.js sends postMessage 'salesai-ext-ping'
  → If extension content script is present, it replies 'salesai-ext-pong'
  → KeyVault._backend = 'extension'
  → All key operations route through extension
  
  → If no reply within 500ms
  → KeyVault._backend = 'local'
  → All key operations use encrypted localStorage
```

No user action needed. No toggle. It just upgrades silently.

---

## 5. Migration Flow

When a user installs the extension AFTER already having keys in localStorage:

```js
// Call this once after detecting the extension is newly available
const result = await KeyVault.migrateToExtension();
// → { migrated: true, count: 2 }
// Keys moved from localStorage → extension, localStorage copies deleted
```

Trigger this in your Settings panel when `status.extensionAvailable` is true
but keys exist in localStorage.

---

## 6. Security Summary

| Scenario | localStorage (L1) | Extension (L2) |
|----------|-------------------|----------------|
| XSS attack on marketplace | Key encrypted, attacker needs PBKDF2 derivation | Key inaccessible — not in page scope |
| CDN/server breach | Encrypted blob exposed, no plaintext | No key data on server |
| Another tab/domain | Cannot access (same-origin policy) | Cannot access (extension sandboxing) |
| Physical device access | Key in localStorage (encrypted) | Key in Chrome profile (encrypted) |
| "Clear site data" | Key deleted | Key preserved |
| Man-in-the-middle | HTTPS protects transit | HTTPS + no transit to marketplace server |
| User loses device | Keys persist until cleared | Keys persist until cleared |

Both levels: **marketplace server has zero access to keys at all times.**
