import { mockWeighings, type Weighing } from "@/data/animal-detail-mock";
import { mockAnimals } from "@/data/rebanho-mock";

/* ─── GMD Calculation ─── */
export interface GmdResult {
  animalId: string;
  earTag: string;
  name: string;
  breed: string;
  paddock: string;
  weightInitial: number;
  weightFinal: number;
  days: number;
  gmd: number; // kg/day
  classification: GmdClassification;
}

export type GmdClassification = "excelente" | "bom" | "regular" | "abaixo";

export function classifyGmd(gmd: number): GmdClassification {
  if (gmd >= 1.0) return "excelente";
  if (gmd >= 0.7) return "bom";
  if (gmd >= 0.4) return "regular";
  return "abaixo";
}

export const gmdClassLabels: Record<GmdClassification, string> = {
  excelente: "Excelente",
  bom: "Bom",
  regular: "Regular",
  abaixo: "Abaixo",
};

export const gmdClassColors: Record<GmdClassification, string> = {
  excelente: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  bom: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  regular: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  abaixo: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

/** Average GMD benchmarks by breed (kg/day) */
export const breedGmdBenchmark: Record<string, number> = {
  Nelore: 0.75,
  Angus: 1.05,
  Brahman: 0.80,
  Girolando: 0.65,
  Gir: 0.60,
  Senepol: 0.90,
  "Quarto de Milha": 0.50,
  Saanen: 0.15,
  Landrace: 0.60,
};

/**
 * Calculate GMD for a specific animal using its two most recent weighings.
 */
export function calcAnimalGmd(animalId: string): GmdResult | null {
  const weighings = mockWeighings
    .filter((w) => w.animal_id === animalId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weighings.length < 2) return null;

  const prev = weighings[weighings.length - 2];
  const last = weighings[weighings.length - 1];
  const days = Math.round(
    (new Date(last.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) return null;

  const animal = mockAnimals.find((a) => a.id === animalId);
  if (!animal) return null;

  const gmd = Number(((last.weight_kg - prev.weight_kg) / days).toFixed(3));

  return {
    animalId,
    earTag: animal.ear_tag,
    name: animal.name,
    breed: animal.breed,
    paddock: animal.paddock,
    weightInitial: prev.weight_kg,
    weightFinal: last.weight_kg,
    days,
    gmd,
    classification: classifyGmd(gmd),
  };
}

/**
 * Calculate GMD for all animals that have at least 2 weighings.
 */
export function calcAllGmd(): GmdResult[] {
  const animalIds = new Set(mockWeighings.map((w) => w.animal_id));
  const results: GmdResult[] = [];
  animalIds.forEach((id) => {
    const r = calcAnimalGmd(id);
    if (r) results.push(r);
  });
  return results;
}

/**
 * Herd average GMD
 */
export function calcHerdAverageGmd(): number {
  const all = calcAllGmd();
  if (all.length === 0) return 0;
  return Number((all.reduce((s, r) => s + r.gmd, 0) / all.length).toFixed(3));
}
