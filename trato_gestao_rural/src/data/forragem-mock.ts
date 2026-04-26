// ── Types ──────────────────────────────────────────────────
export type GrazingStatus = "em_uso" | "descansando" | "pronto";
export type PlantingOperation = "Plantio" | "Reforma" | "Adubação" | "Calagem" | "Controle de pragas";

export interface GrazingCycle {
  id: string;
  pastureId: string;
  pastureName: string;
  grassType: string;
  entryDate: string;
  exitDate?: string;
  entryHeight: number; // cm
  exitHeight?: number; // cm
  stockingRate: number; // UA/ha
  notes?: string;
}

export interface PlantingRecord {
  id: string;
  pastureId: string;
  pastureName: string;
  operation: PlantingOperation;
  date: string;
  inputs: string[];
  cost: number;
  treatedArea: number; // ha
  responsible: string;
  notes?: string;
}

// ── Constants ──────────────────────────────────────────────
export const plantingOperations: PlantingOperation[] = [
  "Plantio", "Reforma", "Adubação", "Calagem", "Controle de pragas",
];

export const grassTypes = [
  "Braquiária", "Coast Cross", "Tifton 85", "Mombaça", "Tanzânia",
  "Marandu", "Humidícola", "Cynodon", "Outro",
];

// Ideal rest days per grass type
export const idealRestDays: Record<string, number> = {
  "Braquiária": 30, "Coast Cross": 25, "Tifton 85": 25, "Mombaça": 35,
  "Tanzânia": 35, "Marandu": 30, "Humidícola": 28, "Cynodon": 25, "Outro": 30,
};

// ── Mock Data ──────────────────────────────────────────────
export const mockGrazingCycles: GrazingCycle[] = [
  // Pasto Norte - currently in use
  { id: "gc1", pastureId: "pas-1", pastureName: "Pasto Norte", grassType: "Braquiária", entryDate: "2026-03-03", entryHeight: 40, stockingRate: 3.2, notes: "Lote de engorda #137" },
  { id: "gc2", pastureId: "pas-1", pastureName: "Pasto Norte", grassType: "Braquiária", entryDate: "2026-01-20", exitDate: "2026-02-18", entryHeight: 45, exitHeight: 15, stockingRate: 3.5 },
  // Pasto Sul - resting since Feb 25
  { id: "gc3", pastureId: "pas-2", pastureName: "Pasto Sul", grassType: "Mombaça", entryDate: "2026-01-10", exitDate: "2026-02-25", entryHeight: 80, exitHeight: 30, stockingRate: 2.8, notes: "Boa qualidade" },
  // Pasto Leste - resting since Mar 1
  { id: "gc4", pastureId: "pas-3", pastureName: "Pasto Leste", grassType: "Tifton 85", entryDate: "2026-02-01", exitDate: "2026-03-01", entryHeight: 25, exitHeight: 8, stockingRate: 4.0 },
  // Pasto Grande - resting since Feb 10 (almost ready)
  { id: "gc5", pastureId: "pas-4", pastureName: "Pasto Grande", grassType: "Tanzânia", entryDate: "2025-12-15", exitDate: "2026-02-10", entryHeight: 90, exitHeight: 25, stockingRate: 2.5 },
  // Piquete Maternidade - in use
  { id: "gc6", pastureId: "pas-5", pastureName: "Piquete Maternidade", grassType: "Coast Cross", entryDate: "2026-02-28", entryHeight: 20, stockingRate: 1.5 },
  // Older records
  { id: "gc7", pastureId: "pas-1", pastureName: "Pasto Norte", grassType: "Braquiária", entryDate: "2025-11-05", exitDate: "2025-12-20", entryHeight: 42, exitHeight: 12, stockingRate: 3.8 },
  { id: "gc8", pastureId: "pas-2", pastureName: "Pasto Sul", grassType: "Mombaça", entryDate: "2025-10-01", exitDate: "2025-12-30", entryHeight: 85, exitHeight: 28, stockingRate: 2.6 },
];

export const mockPlantingRecords: PlantingRecord[] = [
  { id: "pr1", pastureId: "pas-1", pastureName: "Pasto Norte", operation: "Adubação", date: "2026-01-05", inputs: ["Ureia 200kg", "Super fosfato 150kg"], cost: 3200, treatedArea: 25, responsible: "João Silva" },
  { id: "pr2", pastureId: "pas-4", pastureName: "Pasto Grande", operation: "Calagem", date: "2025-12-10", inputs: ["Calcário dolomítico 8ton"], cost: 4800, treatedArea: 45, responsible: "Pedro Santos" },
  { id: "pr3", pastureId: "pas-3", pastureName: "Pasto Leste", operation: "Reforma", date: "2025-11-20", inputs: ["Semente Tifton 50kg", "Adubo NPK 300kg"], cost: 6500, treatedArea: 18, responsible: "João Silva", notes: "Reforma completa após seca prolongada" },
  { id: "pr4", pastureId: "pas-2", pastureName: "Pasto Sul", operation: "Controle de pragas", date: "2026-02-15", inputs: ["Cipermetrina 5L"], cost: 850, treatedArea: 30, responsible: "Carlos Mendes" },
  { id: "pr5", pastureId: "pas-5", pastureName: "Piquete Maternidade", operation: "Adubação", date: "2026-02-01", inputs: ["Ureia 40kg"], cost: 600, treatedArea: 5, responsible: "João Silva" },
];

// ── Helpers ────────────────────────────────────────────────
export interface PastureForageStatus {
  pastureId: string;
  pastureName: string;
  grassType: string;
  status: GrazingStatus;
  restDays: number;
  idealDays: number;
  remainingDays: number;
  estimatedHeight: number;
  nextEntryDate?: string;
  lastCycle?: GrazingCycle;
}

export function getPastureForageStatuses(): PastureForageStatus[] {
  const pastures = [
    { id: "pas-1", name: "Pasto Norte", type: "Braquiária", area: 25 },
    { id: "pas-2", name: "Pasto Sul", type: "Mombaça", area: 30 },
    { id: "pas-3", name: "Pasto Leste", type: "Tifton 85", area: 18 },
    { id: "pas-4", name: "Pasto Grande", type: "Tanzânia", area: 45 },
    { id: "pas-5", name: "Piquete Maternidade", type: "Coast Cross", area: 5 },
  ];

  const today = new Date("2026-03-08");

  return pastures.map((p) => {
    const cycles = mockGrazingCycles
      .filter((c) => c.pastureId === p.id)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const lastCycle = cycles[0];
    const ideal = idealRestDays[p.type] || 30;

    if (!lastCycle) {
      return {
        pastureId: p.id, pastureName: p.name, grassType: p.type,
        status: "pronto" as GrazingStatus, restDays: 999, idealDays: ideal,
        remainingDays: 0, estimatedHeight: 50,
      };
    }

    // Currently in use (no exit date)
    if (!lastCycle.exitDate) {
      return {
        pastureId: p.id, pastureName: p.name, grassType: p.type,
        status: "em_uso" as GrazingStatus, restDays: 0, idealDays: ideal,
        remainingDays: ideal, estimatedHeight: lastCycle.entryHeight,
        lastCycle,
      };
    }

    // Resting
    const exitDate = new Date(lastCycle.exitDate);
    const restDays = Math.floor((today.getTime() - exitDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, ideal - restDays);
    const status: GrazingStatus = remainingDays <= 0 ? "pronto" : remainingDays <= 7 ? "descansando" : "descansando";
    const growthPerDay = (lastCycle.entryHeight - (lastCycle.exitHeight || 10)) / ideal;
    const estimatedHeight = Math.min(
      lastCycle.entryHeight,
      (lastCycle.exitHeight || 10) + growthPerDay * restDays,
    );

    const nextEntry = new Date(exitDate);
    nextEntry.setDate(nextEntry.getDate() + ideal);

    return {
      pastureId: p.id, pastureName: p.name, grassType: p.type,
      status: remainingDays <= 0 ? "pronto" : status,
      restDays, idealDays: ideal, remainingDays,
      estimatedHeight: Math.round(estimatedHeight),
      nextEntryDate: nextEntry.toISOString().slice(0, 10),
      lastCycle,
    };
  });
}

// Generate rotation calendar for the next 8 weeks
export interface RotationWeek {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  pastureId?: string;
  pastureName?: string;
  status: "scheduled" | "available" | "in_use";
}

export function getRotationCalendar(): RotationWeek[] {
  const statuses = getPastureForageStatuses();
  const today = new Date("2026-03-08");
  const weeks: RotationWeek[] = [];

  // Find current in-use pastures
  const inUse = statuses.filter((s) => s.status === "em_uso");
  const ready = statuses.filter((s) => s.status === "pronto").sort((a, b) => b.estimatedHeight - a.estimatedHeight);
  const resting = statuses.filter((s) => s.status === "descansando").sort((a, b) => a.remainingDays - b.remainingDays);

  const queue = [...ready, ...resting];
  let queueIdx = 0;

  for (let w = 0; w < 8; w++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekLabel = `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")} - ${weekEnd.getDate().toString().padStart(2, "0")}/${(weekEnd.getMonth() + 1).toString().padStart(2, "0")}`;

    if (w === 0 && inUse.length > 0) {
      weeks.push({
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        weekLabel,
        pastureId: inUse[0].pastureId,
        pastureName: inUse[0].pastureName,
        status: "in_use",
      });
    } else if (queueIdx < queue.length) {
      const p = queue[queueIdx];
      // Check if pasture will be ready by this week
      const weekStartDate = weekStart;
      const readyDate = p.nextEntryDate ? new Date(p.nextEntryDate) : weekStartDate;
      if (readyDate <= weekStartDate || p.status === "pronto") {
        weeks.push({
          weekStart: weekStart.toISOString().slice(0, 10),
          weekEnd: weekEnd.toISOString().slice(0, 10),
          weekLabel,
          pastureId: p.pastureId,
          pastureName: p.pastureName,
          status: "scheduled",
        });
        queueIdx++;
      } else {
        weeks.push({
          weekStart: weekStart.toISOString().slice(0, 10),
          weekEnd: weekEnd.toISOString().slice(0, 10),
          weekLabel,
          status: "available",
        });
      }
    } else {
      weeks.push({
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd: weekEnd.toISOString().slice(0, 10),
        weekLabel,
        status: "available",
      });
    }
  }

  return weeks;
}
