export interface Level {
  name: string;
  number: number;
  minScore: number;
  maxScore: number;
  color: string; // hex color for badge/gauge
}

// 20 levels from D (worst) to AAA (best)
export const LEVELS: Level[] = [
  { name: "D",    number: 1,  minScore: 0,   maxScore: 4,   color: "#991B1B" },
  { name: "D+",   number: 2,  minScore: 5,   maxScore: 9,   color: "#B91C1C" },
  { name: "C-",   number: 3,  minScore: 10,  maxScore: 14,  color: "#DC2626" },
  { name: "C",    number: 4,  minScore: 15,  maxScore: 19,  color: "#EF4444" },
  { name: "C+",   number: 5,  minScore: 20,  maxScore: 24,  color: "#F97316" },
  { name: "B-",   number: 6,  minScore: 25,  maxScore: 29,  color: "#FB923C" },
  { name: "B",    number: 7,  minScore: 30,  maxScore: 34,  color: "#FBBF24" },
  { name: "B+",   number: 8,  minScore: 35,  maxScore: 39,  color: "#FCD34D" },
  { name: "BB-",  number: 9,  minScore: 40,  maxScore: 44,  color: "#FDE68A" },
  { name: "BB",   number: 10, minScore: 45,  maxScore: 49,  color: "#D9F99D" },
  { name: "BB+",  number: 11, minScore: 50,  maxScore: 54,  color: "#BEF264" },
  { name: "BBB-", number: 12, minScore: 55,  maxScore: 59,  color: "#A3E635" },
  { name: "BBB",  number: 13, minScore: 60,  maxScore: 64,  color: "#84CC16" },
  { name: "BBB+", number: 14, minScore: 65,  maxScore: 69,  color: "#65A30D" },
  { name: "A-",   number: 15, minScore: 70,  maxScore: 74,  color: "#4D7C0F" },
  { name: "A",    number: 16, minScore: 75,  maxScore: 79,  color: "#22C55E" },
  { name: "A+",   number: 17, minScore: 80,  maxScore: 84,  color: "#16A34A" },
  { name: "AA-",  number: 18, minScore: 85,  maxScore: 89,  color: "#15803D" },
  { name: "AA",   number: 19, minScore: 90,  maxScore: 94,  color: "#166534" },
  { name: "AAA",  number: 20, minScore: 95,  maxScore: 100, color: "#14532D" },
];

export function getLevel(score: number): Level {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return LEVELS.find(l => clamped >= l.minScore && clamped <= l.maxScore) ?? LEVELS[0];
}

export function getLevelColor(score: number): string {
  return getLevel(score).color;
}
