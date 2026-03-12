// AES-256-GCM client-side key encryption via Web Crypto API
// Keys are encrypted at rest, decrypted only in memory for iframe delivery

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function encryptApiKey(
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

export async function decryptApiKey(
  key: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  const encryptedData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
  const ivData = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData
  )
  return new TextDecoder().decode(decrypted)
}
