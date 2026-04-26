export interface ScoringCriterion {
  key: string;
  label: string;
  weight: number; // percentage, totals 100 per entity type
  inverted?: boolean; // if true, lower raw = higher score (e.g. complaints)
}

export type EntityType = "client" | "supplier" | "employee";

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  client: "Clients",
  supplier: "Suppliers",
  employee: "Employees",
};

export const CRITERIA_BY_TYPE: Record<EntityType, ScoringCriterion[]> = {
  client: [
    { key: "payment_punctuality",   label: "Payment Punctuality",   weight: 30 },
    { key: "purchase_volume",       label: "Purchase Volume",       weight: 25 },
    { key: "complaint_history",     label: "Complaint History",     weight: 25, inverted: true },
    { key: "relationship_longevity",label: "Relationship Longevity",weight: 20 },
  ],
  supplier: [
    { key: "delivery_punctuality",  label: "Delivery Punctuality",  weight: 35 },
    { key: "product_quality",       label: "Product/Service Quality",weight: 30 },
    { key: "price_competitiveness", label: "Price Competitiveness", weight: 20 },
    { key: "support_responsiveness",label: "Support & Responsiveness",weight: 15 },
  ],
  employee: [
    { key: "productivity_output",   label: "Productivity & Output", weight: 30 },
    { key: "attendance_punctuality",label: "Attendance & Punctuality",weight: 25 },
    { key: "teamwork_collaboration",label: "Teamwork & Collaboration",weight: 25 },
    { key: "goal_achievement",      label: "Goal Achievement",      weight: 20 },
  ],
};

/**
 * Calculate weighted score from 0-10 raw criterion scores → 0-100 final score.
 * Each criterion scored 0–10, weighted average scaled to 0–100.
 */
export function calculateWeightedScore(
  rawScores: Record<string, number>,
  criteria: ScoringCriterion[]
): number {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = criteria.reduce((sum, c) => {
    const raw = rawScores[c.key] ?? 0;
    // For inverted criteria: 10 - raw (fewer complaints = higher effective score)
    const effective = c.inverted ? (10 - raw) : raw;
    // Each criterion is 0–10, convert to 0–100 contribution via (effective / 10) * weight
    return sum + (effective / 10) * c.weight;
  }, 0);

  // weightedSum is already on 0–100 scale (since weights total 100)
  return Math.round((weightedSum / totalWeight) * 100 * 100) / 100;
}

export function getCriteriaForType(type: EntityType): ScoringCriterion[] {
  return CRITERIA_BY_TYPE[type] ?? [];
}
