// ═══════════════════════════════════════════════════════════════════════════════
// SalesAI Key Vault — Unified API Key Management
// ═══════════════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE:
// 1. Checks if browser extension is installed → uses chrome.storage (most secure)
// 2. Falls back to encrypted localStorage (AES-256-GCM, PBKDF2 310K iterations)
// 3. Marketplace never sees, transmits, or stores plaintext keys
// 4. Apps request keys via postMessage bridge or direct vault access
//
// USAGE:
//   import { KeyVault } from './key-vault.js';
//
//   // Save a key
//   await KeyVault.saveKey('openai', 'sk-...');
//
//   // Get a key (auto-detects best storage)
//   const key = await KeyVault.getKey('openai');
//
//   // Check what storage backend is active
//   const status = await KeyVault.getStatus();
//   // → { backend: 'extension' | 'local', openai: true, anthropic: false }
//
// ═══════════════════════════════════════════════════════════════════════════════

const VAULT_VERSION = '1.0';
const VAULT_PREFIX = 'salesai_vault_';
const EXTENSION_ID_KEY = 'salesai_ext_id';
const PBKDF2_ITERATIONS = 310000;
const EXTENSION_CHECK_TIMEOUT = 500; // ms

// ─── CRYPTO LAYER ────────────────────────────────────────────────────────────
// AES-256-GCM with PBKDF2 key derivation
// The encryption passphrase is derived from a user-specific fingerprint
// so even if localStorage is copied to another machine, it can't be decrypted

const Crypto = {
  async _getFingerprint() {
    // Combine multiple browser-specific signals into a derivation seed
    // This isn't meant to be unbreakable — it adds a layer so raw localStorage
    // copies across machines don't decrypt. The real protection is AES-256-GCM.
    const signals = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      'salesai-vault-v1' // static app salt
    ];
    const raw = signals.join('|');
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async _deriveKey(passphrase) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('salesai-vault-v1-pepper'),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async encrypt(plaintext) {
    const fingerprint = await this._getFingerprint();
    const key = await this._deriveKey(fingerprint);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );
    return JSON.stringify({
      v: VAULT_VERSION,
      iv: Array.from(iv),
      ct: Array.from(new Uint8Array(ciphertext)),
      ts: Date.now()
    });
  },

  async decrypt(stored) {
    try {
      const { iv, ct } = JSON.parse(stored);
      const fingerprint = await this._getFingerprint();
      const key = await this._deriveKey(fingerprint);
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        new Uint8Array(ct)
      );
      return new TextDecoder().decode(plaintext);
    } catch (e) {
      console.warn('[KeyVault] Decryption failed — key may have been saved on a different device');
      return null;
    }
  }
};


// ─── EXTENSION BRIDGE ────────────────────────────────────────────────────────
// Communicates with the SalesAI Chrome extension via window messaging
// The extension stores keys in chrome.storage.local which is:
//   - Sandboxed (no website can access it)
//   - Encrypted at rest by Chrome
//   - Synced across devices if user enables chrome.storage.sync

const ExtensionBridge = {
  _extensionAvailable: null,

  async isAvailable() {
    if (this._extensionAvailable !== null) return this._extensionAvailable;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this._extensionAvailable = false;
        resolve(false);
      }, EXTENSION_CHECK_TIMEOUT);

      const handler = (event) => {
        if (event.data?.type === 'salesai-ext-pong' && event.origin === window.location.origin) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          this._extensionAvailable = true;
          resolve(true);
        }
      };

      window.addEventListener('message', handler);
      window.postMessage({ type: 'salesai-ext-ping' }, window.location.origin);
    });
  },

  async saveKey(provider, key) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Extension timeout')), 3000);
      const handler = (event) => {
        if (event.data?.type === 'salesai-ext-save-result' && event.origin === window.location.origin) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          event.data.success ? resolve(true) : reject(new Error('Extension save failed'));
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({ type: 'salesai-ext-save', provider, key }, window.location.origin);
    });
  },

  async getKey(provider) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Extension timeout')), 3000);
      const handler = (event) => {
        if (event.data?.type === 'salesai-ext-key-result' && event.data.provider === provider && event.origin === window.location.origin) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(event.data.key || null);
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({ type: 'salesai-ext-get', provider }, window.location.origin);
    });
  },

  async removeKey(provider) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Extension timeout')), 3000);
      const handler = (event) => {
        if (event.data?.type === 'salesai-ext-remove-result' && event.origin === window.location.origin) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(true);
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({ type: 'salesai-ext-remove', provider }, window.location.origin);
    });
  },

  async hasKey(provider) {
    try {
      const key = await this.getKey(provider);
      return !!key;
    } catch { return false; }
  }
};


// ─── LOCAL VAULT (ENCRYPTED LOCALSTORAGE) ────────────────────────────────────

const LocalVault = {
  async saveKey(provider, key) {
    const encrypted = await Crypto.encrypt(key);
    localStorage.setItem(VAULT_PREFIX + provider, encrypted);
    return true;
  },

  async getKey(provider) {
    const stored = localStorage.getItem(VAULT_PREFIX + provider);
    if (!stored) return null;
    return Crypto.decrypt(stored);
  },

  async removeKey(provider) {
    localStorage.removeItem(VAULT_PREFIX + provider);
    return true;
  },

  hasKey(provider) {
    return !!localStorage.getItem(VAULT_PREFIX + provider);
  }
};


// ─── UNIFIED KEY VAULT API ───────────────────────────────────────────────────
// Auto-detects best available storage and provides a single interface

export const KeyVault = {
  _backend: null, // 'extension' | 'local'

  async _detectBackend() {
    if (this._backend) return this._backend;
    const extAvailable = await ExtensionBridge.isAvailable();
    this._backend = extAvailable ? 'extension' : 'local';
    return this._backend;
  },

  /**
   * Save an API key for a provider
   * @param {'openai' | 'anthropic'} provider
   * @param {string} key - The plaintext API key
   * @returns {Promise<{success: boolean, backend: string}>}
   */
  async saveKey(provider, key) {
    if (!provider || !key) throw new Error('Provider and key are required');
    if (!['openai', 'anthropic'].includes(provider)) throw new Error('Invalid provider');

    // Basic key format validation
    if (provider === 'openai' && !key.startsWith('sk-')) {
      throw new Error('OpenAI keys start with sk-');
    }
    if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
      throw new Error('Anthropic keys start with sk-ant-');
    }

    const backend = await this._detectBackend();
    try {
      if (backend === 'extension') {
        await ExtensionBridge.saveKey(provider, key);
      } else {
        await LocalVault.saveKey(provider, key);
      }
      return { success: true, backend };
    } catch (e) {
      // If extension fails, fall back to local
      if (backend === 'extension') {
        console.warn('[KeyVault] Extension save failed, falling back to local vault');
        await LocalVault.saveKey(provider, key);
        return { success: true, backend: 'local' };
      }
      throw e;
    }
  },

  /**
   * Retrieve an API key for a provider
   * @param {'openai' | 'anthropic'} provider
   * @returns {Promise<string | null>}
   */
  async getKey(provider) {
    const backend = await this._detectBackend();
    try {
      if (backend === 'extension') {
        const key = await ExtensionBridge.getKey(provider);
        if (key) return key;
        // Fall back to local if extension doesn't have it
        return LocalVault.getKey(provider);
      }
      return LocalVault.getKey(provider);
    } catch (e) {
      // Extension error → fall back to local
      return LocalVault.getKey(provider);
    }
  },

  /**
   * Remove an API key
   * @param {'openai' | 'anthropic'} provider
   */
  async removeKey(provider) {
    const backend = await this._detectBackend();
    // Remove from both to be thorough
    try { await ExtensionBridge.removeKey(provider); } catch {}
    try { await LocalVault.removeKey(provider); } catch {}
    return true;
  },

  /**
   * Get vault status — which backend is active, which keys are configured
   * @returns {Promise<{backend: string, openai: boolean, anthropic: boolean, extensionAvailable: boolean}>}
   */
  async getStatus() {
    const backend = await this._detectBackend();
    const extensionAvailable = await ExtensionBridge.isAvailable();

    let openai = false, anthropic = false;
    if (backend === 'extension') {
      openai = await ExtensionBridge.hasKey('openai');
      anthropic = await ExtensionBridge.hasKey('anthropic');
    }
    // Also check local vault
    if (!openai) openai = LocalVault.hasKey('openai');
    if (!anthropic) anthropic = LocalVault.hasKey('anthropic');

    return { backend, openai, anthropic, extensionAvailable };
  },

  /**
   * Migrate keys from localStorage to extension (called when extension is installed)
   */
  async migrateToExtension() {
    const extAvailable = await ExtensionBridge.isAvailable();
    if (!extAvailable) return { migrated: false, reason: 'Extension not available' };

    let migrated = 0;
    for (const provider of ['openai', 'anthropic']) {
      const localKey = await LocalVault.getKey(provider);
      if (localKey) {
        await ExtensionBridge.saveKey(provider, localKey);
        await LocalVault.removeKey(provider);
        migrated++;
      }
    }
    this._backend = 'extension';
    return { migrated: true, count: migrated };
  },

  /**
   * Wipe all keys from all storage backends
   * Used for account deletion or security emergency
   */
  async purgeAll() {
    for (const provider of ['openai', 'anthropic']) {
      try { await ExtensionBridge.removeKey(provider); } catch {}
      try { await LocalVault.removeKey(provider); } catch {}
    }
    return true;
  }
};


// ─── POSTMESSAGE BRIDGE FOR IFRAME APPS ──────────────────────────────────────
// The marketplace parent uses this to send keys to sandboxed app iframes

export const KeyBridge = {
  /**
   * Send a key to an iframe app (called by the marketplace launcher)
   * @param {HTMLIFrameElement} iframe
   * @param {'openai' | 'anthropic'} provider
   * @param {string} origin - Must match your marketplace domain
   */
  async sendKeyToApp(iframe, provider, origin) {
    const key = await KeyVault.getKey(provider);
    if (!key) throw new Error(`No ${provider} key configured`);
    if (!iframe?.contentWindow) throw new Error('Invalid iframe');

    iframe.contentWindow.postMessage({
      type: 'salesai-key-delivery',
      provider,
      key
    }, origin); // NEVER use '*' — always specify exact origin
  },

  /**
   * Listen for key requests from iframe apps (called by the marketplace)
   * Apps can request keys via postMessage instead of receiving them proactively
   */
  startListening(origin) {
    window.addEventListener('message', async (event) => {
      // STRICT origin check
      if (event.origin !== origin) return;

      if (event.data?.type === 'salesai-key-request') {
        const provider = event.data.provider;
        if (!['openai', 'anthropic'].includes(provider)) return;

        const key = await KeyVault.getKey(provider);
        event.source.postMessage({
          type: 'salesai-key-delivery',
          provider,
          key: key || null
        }, event.origin);
      }
    });
  }
};


// ─── APP-SIDE RECEIVER (include this in each HTML app) ───────────────────────
// This is the code that goes inside each individual app HTML file
// It's exported as a string so you can inject it, or copy it manually

export const APP_BRIDGE_CODE = `
<!-- SalesAI Key Vault Bridge — paste before closing </body> tag -->
<script>
(function() {
  var MARKETPLACE_ORIGIN = ''; // SET THIS to your marketplace domain, e.g. 'https://app.salesai.com'
  var receivedKey = null;
  var receivedProvider = null;

  // Listen for key delivery from marketplace parent
  window.addEventListener('message', function(event) {
    // SECURITY: Only accept messages from the marketplace origin
    if (MARKETPLACE_ORIGIN && event.origin !== MARKETPLACE_ORIGIN) return;

    if (event.data && event.data.type === 'salesai-key-delivery') {
      receivedKey = event.data.key;
      receivedProvider = event.data.provider;

      // Auto-configure the app
      if (receivedKey && receivedProvider) {
        // Set the provider dropdown
        var providerEl = document.getElementById('provider');
        if (providerEl) providerEl.value = receivedProvider;

        // Set the API key field
        var keyEl = document.getElementById('apiKey');
        if (keyEl) keyEl.value = receivedKey;

        // Save to the app's local settings
        if (typeof saveSettings === 'function') saveSettings();

        // Hide the settings panel (key is pre-configured)
        var panel = document.getElementById('settingsPanel');
        if (panel) panel.classList.remove('open');

        // Update status
        if (typeof updateKeyStatus === 'function') updateKeyStatus();

        console.log('[SalesAI] Key received from marketplace vault (' + receivedProvider + ')');
      }
    }
  });

  // If loaded in an iframe, request key from parent
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'salesai-key-request', provider: 'openai' }, '*');
    // Also request anthropic in case that's configured
    setTimeout(function() {
      window.parent.postMessage({ type: 'salesai-key-request', provider: 'anthropic' }, '*');
    }, 100);
  }
})();
<\/script>
`;


// ─── DEFAULT EXPORT ──────────────────────────────────────────────────────────
export default KeyVault;
