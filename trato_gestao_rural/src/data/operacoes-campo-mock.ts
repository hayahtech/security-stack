// ── Operações de Campo — Mock Data ──────────────────────────────────────────
// Pulverização, adubação, dessecação, calcário, plantio
// Dados realistas para Fazenda Boa Vista — Uberaba/MG

export type TipoOperacao =
  | "pulverizacao"
  | "adubacao"
  | "dessecacao"
  | "calcario"
  | "plantio"
  | "outro";

export type StatusOperacao = "planejada" | "em_execucao" | "concluida" | "cancelada";
export type TipoEquipamento = "drone" | "trator" | "aviao" | "costal";
export type UnidadeDose = "L/ha" | "kg/ha" | "g/ha" | "t/ha" | "mL/ha";
export type ClasseToxico = "I" | "II" | "III" | "IV";

export interface ProdutoAplicado {
  nome: string;
  principioAtivo: string;
  registroMapa: string;
  classeToxico: ClasseToxico;
  dose: number;
  unidade: UnidadeDose;
  volumeTotal: number;
  custo: number;
}

export interface OperacaoCampo {
  id: string;
  tipo: TipoOperacao;
  talhaoId: string;
  talhaoNome: string;
  areaHa: number;
  produtos: ProdutoAplicado[];
  equipamento: {
    tipo: TipoEquipamento;
    modelo: string;
    registro?: string;
  };
  operador: {
    nome: string;
    documento: string;
    art?: string;
  };
  dataInicio: string;
  dataFim?: string;
  areaPlanejaHa: number;
  areaCobertaHa?: number;
  clima: {
    vento: number;        // km/h
    temperatura: number;  // °C
    umidade: number;      // %
    chuvaUltimas24h: boolean;
  };
  carenciaDias: number;
  carenciaVence?: string; // ISO date string
  observacoes?: string;
  status: StatusOperacao;
  custoTotal: number;
  telemetriaUrl?: string; // link para CSV de telemetria importado
}

// ── Talhões com polígonos georreferenciados ──────────────────────────────────
// Coordenadas idênticas ao MapaFazenda.tsx para consistência
export interface TalhaoMapa {
  id: string;
  nome: string;
  areaHa: number;
  coords: [number, number][];
}

export const talhoesMapa: TalhaoMapa[] = [
  {
    id: "pp-1",
    nome: "Pasto Norte",
    areaHa: 25,
    coords: [[-19.738, -47.938], [-19.738, -47.930], [-19.742, -47.930], [-19.742, -47.938]],
  },
  {
    id: "pp-2",
    nome: "Pasto Sul",
    areaHa: 30,
    coords: [[-19.752, -47.938], [-19.752, -47.928], [-19.757, -47.928], [-19.757, -47.938]],
  },
  {
    id: "pp-3",
    nome: "Pasto Leste",
    areaHa: 18,
    coords: [[-19.744, -47.925], [-19.744, -47.920], [-19.748, -47.920], [-19.748, -47.925]],
  },
  {
    id: "pp-4",
    nome: "Pasto Grande",
    areaHa: 45,
    coords: [[-19.742, -47.940], [-19.742, -47.946], [-19.750, -47.946], [-19.750, -47.940]],
  },
  {
    id: "pp-5",
    nome: "Piquete Maternidade",
    areaHa: 5,
    coords: [[-19.748, -47.932], [-19.748, -47.929], [-19.750, -47.929], [-19.750, -47.932]],
  },
];

// ── Mock de operações realizadas ─────────────────────────────────────────────
export const operacoesMock: OperacaoCampo[] = [
  {
    id: "op-001",
    tipo: "dessecacao",
    talhaoId: "pp-1",
    talhaoNome: "Pasto Norte",
    areaHa: 25,
    produtos: [
      {
        nome: "Roundup Transorb R",
        principioAtivo: "Glifosato",
        registroMapa: "01016",
        classeToxico: "III",
        dose: 3.0,
        unidade: "L/ha",
        volumeTotal: 75,
        custo: 1350,
      },
    ],
    equipamento: { tipo: "drone", modelo: "DJI Agras T40", registro: "ANAC-2024-001" },
    operador: { nome: "Carlos Souza", documento: "123.456.789-00", art: "ART-2026-0123" },
    dataInicio: "2026-03-15T07:30:00",
    dataFim: "2026-03-15T09:15:00",
    areaPlanejaHa: 25,
    areaCobertaHa: 24.3,
    clima: { vento: 8, temperatura: 24, umidade: 65, chuvaUltimas24h: false },
    carenciaDias: 7,
    carenciaVence: "2026-03-22",
    observacoes: "Dessecante pré-reforma. Braquiária com 60 cm de altura. Cobertura 97%.",
    status: "concluida",
    custoTotal: 1620,
  },
  {
    id: "op-002",
    tipo: "adubacao",
    talhaoId: "pp-2",
    talhaoNome: "Pasto Sul",
    areaHa: 30,
    produtos: [
      {
        nome: "Ureia Perlada 46%",
        principioAtivo: "Ureia",
        registroMapa: "BR-fertiliz-0411",
        classeToxico: "IV",
        dose: 150,
        unidade: "kg/ha",
        volumeTotal: 4500,
        custo: 3600,
      },
    ],
    equipamento: { tipo: "drone", modelo: "DJI Agras T40", registro: "ANAC-2024-001" },
    operador: { nome: "Carlos Souza", documento: "123.456.789-00", art: "ART-2026-0124" },
    dataInicio: "2026-03-18T06:00:00",
    dataFim: "2026-03-18T08:30:00",
    areaPlanejaHa: 30,
    areaCobertaHa: 30,
    clima: { vento: 5, temperatura: 21, umidade: 75, chuvaUltimas24h: false },
    carenciaDias: 0,
    observacoes: "Adubação nitrogenada de manutenção. Aplicação noturna para reduzir volatilização.",
    status: "concluida",
    custoTotal: 3960,
  },
  {
    id: "op-003",
    tipo: "pulverizacao",
    talhaoId: "pp-4",
    talhaoNome: "Pasto Grande",
    areaHa: 45,
    produtos: [
      {
        nome: "Engeo Pleno S",
        principioAtivo: "Tiametoxam + Lambda-cialotrina",
        registroMapa: "09603",
        classeToxico: "II",
        dose: 125,
        unidade: "mL/ha",
        volumeTotal: 5625,
        custo: 4050,
      },
      {
        nome: "Move 480 SC",
        principioAtivo: "Spiromesifeno",
        registroMapa: "04304",
        classeToxico: "III",
        dose: 350,
        unidade: "mL/ha",
        volumeTotal: 15750,
        custo: 2835,
      },
    ],
    equipamento: { tipo: "drone", modelo: "DJI Agras T40", registro: "ANAC-2024-001" },
    operador: { nome: "Carlos Souza", documento: "123.456.789-00", art: "ART-2026-0125" },
    dataInicio: "2026-03-20T06:30:00",
    dataFim: "2026-03-20T10:00:00",
    areaPlanejaHa: 45,
    areaCobertaHa: 43.8,
    clima: { vento: 10, temperatura: 26, umidade: 58, chuvaUltimas24h: false },
    carenciaDias: 21,
    carenciaVence: "2026-04-10",
    observacoes: "Controle de cigarrinha-das-pastagens (Mahanarva). Infestação alta detectada em voo de inspeção. Zona de aplicação localizada — 60% da área.",
    status: "concluida",
    custoTotal: 7290,
  },
  {
    id: "op-004",
    tipo: "calcario",
    talhaoId: "pp-3",
    talhaoNome: "Pasto Leste",
    areaHa: 18,
    produtos: [
      {
        nome: "Calcário Calcítico PRNT 90",
        principioAtivo: "CaCO₃",
        registroMapa: "BR-corretivo-0018",
        classeToxico: "IV",
        dose: 2.5,
        unidade: "t/ha",
        volumeTotal: 45,
        custo: 4500,
      },
    ],
    equipamento: { tipo: "trator", modelo: "New Holland TL75 + distribuidor Vicon", registro: "MG-6745-JKL" },
    operador: { nome: "José Ferreira", documento: "987.654.321-00", art: "ART-2026-0130" },
    dataInicio: "2026-04-05T07:00:00",
    dataFim: "2026-04-05T12:00:00",
    areaPlanejaHa: 18,
    areaCobertaHa: 18,
    clima: { vento: 12, temperatura: 28, umidade: 50, chuvaUltimas24h: false },
    carenciaDias: 0,
    observacoes: "Correção de pH. Solo com pH 4.8 — meta pH 6.2. Aplicação incorporada com grade.",
    status: "concluida",
    custoTotal: 5400,
  },
  {
    id: "op-005",
    tipo: "pulverizacao",
    talhaoId: "pp-5",
    talhaoNome: "Piquete Maternidade",
    areaHa: 5,
    produtos: [
      {
        nome: "Bayfidan EC 250",
        principioAtivo: "Triadimefon",
        registroMapa: "05112",
        classeToxico: "III",
        dose: 500,
        unidade: "mL/ha",
        volumeTotal: 2500,
        custo: 750,
      },
    ],
    equipamento: { tipo: "costal", modelo: "Jacto PJ-20", registro: "" },
    operador: { nome: "José Ferreira", documento: "987.654.321-00" },
    dataInicio: "2026-04-15T08:00:00",
    dataFim: "2026-04-15T10:00:00",
    areaPlanejaHa: 5,
    areaCobertaHa: 5,
    clima: { vento: 7, temperatura: 23, umidade: 70, chuvaUltimas24h: false },
    carenciaDias: 14,
    carenciaVence: "2026-04-29",
    observacoes: "Controle preventivo de ferrugem-da-folha. Aplicação manual pois talhão tem vacas em lactação próximas.",
    status: "concluida",
    custoTotal: 870,
  },
  {
    id: "op-006",
    tipo: "adubacao",
    talhaoId: "pp-1",
    talhaoNome: "Pasto Norte",
    areaHa: 25,
    produtos: [
      {
        nome: "MAP Fertilizante",
        principioAtivo: "Fosfato Monoamônico (52% P₂O₅)",
        registroMapa: "BR-fertiliz-0301",
        classeToxico: "IV",
        dose: 80,
        unidade: "kg/ha",
        volumeTotal: 2000,
        custo: 2400,
      },
    ],
    equipamento: { tipo: "drone", modelo: "DJI Agras T40", registro: "ANAC-2024-001" },
    operador: { nome: "Carlos Souza", documento: "123.456.789-00", art: "ART-2026-0140" },
    dataInicio: "2026-04-22T06:00:00",
    areaPlanejaHa: 25,
    clima: { vento: 6, temperatura: 22, umidade: 72, chuvaUltimas24h: false },
    carenciaDias: 0,
    observacoes: "Adubação fosfatada pré-plantio após dessecação. Aguardando janela de chuva.",
    status: "planejada",
    custoTotal: 2640,
  },
  {
    id: "op-007",
    tipo: "pulverizacao",
    talhaoId: "pp-2",
    talhaoNome: "Pasto Sul",
    areaHa: 30,
    produtos: [
      {
        nome: "Karate Zeon 250 CS",
        principioAtivo: "Lambda-cialotrina",
        registroMapa: "02118",
        classeToxico: "II",
        dose: 200,
        unidade: "mL/ha",
        volumeTotal: 6000,
        custo: 1800,
      },
    ],
    equipamento: { tipo: "drone", modelo: "DJI Agras T40", registro: "ANAC-2024-001" },
    operador: { nome: "Carlos Souza", documento: "123.456.789-00" },
    dataInicio: "2026-04-23T07:00:00",
    areaPlanejaHa: 30,
    areaCobertaHa: 18,
    clima: { vento: 9, temperatura: 25, umidade: 62, chuvaUltimas24h: false },
    carenciaDias: 14,
    carenciaVence: "2026-05-07",
    observacoes: "Aplicação localizada — zona sudoeste com alta densidade de pragas detectada em voo de inspeção. 60% da área.",
    status: "em_execucao",
    custoTotal: 2160,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export const TIPO_LABELS: Record<TipoOperacao, string> = {
  pulverizacao: "Pulverização",
  adubacao: "Adubação",
  dessecacao: "Dessecação",
  calcario: "Calcário/Corretivo",
  plantio: "Plantio",
  outro: "Outro",
};

export const EQUIPAMENTO_LABELS: Record<TipoEquipamento, string> = {
  drone: "Drone Agrícola",
  trator: "Trator + Implemento",
  aviao: "Aviação Agrícola",
  costal: "Pulverizador Costal",
};

export const CLASSE_TOXICO_LABEL: Record<ClasseToxico, string> = {
  I: "I — Extremamente tóxico",
  II: "II — Altamente tóxico",
  III: "III — Mediamente tóxico",
  IV: "IV — Pouco tóxico",
};

export const CLASSE_TOXICO_COLOR: Record<ClasseToxico, string> = {
  I: "bg-red-700 text-white",
  II: "bg-red-500 text-white",
  III: "bg-yellow-500 text-black",
  IV: "bg-green-600 text-white",
};

/** Retorna status visual do talhão com base nas operações registradas */
export function getTalhaoOperacaoStatus(talhaoId: string, operacoes: OperacaoCampo[]) {
  const ops = operacoes
    .filter((o) => o.talhaoId === talhaoId && o.status !== "cancelada")
    .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());

  const ultima = ops[0];
  if (!ultima) return { color: "#6b7280", fill: "#6b728022", label: "Sem registro", op: null };

  if (ultima.status === "em_execucao")
    return { color: "#ef4444", fill: "#ef444430", label: "Em execução", op: ultima };
  if (ultima.status === "planejada")
    return { color: "#3b82f6", fill: "#3b82f630", label: "Planejada", op: ultima };

  if (ultima.carenciaVence) {
    const vence = new Date(ultima.carenciaVence);
    const hoje = new Date();
    const diasRestantes = Math.ceil((vence.getTime() - hoje.getTime()) / 86400000);
    if (diasRestantes > 0)
      return {
        color: "#f59e0b",
        fill: "#f59e0b30",
        label: `Carência — ${diasRestantes}d restantes`,
        op: ultima,
      };
  }

  return { color: "#22c55e", fill: "#22c55e22", label: "Liberado", op: ultima };
}

export function calcEficiencia(op: OperacaoCampo): number {
  if (!op.areaCobertaHa || !op.areaPlanejaHa) return 0;
  return Math.round((op.areaCobertaHa / op.areaPlanejaHa) * 100);
}

export function calcCustoHa(op: OperacaoCampo): number {
  const area = op.areaCobertaHa ?? op.areaPlanejaHa;
  return area > 0 ? Math.round(op.custoTotal / area) : 0;
}
