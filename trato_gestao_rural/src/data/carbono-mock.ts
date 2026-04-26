/* ── Pegada de Carbono — dados, fatores e cálculos ── */

import { mockAnimals, calcAnimalCategory } from "./rebanho-mock";
import { mockPropriedade } from "./propriedades-mock";

// ═══ FATORES DE EMISSÃO (GHG Protocol Agro / IPCC) ═══
export const FATORES = {
  enterica_corte: 56,        // kgCO₂eq/cabeça/ano
  enterica_leiteiro: 68,     // kgCO₂eq/cabeça/ano
  dejetos_pastagem: 1,       // kgCO₂eq/cabeça/ano
  diesel: 2.68,              // kgCO₂eq/litro
  gasolina: 2.31,            // kgCO₂eq/litro
  etanol: 0.59,              // kgCO₂eq/litro
  energia_eletrica: 0.0817,  // kgCO₂eq/kWh
  calcario: 0.44,            // kgCO₂eq/kg
  ureia: 0.73,               // kgCO₂eq/kg
  sequestro_pastagem: -0.5,  // tCO₂eq/ha/ano
  sequestro_mata: -5.0,      // tCO₂eq/ha/ano
};

export const BENCHMARK = {
  media_brasileira: 8.5,       // kgCO₂eq/@
  media_sustentavel: 4.0,      // kgCO₂eq/@
};

// ═══ Interfaces ═══
export interface EmissaoRebanho {
  bovinosCorte: number;
  bovinosLeiteiros: number;
  totalCabecas: number;
  emissaoEnterica: number;    // kgCO₂eq
  emissaoDejetos: number;     // kgCO₂eq
  total: number;              // kgCO₂eq
}

export interface EmissaoCombustivel {
  dieselLitros: number;
  gasolinaLitros: number;
  etanolLitros: number;
  totalDiesel: number;
  totalGasolina: number;
  totalEtanol: number;
  total: number;              // kgCO₂eq
}

export interface EmissaoEnergia {
  kwh: number;
  total: number;              // kgCO₂eq
}

export interface EmissaoFertilizante {
  calcarioKg: number;
  ureiaKg: number;
  outrosNKg: number;
  totalCalcario: number;
  totalUreia: number;
  totalOutros: number;
  total: number;              // kgCO₂eq
}

export interface SequestroPastagem {
  areaBemManejada: number;    // ha
  areaDegradada: number;      // ha
  total: number;              // tCO₂eq (negativo)
}

export interface SequestroMata {
  areaHa: number;
  total: number;              // tCO₂eq (negativo)
}

export interface SequestroReflorestamento {
  areaHa: number;
  idadeMedia: number;
  especie: string;
  fatorSequestro: number;     // tCO₂eq/ha/ano
  total: number;
}

export interface BalancoCarbono {
  ano: number;
  emissoesBrutas: number;     // tCO₂eq
  sequestroTotal: number;     // tCO₂eq (negativo)
  balancoLiquido: number;     // tCO₂eq
  arrobasProduzidas: number;
  emissaoPorArroba: number;   // kgCO₂eq/@
  emissaoPorHectare: number;  // tCO₂eq/ha
  rebanho: EmissaoRebanho;
  combustivel: EmissaoCombustivel;
  energia: EmissaoEnergia;
  fertilizante: EmissaoFertilizante;
  pastagem: SequestroPastagem;
  mata: SequestroMata;
  reflorestamento: SequestroReflorestamento;
}

export interface MetaCarbono {
  metaKgArroba: number;
  anoMeta: number;
}

// ═══ Cálculos automáticos ═══
export function calcRebanho(): EmissaoRebanho {
  const ativos = mockAnimals.filter((a) => a.species === "bovino" && a.current_status === "ativo");
  const leiteiros = ativos.filter((a) => {
    const cat = calcAnimalCategory(a);
    return cat === "vaca_leiteira";
  }).length;
  // Vacas com first_calving_date e breed Girolando/Gir/Holandês → leiteiras
  const leiteirosEst = ativos.filter((a) =>
    a.sex === "F" && a.first_calving_date && ["Girolando", "Gir", "Holandês"].includes(a.breed)
  ).length;
  const totalLeiteiros = Math.max(leiteiros, leiteirosEst);
  const totalCorte = ativos.length - totalLeiteiros;

  const emissaoEnterica = totalCorte * FATORES.enterica_corte + totalLeiteiros * FATORES.enterica_leiteiro;
  const emissaoDejetos = ativos.length * FATORES.dejetos_pastagem;

  return {
    bovinosCorte: totalCorte,
    bovinosLeiteiros: totalLeiteiros,
    totalCabecas: ativos.length,
    emissaoEnterica,
    emissaoDejetos,
    total: emissaoEnterica + emissaoDejetos,
  };
}

// ═══ Mock data for current year ═══
export function calcBalancoAtual(): BalancoCarbono {
  const rebanho = calcRebanho();

  const combustivel: EmissaoCombustivel = {
    dieselLitros: 12000,
    gasolinaLitros: 2500,
    etanolLitros: 800,
    totalDiesel: 12000 * FATORES.diesel,
    totalGasolina: 2500 * FATORES.gasolina,
    totalEtanol: 800 * FATORES.etanol,
    total: 12000 * FATORES.diesel + 2500 * FATORES.gasolina + 800 * FATORES.etanol,
  };

  const energia: EmissaoEnergia = {
    kwh: 18000,
    total: 18000 * FATORES.energia_eletrica,
  };

  const fertilizante: EmissaoFertilizante = {
    calcarioKg: 25000,
    ureiaKg: 8000,
    outrosNKg: 2000,
    totalCalcario: 25000 * FATORES.calcario,
    totalUreia: 8000 * FATORES.ureia,
    totalOutros: 2000 * 0.73,
    total: 25000 * FATORES.calcario + 8000 * FATORES.ureia + 2000 * 0.73,
  };

  const areaProdutiva = mockPropriedade.areaProdutiva;
  const areaPreservacao = mockPropriedade.areaPreservacao;

  const pastagem: SequestroPastagem = {
    areaBemManejada: areaProdutiva * 0.85,
    areaDegradada: areaProdutiva * 0.15,
    total: areaProdutiva * 0.85 * FATORES.sequestro_pastagem,
  };

  const mata: SequestroMata = {
    areaHa: areaPreservacao,
    total: areaPreservacao * FATORES.sequestro_mata,
  };

  const reflorestamento: SequestroReflorestamento = {
    areaHa: 15,
    idadeMedia: 4,
    especie: "Eucalipto",
    fatorSequestro: -8.0,
    total: 15 * -8.0,
  };

  const emissoesBrutasKg = rebanho.total + combustivel.total + energia.total + fertilizante.total;
  const emissoesBrutas = emissoesBrutasKg / 1000; // tCO₂eq
  const sequestroTotal = pastagem.total + mata.total + reflorestamento.total;
  const balancoLiquido = emissoesBrutas + sequestroTotal;
  const arrobasProduzidas = 420; // mock: arrobas produzidas no ano
  const emissaoPorArroba = arrobasProduzidas > 0 ? (emissoesBrutasKg / arrobasProduzidas) / 1 : 0;
  const emissaoPorHectare = mockPropriedade.areaTotal > 0 ? emissoesBrutas / mockPropriedade.areaTotal : 0;

  return {
    ano: 2026,
    emissoesBrutas,
    sequestroTotal,
    balancoLiquido,
    arrobasProduzidas,
    emissaoPorArroba: Number((emissaoPorArroba / 1000).toFixed(2)), // kgCO₂eq/@
    emissaoPorHectare: Number(emissaoPorHectare.toFixed(2)),
    rebanho, combustivel, energia, fertilizante,
    pastagem, mata, reflorestamento,
  };
}

// Histórico mock
export function getHistorico(): BalancoCarbono[] {
  const atual = calcBalancoAtual();
  return [
    { ...atual, ano: 2024, emissoesBrutas: atual.emissoesBrutas * 1.15, sequestroTotal: atual.sequestroTotal * 0.85, balancoLiquido: atual.emissoesBrutas * 1.15 + atual.sequestroTotal * 0.85, arrobasProduzidas: 380, emissaoPorArroba: 6.8, emissaoPorHectare: atual.emissaoPorHectare * 1.12 },
    { ...atual, ano: 2025, emissoesBrutas: atual.emissoesBrutas * 1.05, sequestroTotal: atual.sequestroTotal * 0.95, balancoLiquido: atual.emissoesBrutas * 1.05 + atual.sequestroTotal * 0.95, arrobasProduzidas: 400, emissaoPorArroba: 5.9, emissaoPorHectare: atual.emissaoPorHectare * 1.04 },
    atual,
  ];
}

export const mockMeta: MetaCarbono = {
  metaKgArroba: 4.0,
  anoMeta: 2028,
};

export const PROGRAMAS_CERTIFICACAO = [
  {
    nome: "Programa ABC+",
    orgao: "MAPA",
    descricao: "Plano setorial de mitigação e adaptação às mudanças climáticas para agricultura de baixa emissão de carbono.",
    como: "Procurar instituição financeira credenciada (Banco do Brasil, BNDES, Sicredi) e apresentar projeto técnico.",
    link: "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/plano-abc",
  },
  {
    nome: "RenovAgro",
    orgao: "BNDES",
    descricao: "Linha de crédito com juros reduzidos para práticas agropecuárias sustentáveis, incluindo recuperação de pastagens e ILPF.",
    como: "Acessar via banco credenciado com projeto técnico de recuperação de pastagens ou sistemas integrados.",
    link: "https://www.bndes.gov.br",
  },
  {
    nome: "Rainforest Alliance",
    orgao: "Rainforest Alliance",
    descricao: "Certificação internacional de sustentabilidade para propriedades rurais com foco em conservação e práticas responsáveis.",
    como: "Contatar um organismo de certificação acreditado e passar por auditoria de campo conforme os padrões da aliança.",
    link: "https://www.rainforest-alliance.org",
  },
  {
    nome: "Verra (VCS)",
    orgao: "Verra",
    descricao: "Padrão verificado de carbono (Verified Carbon Standard) para registro e venda de créditos de carbono no mercado voluntário.",
    como: "Desenvolver PDD (Project Design Document) e passar por auditoria de terceira parte (validação e verificação).",
    link: "https://verra.org",
  },
];
