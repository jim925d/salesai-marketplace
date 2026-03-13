// AES-256-GCM client-side key encryption via Web Crypto API
// Keys are encrypted at rest in localStorage, decrypted only in memory for iframe delivery
// Key derivation: PBKDF2-SHA256 with 310,000 iterations
// Derivation seed: browser fingerprint + static salt

const PBKDF2_ITERATIONS = 310_000
const STATIC_SALT = 'salesai-marketplace-key-vault-v1'
const STORAGE_PREFIX = 'salesai_kv_'

type Provider = 'openai' | 'anthropic'

// ── Browser fingerprint for deterministic key derivation ──

function getBrowserFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    STATIC_SALT,
  ]
  return parts.join('|')
}

// ── Key derivation ──

async function deriveKey(): Promise<CryptoKey> {
  const fingerprint = getBrowserFingerprint()
  const encoder = new TextEncoder()

  // Import fingerprint as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(fingerprint),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive AES-256-GCM key via PBKDF2-SHA256
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(STATIC_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ── Encrypt / Decrypt ──

async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

async function decrypt(
  key: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  const encryptedData = Uint8Array.from(atob(ciphertext), (c) =>
    c.charCodeAt(0)
  )
  const ivData = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  )
  return new TextDecoder().decode(decrypted)
}

// ── KeyVault API ──

export const KeyVault = {
  async saveKey(provider: Provider, apiKey: string): Promise<void> {
    const key = await deriveKey()
    const { ciphertext, iv } = await encrypt(key, apiKey)
    localStorage.setItem(
      `${STORAGE_PREFIX}${provider}`,
      JSON.stringify({ ciphertext, iv })
    )
  },

  async getKey(provider: Provider): Promise<string | null> {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${provider}`)
    if (!stored) return null
    try {
      const { ciphertext, iv } = JSON.parse(stored)
      const key = await deriveKey()
      return await decrypt(key, ciphertext, iv)
    } catch {
      // Corrupted or tampered data — remove it
      localStorage.removeItem(`${STORAGE_PREFIX}${provider}`)
      return null
    }
  },

  async removeKey(provider: Provider): Promise<void> {
    localStorage.removeItem(`${STORAGE_PREFIX}${provider}`)
  },

  async getStatus(): Promise<{ openai: boolean; anthropic: boolean }> {
    return {
      openai: localStorage.getItem(`${STORAGE_PREFIX}openai`) !== null,
      anthropic: localStorage.getItem(`${STORAGE_PREFIX}anthropic`) !== null,
    }
  },

  async purgeAll(): Promise<void> {
    localStorage.removeItem(`${STORAGE_PREFIX}openai`)
    localStorage.removeItem(`${STORAGE_PREFIX}anthropic`)
  },
}

// ── KeyBridge: postMessage key delivery to sandboxed iframes ──

const ALLOWED_ORIGIN = window.location.origin

export const KeyBridge = {
  /**
   * Send a decrypted API key to a sandboxed app iframe.
   * Only sends to the exact origin we control.
   */
  async sendKeyToApp(
    iframe: HTMLIFrameElement,
    provider: Provider
  ): Promise<boolean> {
    const apiKey = await KeyVault.getKey(provider)
    if (!apiKey || !iframe.contentWindow) return false

    iframe.contentWindow.postMessage(
      {
        type: 'SALESAI_KEY_DELIVERY',
        provider,
        key: apiKey,
      },
      ALLOWED_ORIGIN
    )
    return true
  },

  /**
   * Listen for key requests from iframes.
   * CRITICAL: Always validates event.origin to prevent cross-origin attacks.
   */
  startListening(onRequest?: (provider: Provider) => void): () => void {
    const handler = (event: MessageEvent) => {
      // SECURITY: Validate origin — only accept messages from our own origin
      if (event.origin !== ALLOWED_ORIGIN) return

      if (
        event.data &&
        event.data.type === 'SALESAI_KEY_REQUEST' &&
        (event.data.provider === 'openai' ||
          event.data.provider === 'anthropic')
      ) {
        onRequest?.(event.data.provider as Provider)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  },
}
