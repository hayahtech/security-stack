// Offline sync queue — stores pending records in localStorage (AES-GCM encrypted) and syncs to Supabase when online

import { supabase } from './supabase';
import { secureSetItem, secureGetItem } from './secure-storage';
import {
  weighingsService,
  milkService,
  treatmentsService,
  transactionsService,
} from './supabase-service';

export interface PendingRecord {
  id: string;
  type: "pesagem" | "leite" | "tratamento" | "movimentacao_pasto" | "financeiro";
  data: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
}

const STORAGE_KEY = "agrofinance_offline_queue";

export async function getQueue(): Promise<PendingRecord[]> {
  try {
    const raw = await secureGetItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: PendingRecord[]): Promise<void> {
  await secureSetItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function addToQueue(type: PendingRecord["type"], data: Record<string, unknown>): Promise<PendingRecord> {
  const record: PendingRecord = {
    id: `offline_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    type,
    data,
    createdAt: new Date().toISOString(),
    synced: false,
    retryCount: 0,
  };
  const queue = await getQueue();
  queue.push(record);
  await saveQueue(queue);
  return record;
}

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.filter((r) => !r.synced).length;
}

export async function markAsSynced(ids: string[]): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((r) => (ids.includes(r.id) ? { ...r, synced: true } : r));
  await saveQueue(updated);
}

export async function clearSynced(): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter((r) => !r.synced));
}

async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((r) =>
    r.id === id ? { ...r, retryCount: (r.retryCount ?? 0) + 1 } : r
  );
  await saveQueue(updated);
}

async function pushRecord(record: PendingRecord, userId: string): Promise<void> {
  const payload = { ...record.data, user_id: userId } as Record<string, unknown>;

  switch (record.type) {
    case 'pesagem':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await weighingsService.create(payload as any);
      return;
    case 'leite':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await milkService.create(payload as any);
      return;
    case 'tratamento':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await treatmentsService.create(payload as any);
      return;
    case 'movimentacao_pasto': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('trato_animal_movements' as any).insert(payload as any);
      if (error) throw new Error(error.message);
      return;
    }
    case 'financeiro':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await transactionsService.create(payload as any);
      return;
  }
}

export async function syncQueue(): Promise<number> {
  const queue = await getQueue();
  const pending = queue.filter((r) => !r.synced);
  if (pending.length === 0) return 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const succeededIds: string[] = [];

  for (const record of pending) {
    try {
      await pushRecord(record, user.id);
      succeededIds.push(record.id);
    } catch (err) {
      console.error(`[offline-sync] Failed to sync ${record.type} ${record.id}:`, err);
      await incrementRetry(record.id);
    }
  }

  if (succeededIds.length > 0) {
    await markAsSynced(succeededIds);
    await clearSynced();
  }

  return succeededIds.length;
}

export const typeLabels: Record<PendingRecord["type"], string> = {
  pesagem: "Pesagem",
  leite: "Produção de Leite",
  tratamento: "Tratamento/Vacina",
  movimentacao_pasto: "Movimentação de Pasto",
  financeiro: "Lançamento Financeiro",
};
