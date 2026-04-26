// CMV — Custo da Mercadoria Vendida (mock data & types)

export interface RateioConfig {
  maoDeObra: { corte: number; leiteiro: number; agricultura: number };
  energia: { corte: number; leiteiro: number; agricultura: number };
  manutencao: { corte: number; leiteiro: number; agricultura: number };
  administrativo: { corte: number; leiteiro: number; agricultura: number };
}

export const defaultRateio: RateioConfig = {
  maoDeObra: { corte: 50, leiteiro: 30, agricultura: 20 },
  energia: { corte: 40, leiteiro: 40, agricultura: 20 },
  manutencao: { corte: 50, leiteiro: 25, agricultura: 25 },
  administrativo: { corte: 40, leiteiro: 30, agricultura: 30 },
};

export interface CmvLinhaConsolidada {
  atividade: string;
  receitaBruta: number;
  cmvDireto: number;
  cmvIndireto: number;
  cmvTotal: number;
  lucroBruto: number;
  margemBruta: number;
  despesasOp: number;
  lucroLiquido: number;
  margemLiquida: number;
}

export interface CmvCorteResumo {
  animaisVendidos: number;
  arrobasTotais: number;
  receitaTotal: number;
  precoMedioArroba: number;
  custoAquisicao: number;
  custoAlimentacao: number;
  custoSanidade: number;
  custoPastagem: number;
  custoMaoObra: number;
  custoMaquinas: number;
  cmvIndireto: number;
}

export interface CmvLeiteResumo {
  litrosProduzidos: number;
  litrosVendidos: number;
  litrosDescartados: number;
  receitaTotal: number;
  precoMedioLitro: number;
  custoAlimentacao: number;
  custoSanidade: number;
  custoMaoObra: number;
  custoEnergia: number;
  custoDepreciacao: number;
  custoInseminacao: number;
  cmvIndireto: number;
}

export interface CmvAgriResumo {
  cultura: string;
  safra: string;
  producaoSacas: number;
  vendidaSacas: number;
  receitaTotal: number;
  precoMedioSaca: number;
  custoInsumos: number;
  custoMecanizacao: number;
  custoMaoObra: number;
  custoArrendamento: number;
  custoTransporteSecagem: number;
  cmvIndireto: number;
  areaHa: number;
}

// Mock consolidated data
export function getMockConsolidado(): CmvLinhaConsolidada[] {
  const corte: CmvLinhaConsolidada = {
    atividade: "Pecuária de Corte",
    receitaBruta: 1_850_000,
    cmvDireto: 980_000,
    cmvIndireto: 145_000,
    cmvTotal: 1_125_000,
    lucroBruto: 725_000,
    margemBruta: 39.2,
    despesasOp: 185_000,
    lucroLiquido: 540_000,
    margemLiquida: 29.2,
  };
  const leiteiro: CmvLinhaConsolidada = {
    atividade: "Pecuária Leiteira",
    receitaBruta: 720_000,
    cmvDireto: 485_000,
    cmvIndireto: 98_000,
    cmvTotal: 583_000,
    lucroBruto: 137_000,
    margemBruta: 19.0,
    despesasOp: 72_000,
    lucroLiquido: 65_000,
    margemLiquida: 9.0,
  };
  const agri: CmvLinhaConsolidada = {
    atividade: "Agricultura",
    receitaBruta: 560_000,
    cmvDireto: 340_000,
    cmvIndireto: 68_000,
    cmvTotal: 408_000,
    lucroBruto: 152_000,
    margemBruta: 27.1,
    despesasOp: 56_000,
    lucroLiquido: 96_000,
    margemLiquida: 17.1,
  };
  const total: CmvLinhaConsolidada = {
    atividade: "TOTAL",
    receitaBruta: corte.receitaBruta + leiteiro.receitaBruta + agri.receitaBruta,
    cmvDireto: corte.cmvDireto + leiteiro.cmvDireto + agri.cmvDireto,
    cmvIndireto: corte.cmvIndireto + leiteiro.cmvIndireto + agri.cmvIndireto,
    cmvTotal: corte.cmvTotal + leiteiro.cmvTotal + agri.cmvTotal,
    lucroBruto: corte.lucroBruto + leiteiro.lucroBruto + agri.lucroBruto,
    margemBruta: 0,
    despesasOp: corte.despesasOp + leiteiro.despesasOp + agri.despesasOp,
    lucroLiquido: corte.lucroLiquido + leiteiro.lucroLiquido + agri.lucroLiquido,
    margemLiquida: 0,
  };
  total.margemBruta = total.receitaBruta > 0 ? +((total.lucroBruto / total.receitaBruta) * 100).toFixed(1) : 0;
  total.margemLiquida = total.receitaBruta > 0 ? +((total.lucroLiquido / total.receitaBruta) * 100).toFixed(1) : 0;
  return [corte, leiteiro, agri, total];
}

export function getMockCorte(): CmvCorteResumo {
  return {
    animaisVendidos: 320,
    arrobasTotais: 5_760,
    receitaTotal: 1_850_000,
    precoMedioArroba: 321.18,
    custoAquisicao: 385_000,
    custoAlimentacao: 248_000,
    custoSanidade: 42_000,
    custoPastagem: 128_000,
    custoMaoObra: 112_000,
    custoMaquinas: 65_000,
    cmvIndireto: 145_000,
  };
}

export function getMockLeite(): CmvLeiteResumo {
  return {
    litrosProduzidos: 432_000,
    litrosVendidos: 418_000,
    litrosDescartados: 14_000,
    receitaTotal: 720_000,
    precoMedioLitro: 1.72,
    custoAlimentacao: 235_000,
    custoSanidade: 38_000,
    custoMaoObra: 96_000,
    custoEnergia: 48_000,
    custoDepreciacao: 32_000,
    custoInseminacao: 36_000,
    cmvIndireto: 98_000,
  };
}

export function getMockAgricultura(): CmvAgriResumo {
  return {
    cultura: "Soja",
    safra: "2024/2025",
    producaoSacas: 8_400,
    vendidaSacas: 7_800,
    receitaTotal: 560_000,
    precoMedioSaca: 71.79,
    custoInsumos: 168_000,
    custoMecanizacao: 72_000,
    custoMaoObra: 45_000,
    custoArrendamento: 30_000,
    custoTransporteSecagem: 25_000,
    cmvIndireto: 68_000,
    areaHa: 140,
  };
}

// Composição do CMV para gráfico de pizza
export function getComposicaoCmv() {
  return [
    { name: "Alimentação", value: 483_000, fill: "hsl(var(--primary))" },
    { name: "Medicamentos", value: 80_000, fill: "hsl(var(--accent))" },
    { name: "Mão de obra", value: 253_000, fill: "hsl(var(--info))" },
    { name: "Máquinas/Combustível", value: 137_000, fill: "hsl(var(--destructive))" },
    { name: "Pastagem", value: 128_000, fill: "hsl(149, 40%, 50%)" },
    { name: "Outros", value: 135_000, fill: "hsl(var(--muted-foreground))" },
  ];
}

// Evolução mensal CMV por @ vs preço recebido
export function getEvolucaoMensalCorte() {
  return [
    { mes: "Jan", cmvArroba: 178, precoArroba: 305 },
    { mes: "Fev", cmvArroba: 182, precoArroba: 310 },
    { mes: "Mar", cmvArroba: 175, precoArroba: 315 },
    { mes: "Abr", cmvArroba: 190, precoArroba: 308 },
    { mes: "Mai", cmvArroba: 195, precoArroba: 320 },
    { mes: "Jun", cmvArroba: 188, precoArroba: 325 },
    { mes: "Jul", cmvArroba: 192, precoArroba: 318 },
    { mes: "Ago", cmvArroba: 198, precoArroba: 330 },
    { mes: "Set", cmvArroba: 185, precoArroba: 322 },
    { mes: "Out", cmvArroba: 180, precoArroba: 328 },
    { mes: "Nov", cmvArroba: 188, precoArroba: 335 },
    { mes: "Dez", cmvArroba: 195, precoArroba: 340 },
  ];
}

export function getEvolucaoMensalLeite() {
  return [
    { mes: "Jan", cmvLitro: 1.18, precoLitro: 1.65 },
    { mes: "Fev", cmvLitro: 1.22, precoLitro: 1.60 },
    { mes: "Mar", cmvLitro: 1.15, precoLitro: 1.68 },
    { mes: "Abr", cmvLitro: 1.25, precoLitro: 1.72 },
    { mes: "Mai", cmvLitro: 1.30, precoLitro: 1.78 },
    { mes: "Jun", cmvLitro: 1.35, precoLitro: 1.80 },
    { mes: "Jul", cmvLitro: 1.28, precoLitro: 1.75 },
    { mes: "Ago", cmvLitro: 1.20, precoLitro: 1.70 },
    { mes: "Set", cmvLitro: 1.15, precoLitro: 1.72 },
    { mes: "Out", cmvLitro: 1.12, precoLitro: 1.68 },
    { mes: "Nov", cmvLitro: 1.18, precoLitro: 1.74 },
    { mes: "Dez", cmvLitro: 1.22, precoLitro: 1.78 },
  ];
}

export function getWaterfallData() {
  const consolidado = getMockConsolidado();
  const total = consolidado[3];
  return [
    { name: "Receita Bruta", value: total.receitaBruta, fill: "hsl(149, 62%, 35%)" },
    { name: "(-) CMV Direto", value: -total.cmvDireto, fill: "hsl(0, 72%, 50%)" },
    { name: "(-) CMV Indireto", value: -total.cmvIndireto, fill: "hsl(0, 55%, 60%)" },
    { name: "Lucro Bruto", value: total.lucroBruto, fill: "hsl(149, 50%, 45%)" },
    { name: "(-) Desp. Operac.", value: -total.despesasOp, fill: "hsl(0, 60%, 55%)" },
    { name: "Lucro Líquido", value: total.lucroLiquido, fill: "hsl(149, 62%, 26%)" },
  ];
}
