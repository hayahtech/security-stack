// ── Types ──────────────────────────────────────────────────
export type AssetType = "Trator" | "Caminhão" | "Moto" | "Ordenhadeira" | "Bomba" | "Implemento" | "Outro";
export type AssetStatus = "Operacional" | "Em manutenção" | "Inativo";
export type MaintenanceType = "Preventiva" | "Corretiva" | "Revisão" | "Lavagem" | "Outro";
export type UsageTurno = "manha" | "tarde" | "noite" | "dia_completo";
export type UsageActivity = "aracao" | "gradagem" | "plantio" | "pulverizacao" | "colheita" | "transporte" | "rocagem" | "outros";

export const turnoLabel: Record<UsageTurno, string> = {
  manha: "Manhã", tarde: "Tarde", noite: "Noite", dia_completo: "Dia Completo",
};

export const activityLabel: Record<UsageActivity, string> = {
  aracao: "Aração", gradagem: "Gradagem", plantio: "Plantio", pulverizacao: "Pulverização",
  colheita: "Colheita", transporte: "Transporte", rocagem: "Roçagem", outros: "Outros",
};

export interface Asset {
  id: string;
  name: string;
  assetType: AssetType;
  plate?: string;
  year?: number;
  hourmeter: number;
  acquisitionCost: number;
  costCenterId?: string;
  notes?: string;
  status: AssetStatus;
  maintenanceIntervalHours?: number; // e.g. 250 = oil change every 250h
  lastMaintenanceHourmeter?: number;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: MaintenanceType;
  dateIn: string;
  dateOut?: string;
  description: string;
  partsReplaced: string[];
  serviceProvider?: string;
  totalCost: number;
  hourmeterAt: number;
  nextMaintenanceDate?: string;
  nextMaintenanceHourmeter?: number;
}

export interface UsageRecord {
  id: string;
  assetId: string;
  date: string;
  workerId: string;
  workerName: string;
  turno: UsageTurno;
  hours: number;
  hourmeterStart?: number;
  hourmeterEnd?: number;
  odometerStart?: number;
  odometerEnd?: number;
  activity: UsageActivity;
  activityOther?: string;
  paddock?: string;
  fuelLiters?: number;
  observations?: string;
}

// ── Mock Data ──────────────────────────────────────────────
export const assetTypes: AssetType[] = ["Trator", "Caminhão", "Moto", "Ordenhadeira", "Bomba", "Implemento", "Outro"];
export const maintenanceTypes: MaintenanceType[] = ["Preventiva", "Corretiva", "Revisão", "Lavagem", "Outro"];

export const mockWorkers = [
  { id: "w1", name: "João Silva" },
  { id: "w2", name: "Carlos Souza" },
  { id: "w3", name: "Maria Oliveira" },
  { id: "w4", name: "Pedro Santos" },
  { id: "w5", name: "Ana Costa" },
];

export const mockAssets: Asset[] = [
  { id: "a1", name: "Trator John Deere 5075E", assetType: "Trator", plate: "ABC-1234", year: 2021, hourmeter: 3200, acquisitionCost: 185000, status: "Operacional", notes: "Trator principal da fazenda.", maintenanceIntervalHours: 250, lastMaintenanceHourmeter: 3000 },
  { id: "a2", name: "Caminhão Ford Cargo 816", assetType: "Caminhão", plate: "DEF-5678", year: 2019, hourmeter: 78000, acquisitionCost: 145000, status: "Operacional", maintenanceIntervalHours: 10000, lastMaintenanceHourmeter: 75000 },
  { id: "a3", name: "Ordenhadeira DeLaval VMS", assetType: "Ordenhadeira", year: 2022, hourmeter: 4800, acquisitionCost: 95000, status: "Em manutenção", notes: "Em revisão semestral.", maintenanceIntervalHours: 500, lastMaintenanceHourmeter: 4800 },
  { id: "a4", name: "Bomba de irrigação KSB", assetType: "Bomba", year: 2020, hourmeter: 6100, acquisitionCost: 28000, status: "Operacional", maintenanceIntervalHours: 1000, lastMaintenanceHourmeter: 5800 },
  { id: "a5", name: "Moto Honda CG 160", assetType: "Moto", plate: "GHI-9012", year: 2023, hourmeter: 12000, acquisitionCost: 14500, status: "Operacional", maintenanceIntervalHours: 3000, lastMaintenanceHourmeter: 11500 },
  { id: "a6", name: "Grade aradora 14 discos", assetType: "Implemento", year: 2018, hourmeter: 0, acquisitionCost: 22000, status: "Inativo", notes: "Aguardando reparo nos discos." },
];

export const mockMaintenanceRecords: MaintenanceRecord[] = [
  { id: "m1", assetId: "a1", type: "Preventiva", dateIn: "2026-01-15", dateOut: "2026-01-16", description: "Troca de óleo e filtros", partsReplaced: ["Filtro de óleo", "Filtro de ar", "Óleo 15W40 10L"], serviceProvider: "Oficina Central", totalCost: 1200, hourmeterAt: 3000, nextMaintenanceDate: "2026-04-15", nextMaintenanceHourmeter: 3500 },
  { id: "m2", assetId: "a1", type: "Corretiva", dateIn: "2025-08-10", dateOut: "2025-08-14", description: "Reparo no sistema hidráulico", partsReplaced: ["Mangueira hidráulica", "Válvula de controle"], serviceProvider: "Hidráulica Brasil", totalCost: 3800, hourmeterAt: 2500 },
  { id: "m3", assetId: "a2", type: "Revisão", dateIn: "2026-02-20", dateOut: "2026-02-21", description: "Revisão de 75.000 km", partsReplaced: ["Pastilhas de freio", "Óleo câmbio"], serviceProvider: "Concessionária Ford", totalCost: 2500, hourmeterAt: 75000, nextMaintenanceDate: "2026-08-20" },
  { id: "m4", assetId: "a3", type: "Revisão", dateIn: "2026-03-01", description: "Revisão semestral programada", partsReplaced: ["Teteiras", "Junta de vedação"], serviceProvider: "DeLaval Service", totalCost: 4200, hourmeterAt: 4800, nextMaintenanceDate: "2026-09-01" },
  { id: "m5", assetId: "a5", type: "Preventiva", dateIn: "2026-02-10", dateOut: "2026-02-10", description: "Troca de óleo e velas", partsReplaced: ["Óleo motor", "Vela de ignição"], serviceProvider: "Moto Center", totalCost: 250, hourmeterAt: 11500, nextMaintenanceDate: "2026-05-10", nextMaintenanceHourmeter: 14500 },
  { id: "m6", assetId: "a4", type: "Corretiva", dateIn: "2025-11-05", dateOut: "2025-11-08", description: "Troca do selo mecânico", partsReplaced: ["Selo mecânico KSB"], serviceProvider: "Hidro Bombas", totalCost: 1800, hourmeterAt: 5800 },
];

export const mockUsageRecords: UsageRecord[] = [
  { id: "u1", assetId: "a1", date: "2026-03-07", workerId: "w1", workerName: "João Silva", turno: "manha", hours: 5, hourmeterStart: 3195, hourmeterEnd: 3200, activity: "aracao", paddock: "Pasto Norte", fuelLiters: 35 },
  { id: "u2", assetId: "a1", date: "2026-03-06", workerId: "w2", workerName: "Carlos Souza", turno: "dia_completo", hours: 8, hourmeterStart: 3187, hourmeterEnd: 3195, activity: "gradagem", paddock: "Pasto Sul", fuelLiters: 55 },
  { id: "u3", assetId: "a1", date: "2026-03-05", workerId: "w1", workerName: "João Silva", turno: "tarde", hours: 4, hourmeterStart: 3183, hourmeterEnd: 3187, activity: "plantio", paddock: "Pasto Leste", fuelLiters: 28 },
  { id: "u4", assetId: "a2", date: "2026-03-07", workerId: "w4", workerName: "Pedro Santos", turno: "manha", hours: 6, odometerStart: 77800, odometerEnd: 78000, activity: "transporte", fuelLiters: 45 },
  { id: "u5", assetId: "a2", date: "2026-03-05", workerId: "w2", workerName: "Carlos Souza", turno: "dia_completo", hours: 10, odometerStart: 77600, odometerEnd: 77800, activity: "transporte", fuelLiters: 70 },
  { id: "u6", assetId: "a5", date: "2026-03-07", workerId: "w3", workerName: "Maria Oliveira", turno: "manha", hours: 3, odometerStart: 11970, odometerEnd: 12000, activity: "transporte", fuelLiters: 5 },
  { id: "u7", assetId: "a1", date: "2026-03-04", workerId: "w4", workerName: "Pedro Santos", turno: "manha", hours: 6, hourmeterStart: 3177, hourmeterEnd: 3183, activity: "pulverizacao", paddock: "Pasto Norte", fuelLiters: 40 },
  { id: "u8", assetId: "a4", date: "2026-03-06", workerId: "w5", workerName: "Ana Costa", turno: "dia_completo", hours: 12, hourmeterStart: 6088, hourmeterEnd: 6100, activity: "outros", activityOther: "Irrigação programada", paddock: "Pivô Central" },
  { id: "u9", assetId: "a1", date: "2026-02-28", workerId: "w2", workerName: "Carlos Souza", turno: "tarde", hours: 5, hourmeterStart: 3172, hourmeterEnd: 3177, activity: "rocagem", paddock: "Pasto Oeste", fuelLiters: 32 },
  { id: "u10", assetId: "a2", date: "2026-02-25", workerId: "w1", workerName: "João Silva", turno: "manha", hours: 4, odometerStart: 77400, odometerEnd: 77600, activity: "transporte", fuelLiters: 30, observations: "Transporte de gado para feira" },
];

// ── Helpers ────────────────────────────────────────────────
export function getMaintenanceForAsset(assetId: string): MaintenanceRecord[] {
  return mockMaintenanceRecords
    .filter((m) => m.assetId === assetId)
    .sort((a, b) => b.dateIn.localeCompare(a.dateIn));
}

export function getTotalMaintenanceCost(assetId: string): number {
  return getMaintenanceForAsset(assetId).reduce((sum, m) => sum + m.totalCost, 0);
}

export function getUsageForAsset(assetId: string): UsageRecord[] {
  return mockUsageRecords.filter(u => u.assetId === assetId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getUsageForWorker(workerId: string): UsageRecord[] {
  return mockUsageRecords.filter(u => u.workerId === workerId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getMaintenanceAlertLevel(asset: Asset): "ok" | "warning" | "critical" | null {
  if (!asset.maintenanceIntervalHours || asset.lastMaintenanceHourmeter === undefined) return null;
  const hoursSinceMaint = asset.hourmeter - asset.lastMaintenanceHourmeter;
  const pct = hoursSinceMaint / asset.maintenanceIntervalHours;
  if (pct >= 1) return "critical";
  if (pct >= 0.8) return "warning";
  return "ok";
}

export function getHoursSinceLastMaintenance(asset: Asset): number {
  if (asset.lastMaintenanceHourmeter === undefined) return asset.hourmeter;
  return asset.hourmeter - asset.lastMaintenanceHourmeter;
}

export function getPendingMaintenanceAlerts(): { asset: Asset; record: MaintenanceRecord }[] {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: { asset: Asset; record: MaintenanceRecord }[] = [];

  for (const record of mockMaintenanceRecords) {
    if (record.nextMaintenanceDate && record.nextMaintenanceDate <= today) {
      const asset = mockAssets.find((a) => a.id === record.assetId);
      if (asset) alerts.push({ asset, record });
    }
  }

  for (const record of mockMaintenanceRecords) {
    if (!record.dateOut) {
      const asset = mockAssets.find((a) => a.id === record.assetId);
      if (asset && !alerts.some((a) => a.asset.id === asset.id)) {
        alerts.push({ asset, record });
      }
    }
  }

  return alerts;
}
