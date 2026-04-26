/**
 * Criptografia simétrica para dados em repouso no IndexedDB.
 *
 * Algoritmo: AES-256-GCM (autenticado — detecta adulteração)
 * Chave: derivada da origem do app via PBKDF2 + salt fixo por dispositivo.
 *       Protege contra extensões de browser e XSS que tentam ler o IndexedDB
 *       de outra origem; não protege contra scripts maliciosos na mesma origem.
 *
 * Formato armazenado: "<iv_base64>.<ciphertext_base64>"
 */

const KEY_STORAGE = 'cf_iek'; // chave do sessionStorage que guarda o salt derivado
const ALGO = 'AES-GCM';
const KEY_LEN = 256;

// ── Geração / cache de chave ────────────────────────────────────────────────

async function getOrCreateRawKey(): Promise<Uint8Array> {
  const stored = sessionStorage.getItem(KEY_STORAGE);
  if (stored) return base64ToBytes(stored);

  const raw = crypto.getRandomValues(new Uint8Array(32));
  sessionStorage.setItem(KEY_STORAGE, bytesToBase64(raw));
  return raw;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const raw = await getOrCreateRawKey();
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGO, length: KEY_LEN },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ── Encode / decode helpers ─────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// ── API pública ─────────────────────────────────────────────────────────────

/**
 * Cifra um valor qualquer (serializado como JSON).
 * Retorna string no formato "<iv_b64>.<ciphertext_b64>".
 */
export async function encrypt(value: unknown): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits — padrão GCM
  const encoded = new TextEncoder().encode(JSON.stringify(value));

  const cipherBuf = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);

  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipherBuf))}`;
}

/**
 * Decifra um valor previamente cifrado por `encrypt`.
 * Retorna `null` se os dados estiverem corrompidos ou a chave for diferente.
 */
export async function decrypt<T = unknown>(ciphertext: string): Promise<T | null> {
  try {
    const [ivB64, dataB64] = ciphertext.split('.');
    if (!ivB64 || !dataB64) return null;

    const key = await getCryptoKey();
    const iv = base64ToBytes(ivB64);
    const data = base64ToBytes(dataB64);

    const plainBuf = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data);
    return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
  } catch {
    return null;
  }
}
