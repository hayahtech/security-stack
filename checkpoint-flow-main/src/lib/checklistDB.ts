import { openDB, type DBSchema } from 'idb';
import { encrypt, decrypt } from '@/lib/crypto';

interface ChecklistDB extends DBSchema {
  drafts: {
    key: string;
    value: unknown;
  };
  photos: {
    key: string;   // item id
    value: string; // base64
  };
}

const DB_NAME = 'checklistStore';
const STORE_NAME = 'drafts';
const PHOTO_STORE  = 'photos';
const DRAFT_KEY = 'draft_current';

async function getDB() {
  return openDB<ChecklistDB>(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      // v2: store de fotos separado do rascunho principal
      // Fotos ficam fora do draft para não expor base64 junto com metadados no DevTools
      if (oldVersion < 2 && !db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE);
      }
    },
  });
}

// ── Rascunho (sem fotos) ────────────────────────────────────────────────────

export async function saveDraft(data: unknown) {
  const db = await getDB();
  // Remove fotos do objeto salvo — ficam no store separado
  const safe = stripPhotos(data);
  // Cifra com AES-256-GCM antes de persistir — protege contra extensões e XSS
  const ciphertext = await encrypt(safe);
  await db.put(STORE_NAME, ciphertext, DRAFT_KEY);
}

export async function loadDraft(): Promise<unknown | null> {
  const db = await getDB();
  const stored = await db.get(STORE_NAME, DRAFT_KEY);
  if (!stored) return null;
  // Suporte a drafts antigos (não cifrados) salvos antes desta versão
  if (typeof stored === 'string' && stored.includes('.')) {
    return decrypt(stored);
  }
  return stored;
}

export async function clearDraft() {
  const db = await getDB();
  await db.delete(STORE_NAME, DRAFT_KEY);
  // Limpa fotos ao descartar rascunho
  const tx = db.transaction(PHOTO_STORE, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// ── Fotos (store isolado) ───────────────────────────────────────────────────

export async function savePhoto(itemId: string, base64: string) {
  const db = await getDB();
  await db.put(PHOTO_STORE, base64, itemId);
}

export async function loadPhoto(itemId: string): Promise<string | undefined> {
  const db = await getDB();
  return db.get(PHOTO_STORE, itemId);
}

export async function deletePhoto(itemId: string) {
  const db = await getDB();
  await db.delete(PHOTO_STORE, itemId);
}

export async function loadAllPhotos(): Promise<Record<string, string>> {
  const db = await getDB();
  const keys   = await db.getAllKeys(PHOTO_STORE);
  const values = await db.getAll(PHOTO_STORE);
  const result: Record<string, string> = {};
  keys.forEach((k, i) => { result[k as string] = values[i]; });
  return result;
}

// ── Utilitário ──────────────────────────────────────────────────────────────

/**
 * Remove o campo `photo` de cada item antes de persistir no draft.
 * Fotos são salvas no store separado via savePhoto().
 */
function stripPhotos(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.items)) return data;
  return {
    ...d,
    items: (d.items as Array<Record<string, unknown>>).map(item => {
      const { photo: _photo, ...rest } = item;
      return rest;
    }),
  };
}
