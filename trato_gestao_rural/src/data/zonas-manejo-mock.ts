// ── Zonas de Manejo (VRA) — Mock ─────────────────────────────────────────────
// Simula zonas com doses variáveis baseadas em NDVI para aplicação localizada

import type { ZonaManejo } from "@/lib/geo-io";

export interface PrescricaoMapa {
  id: string;
  nome: string;
  talhaoId: string;
  talhaoNome: string;
  areaHa: number;
  dataGeracao: string;
  tipo: "adubacao" | "pulverizacao" | "dessecacao" | "calcario";
  produto: string;
  doseBase: number;
  unidade: string;
  custoUnit: number;       // R$ por L ou kg
  zonas: ZonaManejo[];
  status: "rascunho" | "aprovada" | "executada";
  ndviMedio?: number;
  fonteDados?: "ndvi-drone" | "ndvi-satelite" | "manual" | "amostragem-solo";
  economiaEstimada?: number;
}

export const prescricoesMock: PrescricaoMapa[] = [
  {
    id: "presc-001",
    nome: "Adubação N — Pasto Sul (VRA Ureia)",
    talhaoId: "pp-2",
    talhaoNome: "Pasto Sul",
    areaHa: 30,
    dataGeracao: "2026-04-15",
    tipo: "adubacao",
    produto: "Ureia Perlada 46%",
    doseBase: 150,
    unidade: "kg/ha",
    custoUnit: 2.4,
    status: "aprovada",
    ndviMedio: 0.58,
    fonteDados: "ndvi-drone",
    economiaEstimada: 1080,
    zonas: [
      {
        id: "pp-2-zona-1",
        talhaoId: "pp-2",
        nome: "Zona Baixa Produtividade (NDVI < 0.4)",
        coords: [
          [-19.752, -47.938],
          [-19.7535, -47.938],
          [-19.7535, -47.928],
          [-19.752, -47.928],
        ],
        dose: 195,
        unidade: "kg/ha",
        cor: "#dc2626",
        ndvi: 0.32,
        observacao: "Área compactada — requer N adicional",
      },
      {
        id: "pp-2-zona-2",
        talhaoId: "pp-2",
        nome: "Zona Média (NDVI 0.4-0.6)",
        coords: [
          [-19.7535, -47.938],
          [-19.755, -47.938],
          [-19.755, -47.928],
          [-19.7535, -47.928],
        ],
        dose: 150,
        unidade: "kg/ha",
        cor: "#f59e0b",
        ndvi: 0.52,
        observacao: "Vigor normal — dose padrão",
      },
      {
        id: "pp-2-zona-3",
        talhaoId: "pp-2",
        nome: "Zona Alta (NDVI > 0.7)",
        coords: [
          [-19.755, -47.938],
          [-19.757, -47.938],
          [-19.757, -47.928],
          [-19.755, -47.928],
        ],
        dose: 105,
        unidade: "kg/ha",
        cor: "#16a34a",
        ndvi: 0.75,
        observacao: "Pastagem vigorosa — reduzir dose em 30%",
      },
    ],
  },
  {
    id: "presc-002",
    nome: "Pulverização Localizada — Pasto Grande",
    talhaoId: "pp-4",
    talhaoNome: "Pasto Grande",
    areaHa: 45,
    dataGeracao: "2026-04-18",
    tipo: "pulverizacao",
    produto: "Engeo Pleno S",
    doseBase: 125,
    unidade: "mL/ha",
    custoUnit: 0.72,
    status: "executada",
    ndviMedio: 0.62,
    fonteDados: "ndvi-drone",
    economiaEstimada: 2430,
    zonas: [
      {
        id: "pp-4-zona-1",
        talhaoId: "pp-4",
        nome: "Foco de cigarrinha",
        coords: [
          [-19.742, -47.940],
          [-19.745, -47.940],
          [-19.745, -47.943],
          [-19.742, -47.943],
        ],
        dose: 125,
        unidade: "mL/ha",
        cor: "#dc2626",
        observacao: "Infestação alta detectada em voo de inspeção",
      },
      {
        id: "pp-4-zona-2",
        talhaoId: "pp-4",
        nome: "Área sem aplicação",
        coords: [
          [-19.745, -47.940],
          [-19.750, -47.940],
          [-19.750, -47.946],
          [-19.745, -47.946],
        ],
        dose: 0,
        unidade: "mL/ha",
        cor: "#16a34a",
        observacao: "Sem sintomas — não aplicar",
      },
    ],
  },
];

export const STATUS_LABELS = {
  rascunho: "Rascunho",
  aprovada: "Aprovada",
  executada: "Executada",
} as const;

export const FONTE_LABELS = {
  "ndvi-drone": "NDVI via Drone",
  "ndvi-satelite": "NDVI via Satélite",
  manual: "Desenho Manual",
  "amostragem-solo": "Amostragem de Solo",
} as const;
