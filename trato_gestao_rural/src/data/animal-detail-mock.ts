// Animal detail mock data — weighings, treatments, reproduction, locations, milk, financials

export interface Weighing {
  id: string;
  animal_id: string;
  date: string;
  weight_kg: number;
  weight_arroba: number;
  method: "balança" | "fita" | "visual";
  weighed_by: string;
  paddock: string;
  notes: string;
}

export interface TreatmentEvent {
  id: string;
  animal_id: string;
  date: string;
  type: "vacina" | "vermifugo" | "antibiotico" | "anti-inflamatorio" | "outro";
  medication: string;
  dose: string;
  route: "IM" | "SC" | "IV" | "Oral" | "Pour-on";
  applied_by: string;
  withdrawal_days: number;
  notes: string;
}

export interface ReproductiveEvent {
  id: string;
  animal_id: string;
  date: string;
  event_type: "cobertura" | "iatf" | "diagnostico_prenhez" | "parto" | "aborto" | "desmame";
  details: string;
  partner_id?: string;
  partner_ear_tag?: string;
  result?: string;
  calf_id?: string;
  notes: string;
}

export interface AnimalLocation {
  id: string;
  animal_id: string;
  paddock_from: string;
  paddock_to: string;
  entry_date: string;
  exit_date: string | null;
  days: number;
}

export interface MilkYield {
  id: string;
  animal_id: string;
  date: string;
  shift: "manhã" | "tarde";
  liters: number;
  notes: string;
}

export interface SaleDetail {
  buyer: string;
  sold_weight_kg: number;
  price_per_arroba: number;
  total: number;
  date: string;
}

export interface SlaughterDetail {
  date: string;
  live_weight_kg: number;
  carcass_weight_kg: number;
  yield_pct: number;
}

export interface AnimalFinancial {
  animal_id: string;
  sale?: SaleDetail;
  slaughter?: SlaughterDetail;
  transactions: { date: string; description: string; amount: number; type: "receita" | "despesa" }[];
}

// ── Weighings ──
export const mockWeighings: Weighing[] = [
  { id: "w1", animal_id: "an-1", date: "2024-01-15", weight_kg: 390, weight_arroba: 26.0, method: "balança", weighed_by: "João", paddock: "Pasto Norte", notes: "" },
  { id: "w2", animal_id: "an-1", date: "2024-04-10", weight_kg: 420, weight_arroba: 28.0, method: "balança", weighed_by: "João", paddock: "Pasto Norte", notes: "" },
  { id: "w3", animal_id: "an-1", date: "2024-07-20", weight_kg: 445, weight_arroba: 29.7, method: "balança", weighed_by: "Carlos", paddock: "Pasto Leste", notes: "" },
  { id: "w4", animal_id: "an-1", date: "2024-10-05", weight_kg: 460, weight_arroba: 30.7, method: "balança", weighed_by: "Carlos", paddock: "Pasto Norte", notes: "Pós-desmame" },
  { id: "w5", animal_id: "an-1", date: "2025-01-12", weight_kg: 475, weight_arroba: 31.7, method: "balança", weighed_by: "João", paddock: "Pasto Norte", notes: "" },
  { id: "w6", animal_id: "an-1", date: "2025-06-18", weight_kg: 480, weight_arroba: 32.0, method: "balança", weighed_by: "João", paddock: "Pasto Norte", notes: "" },
  { id: "w7", animal_id: "an-2", date: "2024-03-10", weight_kg: 680, weight_arroba: 45.3, method: "balança", weighed_by: "João", paddock: "Pasto Sul", notes: "" },
  { id: "w8", animal_id: "an-2", date: "2024-09-15", weight_kg: 700, weight_arroba: 46.7, method: "balança", weighed_by: "Carlos", paddock: "Pasto Sul", notes: "" },
  { id: "w9", animal_id: "an-2", date: "2025-03-20", weight_kg: 720, weight_arroba: 48.0, method: "balança", weighed_by: "João", paddock: "Pasto Sul", notes: "" },
  { id: "w10", animal_id: "an-3", date: "2024-06-01", weight_kg: 280, weight_arroba: 18.7, method: "balança", weighed_by: "João", paddock: "Piquete Maternidade", notes: "" },
  { id: "w11", animal_id: "an-3", date: "2025-01-10", weight_kg: 330, weight_arroba: 22.0, method: "balança", weighed_by: "Carlos", paddock: "Piquete Maternidade", notes: "" },
  { id: "w12", animal_id: "an-3", date: "2025-07-01", weight_kg: 350, weight_arroba: 23.3, method: "fita", weighed_by: "João", paddock: "Piquete Maternidade", notes: "" },
];

// ── Treatments ──
export const mockTreatments: TreatmentEvent[] = [
  { id: "t1", animal_id: "an-1", date: "2024-05-10", type: "vacina", medication: "Aftosa Ourovac", dose: "5ml", route: "IM", applied_by: "Dr. Silva", withdrawal_days: 0, notes: "Campanha maio" },
  { id: "t2", animal_id: "an-1", date: "2024-05-10", type: "vacina", medication: "Brucelose B19", dose: "2ml", route: "SC", applied_by: "Dr. Silva", withdrawal_days: 0, notes: "" },
  { id: "t3", animal_id: "an-1", date: "2024-08-15", type: "vermifugo", medication: "Ivermectina 1%", dose: "10ml", route: "SC", applied_by: "Carlos", withdrawal_days: 28, notes: "" },
  { id: "t4", animal_id: "an-1", date: "2024-11-20", type: "vacina", medication: "Aftosa Ourovac", dose: "5ml", route: "IM", applied_by: "Dr. Silva", withdrawal_days: 0, notes: "Campanha novembro" },
  { id: "t5", animal_id: "an-1", date: "2025-02-10", type: "antibiotico", medication: "Oxitetraciclina LA", dose: "15ml", route: "IM", applied_by: "Dr. Silva", withdrawal_days: 30, notes: "Tratamento mastite" },
  { id: "t6", animal_id: "an-1", date: "2025-05-12", type: "vacina", medication: "Aftosa Ourovac", dose: "5ml", route: "IM", applied_by: "Dr. Silva", withdrawal_days: 0, notes: "Campanha maio" },
  { id: "t7", animal_id: "an-2", date: "2024-05-10", type: "vacina", medication: "Aftosa Ourovac", dose: "5ml", route: "IM", applied_by: "Dr. Silva", withdrawal_days: 0, notes: "" },
  { id: "t8", animal_id: "an-2", date: "2024-08-15", type: "vermifugo", medication: "Ivermectina 1%", dose: "15ml", route: "SC", applied_by: "Carlos", withdrawal_days: 28, notes: "" },
  { id: "t9", animal_id: "an-3", date: "2024-05-10", type: "vacina", medication: "Aftosa Ourovac", dose: "5ml", route: "IM", applied_by: "Dr. Silva", withdrawal_days: 0, notes: "" },
];

// ── Reproductive Events ──
export const mockReproEvents: ReproductiveEvent[] = [
  { id: "r1", animal_id: "an-1", date: "2023-06-15", event_type: "cobertura", details: "Monta natural", partner_id: "an-2", partner_ear_tag: "BR002", notes: "" },
  { id: "r2", animal_id: "an-1", date: "2023-08-20", event_type: "diagnostico_prenhez", details: "Positivo — 60 dias", result: "positivo", notes: "Ultrassom" },
  { id: "r3", animal_id: "an-1", date: "2024-03-10", event_type: "parto", details: "Parto normal — 1 bezerro macho", calf_id: "an-6", notes: "Sem complicações" },
  { id: "r4", animal_id: "an-1", date: "2024-10-01", event_type: "desmame", details: "Desmame do bezerro BR006", calf_id: "an-6", notes: "" },
  { id: "r5", animal_id: "an-1", date: "2025-01-20", event_type: "iatf", details: "IATF protocolo J-Synch", partner_ear_tag: "Sêmen Nelore Elite", notes: "Lote 2025-A" },
  { id: "r6", animal_id: "an-1", date: "2025-03-25", event_type: "diagnostico_prenhez", details: "Positivo — 55 dias", result: "positivo", notes: "" },
  // Touro
  { id: "r7", animal_id: "an-2", date: "2023-06-15", event_type: "cobertura", details: "Monta natural com BR001", partner_id: "an-1", partner_ear_tag: "BR001", notes: "" },
  { id: "r8", animal_id: "an-2", date: "2024-06-20", event_type: "cobertura", details: "Monta natural com BR010", partner_id: "an-10", partner_ear_tag: "BR010", notes: "" },
  // Fêmea 10
  { id: "r9", animal_id: "an-10", date: "2023-02-10", event_type: "cobertura", details: "IATF", partner_ear_tag: "Sêmen Gir Leiteiro", notes: "" },
  { id: "r10", animal_id: "an-10", date: "2023-11-15", event_type: "parto", details: "Parto normal — 1 bezerra fêmea", notes: "" },
];

// ── Locations ──
export const mockLocations: AnimalLocation[] = [
  { id: "l1", animal_id: "an-1", paddock_from: "Piquete Maternidade", paddock_to: "Pasto Leste", entry_date: "2021-12-01", exit_date: "2023-06-01", days: 548 },
  { id: "l2", animal_id: "an-1", paddock_from: "Pasto Leste", paddock_to: "Pasto Norte", entry_date: "2023-06-01", exit_date: "2024-07-15", days: 410 },
  { id: "l3", animal_id: "an-1", paddock_from: "Pasto Norte", paddock_to: "Pasto Leste", entry_date: "2024-07-15", exit_date: "2024-10-01", days: 78 },
  { id: "l4", animal_id: "an-1", paddock_from: "Pasto Leste", paddock_to: "Pasto Norte", entry_date: "2024-10-01", exit_date: null, days: 158 },
  { id: "l5", animal_id: "an-2", paddock_from: "Curral 1", paddock_to: "Pasto Sul", entry_date: "2020-03-01", exit_date: null, days: 1833 },
  { id: "l6", animal_id: "an-3", paddock_from: "Piquete Maternidade", paddock_to: "Piquete Maternidade", entry_date: "2022-09-08", exit_date: null, days: 910 },
];

// ── Milk Yields ──
export const mockMilkYields: MilkYield[] = [
  { id: "m1", animal_id: "an-1", date: "2025-03-01", shift: "manhã", liters: 12.5, notes: "" },
  { id: "m2", animal_id: "an-1", date: "2025-03-01", shift: "tarde", liters: 8.2, notes: "" },
  { id: "m3", animal_id: "an-1", date: "2025-03-02", shift: "manhã", liters: 13.0, notes: "" },
  { id: "m4", animal_id: "an-1", date: "2025-03-02", shift: "tarde", liters: 7.8, notes: "" },
  { id: "m5", animal_id: "an-1", date: "2025-03-03", shift: "manhã", liters: 11.9, notes: "" },
  { id: "m6", animal_id: "an-1", date: "2025-03-03", shift: "tarde", liters: 8.5, notes: "" },
  { id: "m7", animal_id: "an-1", date: "2025-03-04", shift: "manhã", liters: 12.8, notes: "Boa produção" },
  { id: "m8", animal_id: "an-1", date: "2025-03-04", shift: "tarde", liters: 7.5, notes: "" },
  { id: "m9", animal_id: "an-1", date: "2025-03-05", shift: "manhã", liters: 13.2, notes: "" },
  { id: "m10", animal_id: "an-1", date: "2025-03-05", shift: "tarde", liters: 8.0, notes: "" },
  { id: "m11", animal_id: "an-10", date: "2025-03-01", shift: "manhã", liters: 18.0, notes: "" },
  { id: "m12", animal_id: "an-10", date: "2025-03-01", shift: "tarde", liters: 14.5, notes: "" },
  { id: "m13", animal_id: "an-10", date: "2025-03-02", shift: "manhã", liters: 17.5, notes: "" },
  { id: "m14", animal_id: "an-10", date: "2025-03-02", shift: "tarde", liters: 15.0, notes: "" },
];

// ── Financials ──
export const mockAnimalFinancials: AnimalFinancial[] = [
  {
    animal_id: "an-7",
    sale: { buyer: "Frigorífico São Paulo", sold_weight_kg: 680, price_per_arroba: 320, total: 14507, date: "2026-01-10" },
    transactions: [
      { date: "2026-01-10", description: "Venda de animal BR007", amount: 14507, type: "receita" },
      { date: "2020-05-15", description: "Compra de animal BR007", amount: -8500, type: "despesa" },
    ],
  },
  {
    animal_id: "an-1",
    transactions: [
      { date: "2025-02-10", description: "Tratamento mastite — medicamentos", amount: -180, type: "despesa" },
      { date: "2024-05-10", description: "Vacinação campanha maio", amount: -25, type: "despesa" },
      { date: "2025-03-01", description: "Venda de leite (quota mensal)", amount: 850, type: "receita" },
    ],
  },
];

// Timeline event for the summary tab
export interface TimelineEvent {
  id: string;
  date: string;
  type: "pesagem" | "tratamento" | "reprodução" | "movimentação" | "leite";
  description: string;
}

export function getAnimalTimeline(animalId: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  mockWeighings
    .filter((w) => w.animal_id === animalId)
    .forEach((w) => events.push({ id: w.id, date: w.date, type: "pesagem", description: `Pesagem: ${w.weight_kg} kg` }));

  mockTreatments
    .filter((t) => t.animal_id === animalId)
    .forEach((t) => events.push({ id: t.id, date: t.date, type: "tratamento", description: `${t.type}: ${t.medication}` }));

  mockReproEvents
    .filter((r) => r.animal_id === animalId)
    .forEach((r) => events.push({ id: r.id, date: r.date, type: "reprodução", description: `${r.event_type}: ${r.details}` }));

  mockLocations
    .filter((l) => l.animal_id === animalId)
    .forEach((l) => events.push({ id: l.id, date: l.entry_date, type: "movimentação", description: `${l.paddock_from} → ${l.paddock_to}` }));

  events.sort((a, b) => b.date.localeCompare(a.date));
  return events;
}
