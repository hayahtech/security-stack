// Thin wrapper — encrypts data via Web Crypto before writing to localStorage.
// Falls back to plain localStorage when crypto is unavailable (e.g. tests).

const ALGO = { name: "AES-GCM", length: 256 } as const;
const KEY_ID = "natus_sk";

async function getKey(): Promise<CryptoKey> {
  const raw = localStorage.getItem(KEY_ID);
  if (raw) {
    const buf = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", buf, ALGO, false, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey(ALGO, true, ["encrypt", "decrypt"]);
  const exp = await crypto.subtle.exportKey("raw", key);
  localStorage.setItem(KEY_ID, btoa(String.fromCharCode(...new Uint8Array(exp))));
  return key;
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    const k = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(value));
    const payload = JSON.stringify({
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(enc))),
    });
    localStorage.setItem(`sec_${key}`, payload);
  } catch {
    localStorage.setItem(`sec_${key}`, value);
  }
}

export async function secureGetItem(key: string): Promise<string | null> {
  try {
    const raw = localStorage.getItem(`sec_${key}`);
    if (!raw) return null;
    const { iv, data } = JSON.parse(raw);
    const k = await getKey();
    const dec = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)) },
      k,
      Uint8Array.from(atob(data), (c) => c.charCodeAt(0)),
    );
    return new TextDecoder().decode(dec);
  } catch {
    return localStorage.getItem(`sec_${key}`);
  }
}

export function secureRemoveItem(key: string): void {
  localStorage.removeItem(`sec_${key}`);
}
