/* ── GTA — Guia de Trânsito Animal — Mock Data ────── */

export type GtaFinalidade = "venda" | "recria" | "engorda" | "reproducao" | "exposicao" | "abate" | "retorno" | "transferencia" | "outro";
export type GtaStatus = "ativo" | "utilizado" | "vencendo" | "vencido" | "cancelado";
export type GtaEspecie = "bovino" | "equino" | "suino" | "caprino" | "ovino" | "aves" | "outro";
export type AreaSanitaria = "livre" | "controlada" | "foco" | "vazio";

export const FINALIDADE_LABELS: Record<GtaFinalidade, string> = {
  venda: "Venda", recria: "Recria", engorda: "Engorda", reproducao: "Reprodução",
  exposicao: "Exposição", abate: "Abate", retorno: "Retorno", transferencia: "Transferência", outro: "Outro",
};

export const ESPECIE_LABELS: Record<GtaEspecie, string> = {
  bovino: "Bovino", equino: "Equino", suino: "Suíno", caprino: "Caprino",
  ovino: "Ovino", aves: "Aves", outro: "Outro",
};

export const ESPECIE_VALIDADE: Record<GtaEspecie, number> = {
  bovino: 30, equino: 30, suino: 10, caprino: 30, ovino: 30, aves: 3, outro: 30,
};

export const STATUS_CONFIG: Record<GtaStatus, { label: string; color: string; icon: string }> = {
  ativo: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: "🟢" },
  utilizado: { label: "Utilizado", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300", icon: "✅" },
  vencendo: { label: "Vencendo", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: "🟠" },
  vencido: { label: "Vencido", color: "bg-destructive/15 text-destructive", icon: "🔴" },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: "⚫" },
};

export const ORGAOS_POR_ESTADO: Record<string, string> = {
  AC: "IDAF", AL: "ADEAL", AM: "ADAF", AP: "DIAGRO", BA: "ADAB",
  CE: "ADAGRI", DF: "SEAGRI", ES: "IDAF", GO: "AGRODEFESA", MA: "AGED",
  MG: "IMA", MS: "IAGRO", MT: "INDEA", PA: "ADEPARA", PB: "SEDAP",
  PE: "ADAGRO", PI: "ADAPI", PR: "ADAPAR", RJ: "EMATER", RN: "IDIARN",
  RO: "IDARON", RR: "ADERR", RS: "SEAPDR", SC: "CIDASC", SE: "EMDAGRO",
  SP: "SAA/CDA", TO: "ADAPEC",
};

export interface Gta {
  id: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  dataValidade: string;
  orgaoEmissor: string;
  ufEmissao: string;

  origemPropriedade: string;
  origemMunicipio: string;
  origemUf: string;
  origemProprietario: string;
  origemIeNirf: string;

  destinoPropriedade: string;
  destinoMunicipio: string;
  destinoUf: string;
  destinoProprietario: string;
  destinoIeNirf: string;

  finalidade: GtaFinalidade;
  especie: GtaEspecie;
  quantidade: number;
  animaisVinculados: string[]; // ear_tags
  sexoFaixa: string;
  identificacao: "eletronico" | "convencional" | "tatuagem" | "sem";

  placaVeiculo: string;
  transportadora: string;
  motorista: string;
  mdfeVinculado: string;

  areaSanitaria: AreaSanitaria;
  examesRealizados: string[];
  resultadoExames: string;
  vacinasEmDia: boolean;

  arquivoGta: string | null;
  arquivoExames: string | null;

  status: GtaStatus;
  vinculoVenda: string | null;
  observacoes: string;
}

export function calcGtaStatus(gta: Gta): GtaStatus {
  if (gta.status === "cancelado" || gta.status === "utilizado") return gta.status;
  const dias = Math.round((new Date(gta.dataValidade).getTime() - Date.now()) / 86400000);
  if (dias < 0) return "vencido";
  if (dias <= 7) return "vencendo";
  return "ativo";
}

export const mockGtas: Gta[] = [
  {
    id: "gta1", numero: "000.123.456", serie: "A", dataEmissao: "2026-02-20", dataValidade: "2026-03-22",
    orgaoEmissor: "IMA", ufEmissao: "MG",
    origemPropriedade: "Fazenda Boa Vista", origemMunicipio: "Uberaba", origemUf: "MG",
    origemProprietario: "João Silva", origemIeNirf: "001.234.567.0001",
    destinoPropriedade: "Frigorífico São José", destinoMunicipio: "Uberlândia", destinoUf: "MG",
    destinoProprietario: "Frigorífico São José LTDA", destinoIeNirf: "002.345.678.0001",
    finalidade: "abate", especie: "bovino", quantidade: 32,
    animaisVinculados: ["BR010", "BR011", "BR012"], sexoFaixa: "Machos 24-36 meses",
    identificacao: "convencional",
    placaVeiculo: "ABC-1234", transportadora: "TransGado Express", motorista: "Carlos Motorista",
    mdfeVinculado: "MDF-e 2026/001",
    areaSanitaria: "livre", examesRealizados: ["Brucelose", "Tuberculose"],
    resultadoExames: "Todos negativos", vacinasEmDia: true,
    arquivoGta: "gta_123456.pdf", arquivoExames: null,
    status: "utilizado", vinculoVenda: "Venda #042", observacoes: "Lote de boi gordo para abate",
  },
  {
    id: "gta2", numero: "000.123.789", serie: "A", dataEmissao: "2026-03-05", dataValidade: "2026-04-04",
    orgaoEmissor: "IMA", ufEmissao: "MG",
    origemPropriedade: "Fazenda São José", origemMunicipio: "Ribeirão Preto", origemUf: "SP",
    origemProprietario: "Maria Pereira", origemIeNirf: "003.456.789.0001",
    destinoPropriedade: "Fazenda Boa Vista", destinoMunicipio: "Uberaba", destinoUf: "MG",
    destinoProprietario: "João Silva", destinoIeNirf: "001.234.567.0001",
    finalidade: "recria", especie: "bovino", quantidade: 15,
    animaisVinculados: [], sexoFaixa: "Fêmeas 12-18 meses", identificacao: "convencional",
    placaVeiculo: "DEF-5678", transportadora: "Boiadeiro Logística", motorista: "Pedro Silva",
    mdfeVinculado: "",
    areaSanitaria: "livre", examesRealizados: ["Brucelose"], resultadoExames: "Negativo",
    vacinasEmDia: true,
    arquivoGta: "gta_123789.pdf", arquivoExames: "exames_lote15.pdf",
    status: "ativo", vinculoVenda: null, observacoes: "Novilhas para reposição",
  },
  {
    id: "gta3", numero: "000.124.001", serie: "B", dataEmissao: "2026-02-28", dataValidade: "2026-03-10",
    orgaoEmissor: "IMA", ufEmissao: "MG",
    origemPropriedade: "Fazenda Boa Vista", origemMunicipio: "Uberaba", origemUf: "MG",
    origemProprietario: "João Silva", origemIeNirf: "001.234.567.0001",
    destinoPropriedade: "Fazenda São José", destinoMunicipio: "Ribeirão Preto", destinoUf: "SP",
    destinoProprietario: "João Silva", destinoIeNirf: "004.567.890.0001",
    finalidade: "transferencia", especie: "bovino", quantidade: 8,
    animaisVinculados: ["BR001", "BR002", "BR003"], sexoFaixa: "Machos 18-24 meses",
    identificacao: "eletronico",
    placaVeiculo: "GHI-9012", transportadora: "TransGado Express", motorista: "Carlos Motorista",
    mdfeVinculado: "",
    areaSanitaria: "livre", examesRealizados: [], resultadoExames: "", vacinasEmDia: true,
    arquivoGta: null, arquivoExames: null,
    status: "vencido", vinculoVenda: null, observacoes: "Transferência entre fazendas próprias",
  },
  {
    id: "gta4", numero: "000.124.555", serie: "A", dataEmissao: "2026-03-06", dataValidade: "2026-03-12",
    orgaoEmissor: "IMA", ufEmissao: "MG",
    origemPropriedade: "Fazenda Boa Vista", origemMunicipio: "Uberaba", origemUf: "MG",
    origemProprietario: "João Silva", origemIeNirf: "001.234.567.0001",
    destinoPropriedade: "Exposição Agro Uberaba", destinoMunicipio: "Uberaba", destinoUf: "MG",
    destinoProprietario: "Assoc. Pecuária", destinoIeNirf: "",
    finalidade: "exposicao", especie: "bovino", quantidade: 5,
    animaisVinculados: ["BR005", "BR006"], sexoFaixa: "Machos e fêmeas adultos",
    identificacao: "eletronico",
    placaVeiculo: "JKL-3456", transportadora: "", motorista: "João Silva",
    mdfeVinculado: "",
    areaSanitaria: "livre", examesRealizados: ["Brucelose", "Tuberculose", "Febre Aftosa"],
    resultadoExames: "Todos negativos — laudos anexos", vacinasEmDia: true,
    arquivoGta: "gta_124555.pdf", arquivoExames: "laudos_expo.pdf",
    status: "ativo", vinculoVenda: null, observacoes: "Exposição com retorno previsto",
  },
];
