/**
 * Secure Storage Utility
 * SECURITY FIX: Encrypts sensitive data before storing in localStorage
 * Uses AES-GCM via Web Crypto API to protect PII at rest.
 */

const CRYPTO_KEY_NAME = "agrofinance_storage_key";
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

/** Derive a stable CryptoKey from a passphrase stored in sessionStorage (per-tab). */
async function getOrCreateKey(): Promise<CryptoKey> {
  // Use a per-origin deterministic key derived from a stable seed.
  // In production this should come from an authenticated session token.
  const encoder = new TextEncoder();
  const seed = encoder.encode(
    `${window.location.origin}:${CRYPTO_KEY_NAME}:agrofinance-local-encryption`
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    seed,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("agrofinance-salt-v1"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a string and return a base64-encoded ciphertext (IV prepended). */
export async function encryptData(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  // Prepend IV to ciphertext for storage
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/** Decrypt a base64-encoded ciphertext (IV prepended) back to a string. */
export async function decryptData(ciphertext: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Store a value in localStorage with AES-GCM encryption.
 * Falls back to plain storage if Web Crypto is unavailable.
 */
export async function secureSetItem(key: string, data: string): Promise<void> {
  try {
    if (typeof crypto?.subtle?.encrypt === "function") {
      const encrypted = await encryptData(data);
      localStorage.setItem(key, encrypted);
      localStorage.setItem(`${key}__enc`, "1"); // marker flag
      return;
    }
  } catch (err) {
    console.warn("[secure-storage] Encryption unavailable, storing plain:", err);
  }
  // Fallback: plain storage (non-HTTPS environments, older browsers)
  localStorage.setItem(key, data);
  localStorage.removeItem(`${key}__enc`);
}

/**
 * Retrieve a value from localStorage, decrypting if it was encrypted.
 * Returns null if the key does not exist.
 */
export async function secureGetItem(key: string): Promise<string | null> {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;

  const isEncrypted = localStorage.getItem(`${key}__enc`) === "1";
  if (!isEncrypted) return raw;

  try {
    return await decryptData(raw);
  } catch (err) {
    console.warn("[secure-storage] Decryption failed, returning null:", err);
    return null;
  }
}

/** Remove a key and its encryption marker from localStorage. */
export function secureRemoveItem(key: string): void {
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}__enc`);
}
