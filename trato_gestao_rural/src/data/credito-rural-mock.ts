import { Financiamento } from "./financiamentos-mock";

export type ProgramaRural =
  | "pronaf" | "pronamp" | "fco_rural" | "moderfrota" | "abc_ambiental"
  | "inovagro" | "renovagro" | "bndes" | "fno" | "fne" | "linha_livre" | "outro";

export type FinalidadeRural =
  | "custeio_agricola" | "custeio_pecuario" | "investimento"
  | "comercializacao" | "industrializacao" | "custeio_investimento";

export type RebateStatus = "disponivel" | "perdido" | "aplicado";

export interface CreditoRuralExtra {
  financiamentoId: string;
  programa: ProgramaRural;
  finalidade: FinalidadeRural;
  culturaAtividade: string;
  areaFinanciada?: number; // hectares
  dataLiberacao: string;
  dataInicioCarencia: string;
  dataFimCarencia: string;
  dataVencimentoFinal: string;
  rebatePercentual: number;
  rebateCondicao: string;
  rebateValor: number;
  rebateStatus: RebateStatus;
  taxaContratual: number; // % a.a.
  possuiEqualizacao: boolean;
  taxaCheia?: number;
  equalizacao?: number;
  taxaEfetiva?: number;
}

export const programaLabels: Record<ProgramaRural, string> = {
  pronaf: "Pronaf", pronamp: "Pronamp", fco_rural: "FCO Rural",
  moderfrota: "Moderfrota", abc_ambiental: "ABC Ambiental",
  inovagro: "Inovagro", renovagro: "RenovAgro", bndes: "BNDES",
  fno: "FNO", fne: "FNE", linha_livre: "Linha Livre", outro: "Outro",
};

export const programaColors: Record<ProgramaRural, string> = {
  pronaf: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  pronamp: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  fco_rural: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  moderfrota: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  abc_ambiental: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  inovagro: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  renovagro: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  bndes: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  fno: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  fne: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  linha_livre: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  outro: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export const finalidadeLabels: Record<FinalidadeRural, string> = {
  custeio_agricola: "Custeio Agrícola",
  custeio_pecuario: "Custeio Pecuário",
  investimento: "Investimento",
  comercializacao: "Comercialização",
  industrializacao: "Industrialização",
  custeio_investimento: "Custeio + Investimento",
};

export const mockCreditoRuralExtras: CreditoRuralExtra[] = [
  {
    financiamentoId: "fin-4",
    programa: "pronaf",
    finalidade: "custeio_pecuario",
    culturaAtividade: "Pastagem e suplementação — rebanho Nelore 200 cab.",
    areaFinanciada: 150,
    dataLiberacao: "2025-02-15",
    dataInicioCarencia: "2025-03-01",
    dataFimCarencia: "2026-03-01",
    dataVencimentoFinal: "2030-03-01",
    rebatePercentual: 5,
    rebateCondicao: "Pagamento até o vencimento",
    rebateValor: 6000,
    rebateStatus: "disponivel",
    taxaContratual: 5,
    possuiEqualizacao: true,
    taxaCheia: 9,
    equalizacao: 4,
    taxaEfetiva: 5,
  },
  {
    financiamentoId: "fin-cr-2",
    programa: "fco_rural",
    finalidade: "investimento",
    culturaAtividade: "Implantação de sistema de irrigação — pivô central",
    areaFinanciada: 80,
    dataLiberacao: "2025-04-01",
    dataInicioCarencia: "2025-04-01",
    dataFimCarencia: "2028-04-01",
    dataVencimentoFinal: "2033-04-01",
    rebatePercentual: 7,
    rebateCondicao: "Pagamento até 5 dias antes do vencimento",
    rebateValor: 14000,
    rebateStatus: "disponivel",
    taxaContratual: 7,
    possuiEqualizacao: true,
    taxaCheia: 10.5,
    equalizacao: 3.5,
    taxaEfetiva: 7,
  },
  {
    financiamentoId: "fin-cr-3",
    programa: "moderfrota",
    finalidade: "investimento",
    culturaAtividade: "Aquisição de colheitadeira Case IH 8250",
    dataLiberacao: "2025-01-10",
    dataInicioCarencia: "2025-01-10",
    dataFimCarencia: "2025-07-10",
    dataVencimentoFinal: "2032-01-10",
    rebatePercentual: 0,
    rebateCondicao: "",
    rebateValor: 0,
    rebateStatus: "disponivel",
    taxaContratual: 8.5,
    possuiEqualizacao: false,
  },
  {
    financiamentoId: "fin-cr-4",
    programa: "pronaf",
    finalidade: "custeio_agricola",
    culturaAtividade: "Soja safra 25/26 — 200 ha",
    areaFinanciada: 200,
    dataLiberacao: "2025-08-01",
    dataInicioCarencia: "2025-08-01",
    dataFimCarencia: "2026-04-01",
    dataVencimentoFinal: "2026-04-01",
    rebatePercentual: 10,
    rebateCondicao: "Pagamento até o vencimento",
    rebateValor: 15000,
    rebateStatus: "disponivel",
    taxaContratual: 4,
    possuiEqualizacao: true,
    taxaCheia: 8,
    equalizacao: 4,
    taxaEfetiva: 4,
  },
];

// Extra mock financiamentos for credit rural
import { gerarTabelaSAC } from "./financiamentos-mock";

const parcelasFCO = gerarTabelaSAC(200000, 0.0056, 96, "2025-04-01", 0, 36);
const parcelasModerfrota = gerarTabelaSAC(450000, 0.0068, 84, "2025-01-10", 60, 6);
const parcelasSoja = gerarTabelaSAC(150000, 0.0033, 8, "2025-08-01", 0, 0);

export const mockCreditoRuralFinanciamentos: Financiamento[] = [
  {
    id: "fin-cr-2", nome: "FCO Investimento — Pivô Central", tipo: "credito_rural",
    perfil: "empresarial", instituicao: "Banco do Brasil", numeroContrato: "BB-FCO-2025-1234",
    instrumentId: "pi-1", valorFinanciado: 200000, valorEntrada: 0,
    dataContratacao: "2025-03-20", dataPrimeiraParcela: "2025-04-01", prazoMeses: 96,
    taxaJuros: 7, taxaTipo: "anual", indiceCorrecao: "sem",
    sistemaAmortizacao: "sac", possuiCarencia: true,
    carenciaInicio: "2025-04-01", carenciaFim: "2028-04-01", carenciaTipo: "juros",
    possuiRebate: true, rebatePercentual: 7,
    rebateCondicao: "Pagamento até 5 dias antes do vencimento",
    possuiSeguro: false, tipoGarantia: "hipoteca",
    garantiaDescricao: "Hipoteca da propriedade rural", programaGov: "fco",
    protocolo: "FCO-2025-GO-01234",
    status: "carencia", saldoDevedor: 200000,
    totalPago: parcelasFCO.filter(p => p.status === "pago").reduce((s, p) => s + p.total, 0),
    parcelas: parcelasFCO,
  },
  {
    id: "fin-cr-3", nome: "Moderfrota — Colheitadeira Case IH", tipo: "credito_rural",
    perfil: "empresarial", instituicao: "BNDES", numeroContrato: "BNDES-MF-2025-5678",
    instrumentId: "pi-1", valorFinanciado: 450000, valorEntrada: 90000,
    dataContratacao: "2024-12-15", dataPrimeiraParcela: "2025-01-10", prazoMeses: 84,
    taxaJuros: 8.5, taxaTipo: "anual", indiceCorrecao: "tlp",
    sistemaAmortizacao: "sac", possuiCarencia: true,
    carenciaInicio: "2025-01-10", carenciaFim: "2025-07-10", carenciaTipo: "juros",
    possuiRebate: false, possuiSeguro: true, seguroValorParcela: 60,
    seguradora: "Zurich", seguroVencimento: "2026-01-10",
    tipoGarantia: "alienacao", garantiaDescricao: "Alienação fiduciária da colheitadeira",
    programaGov: "moderfrota", protocolo: "MODERFROTA-2025-5678",
    status: "ativo", saldoDevedor: 432000,
    totalPago: parcelasModerfrota.filter(p => p.status === "pago").reduce((s, p) => s + p.total, 0),
    parcelas: parcelasModerfrota,
  },
  {
    id: "fin-cr-4", nome: "Pronaf Custeio — Soja Safra 25/26", tipo: "credito_rural",
    perfil: "empresarial", instituicao: "Sicredi", numeroContrato: "SIC-PRO-2025-9012",
    instrumentId: "pi-1", valorFinanciado: 150000, valorEntrada: 0,
    dataContratacao: "2025-07-20", dataPrimeiraParcela: "2025-08-01", prazoMeses: 8,
    taxaJuros: 4, taxaTipo: "anual", indiceCorrecao: "sem",
    sistemaAmortizacao: "sac", possuiCarencia: false,
    possuiRebate: true, rebatePercentual: 10,
    rebateCondicao: "Pagamento até o vencimento",
    possuiSeguro: false, tipoGarantia: "penhor_rural",
    garantiaDescricao: "Penhor da safra", programaGov: "pronaf",
    protocolo: "PRONAF-2025-GO-09012",
    status: "ativo", saldoDevedor: 112500,
    totalPago: parcelasSoja.filter(p => p.status === "pago").reduce((s, p) => s + p.total, 0),
    parcelas: parcelasSoja,
  },
];
