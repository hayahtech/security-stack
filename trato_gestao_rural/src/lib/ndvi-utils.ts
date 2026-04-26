// ── NDVI Utilities ────────────────────────────────────────────────────────────
// Paleta de cores, interpretação de valores, estatísticas por talhão

export interface NdviEstatisticas {
  talhaoId: string;
  talhaoNome: string;
  areaHa: number;
  ndviMin: number;
  ndviMax: number;
  ndviMedio: number;
  ndviMediano: number;
  distribuicao: NdviFaixa[];
  dataCaptura: string;
  fonte: "drone" | "satelite" | "simulado";
}

export interface NdviFaixa {
  label: string;
  min: number;
  max: number;
  cor: string;
  corFundo: string;
  percentArea: number;
  interpretacao: string;
  recomendacao: string;
}

// ── Paleta NDVI ───────────────────────────────────────────────────────────────
// Padrão agronômico: vermelho (baixo) → amarelo → verde (alto)
export const NDVI_FAIXAS: Omit<NdviFaixa, "percentArea">[] = [
  {
    label: "Muito Baixo",
    min: -1,
    max: 0.1,
    cor: "#7f1d1d",
    corFundo: "#fecaca",
    interpretacao: "Solo exposto ou vegetação morta",
    recomendacao: "Replantio urgente ou análise de solo",
  },
  {
    label: "Baixo",
    min: 0.1,
    max: 0.3,
    cor: "#dc2626",
    corFundo: "#fee2e2",
    interpretacao: "Pastagem degradada ou cultura em estresse severo",
    recomendacao: "Adubação nitrogenada + calagem prioritária",
  },
  {
    label: "Abaixo do Ideal",
    min: 0.3,
    max: 0.45,
    cor: "#f97316",
    corFundo: "#ffedd5",
    interpretacao: "Vigor moderado — atenção",
    recomendacao: "Adubação de manutenção + monitoramento quinzenal",
  },
  {
    label: "Moderado",
    min: 0.45,
    max: 0.6,
    cor: "#eab308",
    corFundo: "#fef9c3",
    interpretacao: "Pastagem em recuperação",
    recomendacao: "Dose base recomendada — manter manejo",
  },
  {
    label: "Bom",
    min: 0.6,
    max: 0.75,
    cor: "#84cc16",
    corFundo: "#ecfccb",
    interpretacao: "Vegetação saudável e produtiva",
    recomendacao: "Reduzir dose em 20% — pastagem estabelecida",
  },
  {
    label: "Excelente",
    min: 0.75,
    max: 1.0,
    cor: "#16a34a",
    corFundo: "#dcfce7",
    interpretacao: "Máximo vigor fotossintético",
    recomendacao: "Manter — considerar redução de insumos",
  },
];

/** Retorna a faixa NDVI para um valor */
export function getNdviFaixa(ndvi: number): Omit<NdviFaixa, "percentArea"> {
  for (const f of NDVI_FAIXAS) {
    if (ndvi >= f.min && ndvi < f.max) return f;
  }
  return NDVI_FAIXAS[NDVI_FAIXAS.length - 1];
}

/** Converte NDVI (−1..1) para cor RGB hex via paleta agronômica */
export function ndviToColor(ndvi: number, alpha = 1): string {
  const faixa = getNdviFaixa(ndvi);
  if (alpha >= 1) return faixa.cor;

  // Parse hex → rgba
  const r = parseInt(faixa.cor.slice(1, 3), 16);
  const g = parseInt(faixa.cor.slice(3, 5), 16);
  const b = parseInt(faixa.cor.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** PixelvaluesToColorFn para GeoRasterLayer */
export function ndviPixelToColor(values: number[]) {
  const ndvi = values[0];
  if (ndvi === undefined || ndvi < -1 || ndvi > 1) return null;
  if (ndvi < 0.05) return null; // transparente em água/solo nu

  const faixa = getNdviFaixa(ndvi);
  const r = parseInt(faixa.cor.slice(1, 3), 16);
  const g = parseInt(faixa.cor.slice(3, 5), 16);
  const b = parseInt(faixa.cor.slice(5, 7), 16);
  const a = Math.round(180 + ndvi * 40); // transparência aumenta com vigor
  return `rgba(${r},${g},${b},${a / 255})`;
}

// ── Mock de estatísticas NDVI por talhão ─────────────────────────────────────
export const ndviStatsMock: NdviEstatisticas[] = [
  {
    talhaoId: "pp-1",
    talhaoNome: "Pasto Norte",
    areaHa: 25,
    ndviMin: 0.22,
    ndviMax: 0.81,
    ndviMedio: 0.51,
    ndviMediano: 0.53,
    dataCaptura: "2026-04-10",
    fonte: "drone",
    distribuicao: [
      { ...NDVI_FAIXAS[1], percentArea: 8 },
      { ...NDVI_FAIXAS[2], percentArea: 22 },
      { ...NDVI_FAIXAS[3], percentArea: 35 },
      { ...NDVI_FAIXAS[4], percentArea: 28 },
      { ...NDVI_FAIXAS[5], percentArea: 7 },
    ],
  },
  {
    talhaoId: "pp-2",
    talhaoNome: "Pasto Sul",
    areaHa: 30,
    ndviMin: 0.18,
    ndviMax: 0.79,
    ndviMedio: 0.58,
    ndviMediano: 0.61,
    dataCaptura: "2026-04-10",
    fonte: "drone",
    distribuicao: [
      { ...NDVI_FAIXAS[1], percentArea: 12 },
      { ...NDVI_FAIXAS[2], percentArea: 18 },
      { ...NDVI_FAIXAS[3], percentArea: 24 },
      { ...NDVI_FAIXAS[4], percentArea: 30 },
      { ...NDVI_FAIXAS[5], percentArea: 16 },
    ],
  },
  {
    talhaoId: "pp-3",
    talhaoNome: "Pasto Leste",
    areaHa: 18,
    ndviMin: 0.31,
    ndviMax: 0.73,
    ndviMedio: 0.63,
    ndviMediano: 0.65,
    dataCaptura: "2026-04-10",
    fonte: "satelite",
    distribuicao: [
      { ...NDVI_FAIXAS[2], percentArea: 15 },
      { ...NDVI_FAIXAS[3], percentArea: 28 },
      { ...NDVI_FAIXAS[4], percentArea: 40 },
      { ...NDVI_FAIXAS[5], percentArea: 17 },
    ],
  },
  {
    talhaoId: "pp-4",
    talhaoNome: "Pasto Grande",
    areaHa: 45,
    ndviMin: 0.09,
    ndviMax: 0.84,
    ndviMedio: 0.44,
    ndviMediano: 0.46,
    dataCaptura: "2026-04-10",
    fonte: "drone",
    distribuicao: [
      { ...NDVI_FAIXAS[0], percentArea: 5 },
      { ...NDVI_FAIXAS[1], percentArea: 20 },
      { ...NDVI_FAIXAS[2], percentArea: 30 },
      { ...NDVI_FAIXAS[3], percentArea: 28 },
      { ...NDVI_FAIXAS[4], percentArea: 14 },
      { ...NDVI_FAIXAS[5], percentArea: 3 },
    ],
  },
  {
    talhaoId: "pp-5",
    talhaoNome: "Piquete Maternidade",
    areaHa: 5,
    ndviMin: 0.55,
    ndviMax: 0.88,
    ndviMedio: 0.74,
    ndviMediano: 0.75,
    dataCaptura: "2026-04-10",
    fonte: "drone",
    distribuicao: [
      { ...NDVI_FAIXAS[3], percentArea: 12 },
      { ...NDVI_FAIXAS[4], percentArea: 45 },
      { ...NDVI_FAIXAS[5], percentArea: 43 },
    ],
  },
];

/** Gera cor de polígono para visualização por NDVI médio */
export function ndviPolygonColor(ndviMedio: number) {
  return {
    color: ndviToColor(ndviMedio),
    fillColor: ndviToColor(ndviMedio),
    fillOpacity: 0.55,
    weight: 2,
  };
}

/** Classifica saúde do talhão em nível de atenção */
export function classificarSaude(ndviMedio: number): "critico" | "atencao" | "regular" | "bom" | "otimo" {
  if (ndviMedio < 0.3) return "critico";
  if (ndviMedio < 0.45) return "atencao";
  if (ndviMedio < 0.6) return "regular";
  if (ndviMedio < 0.75) return "bom";
  return "otimo";
}

export const SAUDE_META = {
  critico: { label: "Crítico", cor: "text-red-600", bg: "bg-red-500/15 border-red-400/30" },
  atencao: { label: "Atenção", cor: "text-orange-600", bg: "bg-orange-500/15 border-orange-400/30" },
  regular: { label: "Regular", cor: "text-yellow-600", bg: "bg-yellow-500/15 border-yellow-400/30" },
  bom: { label: "Bom", cor: "text-lime-600", bg: "bg-lime-500/15 border-lime-400/30" },
  otimo: { label: "Ótimo", cor: "text-green-600", bg: "bg-green-500/15 border-green-400/30" },
} as const;
