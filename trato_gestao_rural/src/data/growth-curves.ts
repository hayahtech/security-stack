import { mockWeighings } from "@/data/animal-detail-mock";
import { mockAnimals, type Sexo } from "@/data/rebanho-mock";

/* ── Growth curve reference points: breed → sex → age(months) → expected weight(kg) ── */
export interface CurvePoint { months: number; weight: number }

export type GrowthCurveMap = Record<string, Record<Sexo, CurvePoint[]>>;

// Default growth curves — editable via Configurações
const defaultCurves: GrowthCurveMap = {
  Nelore: {
    M: [{ months: 0, weight: 35 }, { months: 3, weight: 90 }, { months: 6, weight: 150 }, { months: 12, weight: 220 }, { months: 24, weight: 360 }, { months: 36, weight: 480 }],
    F: [{ months: 0, weight: 33 }, { months: 3, weight: 82 }, { months: 6, weight: 135 }, { months: 12, weight: 190 }, { months: 24, weight: 290 }, { months: 36, weight: 370 }],
  },
  Angus: {
    M: [{ months: 0, weight: 38 }, { months: 3, weight: 105 }, { months: 6, weight: 175 }, { months: 12, weight: 270 }, { months: 24, weight: 420 }, { months: 36, weight: 550 }],
    F: [{ months: 0, weight: 35 }, { months: 3, weight: 95 }, { months: 6, weight: 155 }, { months: 12, weight: 230 }, { months: 24, weight: 340 }, { months: 36, weight: 430 }],
  },
  Girolando: {
    M: [{ months: 0, weight: 36 }, { months: 3, weight: 88 }, { months: 6, weight: 145 }, { months: 12, weight: 210 }, { months: 24, weight: 340 }, { months: 36, weight: 460 }],
    F: [{ months: 0, weight: 33 }, { months: 3, weight: 80 }, { months: 6, weight: 130 }, { months: 12, weight: 185 }, { months: 24, weight: 280 }, { months: 36, weight: 360 }],
  },
  Brahman: {
    M: [{ months: 0, weight: 34 }, { months: 3, weight: 92 }, { months: 6, weight: 155 }, { months: 12, weight: 230 }, { months: 24, weight: 370 }, { months: 36, weight: 500 }],
    F: [{ months: 0, weight: 32 }, { months: 3, weight: 83 }, { months: 6, weight: 138 }, { months: 12, weight: 195 }, { months: 24, weight: 300 }, { months: 36, weight: 380 }],
  },
  Gir: {
    M: [{ months: 0, weight: 30 }, { months: 3, weight: 78 }, { months: 6, weight: 130 }, { months: 12, weight: 195 }, { months: 24, weight: 320 }, { months: 36, weight: 430 }],
    F: [{ months: 0, weight: 28 }, { months: 3, weight: 70 }, { months: 6, weight: 115 }, { months: 12, weight: 170 }, { months: 24, weight: 260 }, { months: 36, weight: 340 }],
  },
  Senepol: {
    M: [{ months: 0, weight: 36 }, { months: 3, weight: 100 }, { months: 6, weight: 168 }, { months: 12, weight: 255 }, { months: 24, weight: 400 }, { months: 36, weight: 530 }],
    F: [{ months: 0, weight: 34 }, { months: 3, weight: 90 }, { months: 6, weight: 148 }, { months: 12, weight: 220 }, { months: 24, weight: 330 }, { months: 36, weight: 410 }],
  },
};

// In-memory editable store (would be persisted with backend)
let customCurves: GrowthCurveMap = JSON.parse(JSON.stringify(defaultCurves));

export function getGrowthCurves(): GrowthCurveMap { return customCurves; }

export function setGrowthCurve(breed: string, sex: Sexo, points: CurvePoint[]) {
  if (!customCurves[breed]) customCurves[breed] = { M: [], F: [] };
  customCurves[breed][sex] = [...points].sort((a, b) => a.months - b.months);
}

export function resetToDefaults() {
  customCurves = JSON.parse(JSON.stringify(defaultCurves));
}

export function getAvailableBreeds(): string[] {
  return Object.keys(customCurves).sort();
}

/** Interpolate expected weight for a given age in months */
export function interpolateExpectedWeight(breed: string, sex: Sexo, ageMonths: number): number | null {
  const curve = customCurves[breed]?.[sex];
  if (!curve || curve.length === 0) return null;

  // Exact match
  const exact = curve.find((p) => p.months === ageMonths);
  if (exact) return exact.weight;

  // Before first point
  if (ageMonths <= curve[0].months) return curve[0].weight;

  // After last point — extrapolate linearly
  if (ageMonths >= curve[curve.length - 1].months) {
    if (curve.length < 2) return curve[0].weight;
    const p1 = curve[curve.length - 2];
    const p2 = curve[curve.length - 1];
    const rate = (p2.weight - p1.weight) / (p2.months - p1.months);
    return Math.round(p2.weight + rate * (ageMonths - p2.months));
  }

  // Interpolate between two points
  for (let i = 0; i < curve.length - 1; i++) {
    if (ageMonths >= curve[i].months && ageMonths <= curve[i + 1].months) {
      const p1 = curve[i];
      const p2 = curve[i + 1];
      const t = (ageMonths - p1.months) / (p2.months - p1.months);
      return Math.round(p1.weight + t * (p2.weight - p1.weight));
    }
  }
  return null;
}

/** Get development percentage for an animal (current weight vs expected) */
export function getAnimalDevelopment(animalId: string): { pct: number; expected: number; ageMonths: number } | null {
  const animal = mockAnimals.find((a) => a.id === animalId);
  if (!animal) return null;

  const birthDate = new Date(animal.birth_date);
  const now = new Date();
  const ageMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

  const expected = interpolateExpectedWeight(animal.breed, animal.sex, ageMonths);
  if (!expected || expected <= 0) return null;

  const pct = Math.round((animal.current_weight / expected) * 100);
  return { pct, expected, ageMonths };
}

/** Build chart data merging real weighings with expected curve */
export function buildGrowthChartData(
  animalId: string,
): { ageMonths: number; real: number | null; expected: number | null; date?: string }[] {
  const animal = mockAnimals.find((a) => a.id === animalId);
  if (!animal) return [];

  const birthDate = new Date(animal.birth_date);
  const curve = customCurves[animal.breed]?.[animal.sex];
  const weighings = mockWeighings.filter((w) => w.animal_id === animalId).sort((a, b) => a.date.localeCompare(b.date));

  // Collect all months we want to plot
  const monthsSet = new Set<number>();
  if (curve) curve.forEach((p) => monthsSet.add(p.months));
  weighings.forEach((w) => {
    const d = new Date(w.date);
    const m = (d.getFullYear() - birthDate.getFullYear()) * 12 + (d.getMonth() - birthDate.getMonth());
    monthsSet.add(Math.max(0, m));
  });

  const allMonths = Array.from(monthsSet).sort((a, b) => a - b);

  // Build weighing map (closest month)
  const weighingByMonth = new Map<number, { weight: number; date: string }>();
  weighings.forEach((w) => {
    const d = new Date(w.date);
    const m = Math.max(0, (d.getFullYear() - birthDate.getFullYear()) * 12 + (d.getMonth() - birthDate.getMonth()));
    weighingByMonth.set(m, { weight: w.weight_kg, date: w.date });
  });

  return allMonths.map((m) => {
    const wData = weighingByMonth.get(m);
    return {
      ageMonths: m,
      real: wData?.weight ?? null,
      expected: interpolateExpectedWeight(animal.breed, animal.sex, m),
      date: wData?.date,
    };
  });
}
