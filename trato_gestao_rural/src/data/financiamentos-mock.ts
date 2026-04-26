
export type FinanciamentoTipo =
  | "credito_rural" | "maquina_equipamento" | "imovel_rural" | "veiculo_comercial"
  | "capital_giro" | "leasing" | "consorcio_empresarial"
  | "imovel_residencial" | "veiculo" | "emprestimo_pessoal" | "consignado" | "consorcio" | "outro";

export type SistemaAmortizacao = "sac" | "price" | "americano" | "personalizado";
export type IndiceCorrecao = "sem" | "tjlp" | "tlp" | "selic" | "ipca" | "incc" | "tr" | "pre_fixado";
export type FinanciamentoStatus = "ativo" | "quitado" | "carencia" | "inadimplente";
export type TipoGarantia = "alienacao" | "hipoteca" | "penhor_rural" | "aval" | "sem_garantia";
export type ProgramaGov = "pronaf" | "pronamp" | "fco" | "abc" | "moderfrota" | "bndes" | "outro" | "";

export interface Parcela {
  numero: number;
  vencimento: string;
  saldoDevedor: number;
  amortizacao: number;
  juros: number;
  correcao: number;
  seguro: number;
  total: number;
  acumulado: number;
  status: "pago" | "pendente" | "vencido" | "futuro";
}

export interface Financiamento {
  id: string;
  nome: string;
  tipo: FinanciamentoTipo;
  perfil: "pessoal" | "empresarial";
  instituicao: string;
  numeroContrato: string;
  instrumentId: string;
  valorFinanciado: number;
  valorEntrada: number;
  dataContratacao: string;
  dataPrimeiraParcela: string;
  prazoMeses: number;
  taxaJuros: number;
  taxaTipo: "mensal" | "anual";
  indiceCorrecao: IndiceCorrecao;
  sistemaAmortizacao: SistemaAmortizacao;
  possuiCarencia: boolean;
  carenciaInicio?: string;
  carenciaFim?: string;
  carenciaTipo?: "nada" | "juros" | "juros_correcao";
  possuiRebate: boolean;
  rebatePercentual?: number;
  rebateCondicao?: string;
  possuiSeguro: boolean;
  seguroValorParcela?: number;
  seguradora?: string;
  seguroVencimento?: string;
  tipoGarantia: TipoGarantia;
  garantiaDescricao?: string;
  notas?: string;
  protocolo?: string;
  programaGov?: ProgramaGov;
  status: FinanciamentoStatus;
  saldoDevedor: number;
  totalPago: number;
  parcelas: Parcela[];
}

export const tipoLabels: Record<FinanciamentoTipo, string> = {
  credito_rural: "Crédito Rural",
  maquina_equipamento: "Máquina/Equipamento",
  imovel_rural: "Imóvel Rural",
  veiculo_comercial: "Veículo Comercial",
  capital_giro: "Capital de Giro",
  leasing: "Leasing",
  consorcio_empresarial: "Consórcio Empresarial",
  imovel_residencial: "Imóvel Residencial",
  veiculo: "Veículo",
  emprestimo_pessoal: "Empréstimo Pessoal",
  consignado: "Consignado",
  consorcio: "Consórcio",
  outro: "Outro",
};

export const tipoColors: Record<FinanciamentoTipo, string> = {
  credito_rural: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  maquina_equipamento: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  imovel_rural: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  veiculo_comercial: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  capital_giro: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  leasing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  consorcio_empresarial: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  imovel_residencial: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  veiculo: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  emprestimo_pessoal: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  consignado: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  consorcio: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  outro: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export const statusLabels: Record<FinanciamentoStatus, string> = {
  ativo: "Ativo",
  quitado: "Quitado",
  carencia: "Em Carência",
  inadimplente: "Inadimplente",
};

export const statusColors: Record<FinanciamentoStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  quitado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  carencia: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  inadimplente: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const bancos = [
  "Banco do Brasil", "Bradesco", "Caixa Econômica Federal", "Sicoob", "Sicredi",
  "BNB (Banco do Nordeste)", "BNDES", "Itaú", "Santander", "Banco Safra",
  "Banco Votorantim", "Banrisul", "Outro",
];

export const tiposEmpresarial: FinanciamentoTipo[] = [
  "credito_rural", "maquina_equipamento", "imovel_rural", "veiculo_comercial",
  "capital_giro", "leasing", "consorcio_empresarial",
];

export const tiposPessoal: FinanciamentoTipo[] = [
  "imovel_residencial", "veiculo", "emprestimo_pessoal", "consignado", "consorcio", "outro",
];

// ── Amortization calculation ──

export function calcTaxaMensal(taxa: number, tipo: "mensal" | "anual"): number {
  if (tipo === "mensal") return taxa / 100;
  return Math.pow(1 + taxa / 100, 1 / 12) - 1;
}

export function gerarTabelaSAC(
  valor: number, taxaMensal: number, prazo: number, dataInicio: string,
  seguroParcela = 0, carenciaMeses = 0
): Parcela[] {
  const parcelas: Parcela[] = [];
  const amortizacaoFixa = valor / prazo;
  let saldo = valor;
  let acumulado = 0;
  const inicio = new Date(dataInicio);

  for (let i = 1; i <= prazo; i++) {
    const venc = new Date(inicio);
    venc.setMonth(venc.getMonth() + i - 1);
    const juros = saldo * taxaMensal;
    const amort = i <= carenciaMeses ? 0 : amortizacaoFixa;
    const total = amort + juros + seguroParcela;
    acumulado += total;
    saldo = Math.max(0, saldo - amort);

    const hoje = new Date();
    let status: Parcela["status"] = "futuro";
    if (i <= 3) status = "pago";
    else if (venc < hoje) status = "vencido";
    else if (venc.getMonth() === hoje.getMonth() && venc.getFullYear() === hoje.getFullYear()) status = "pendente";

    parcelas.push({
      numero: i,
      vencimento: venc.toISOString().split("T")[0],
      saldoDevedor: Math.round(saldo * 100) / 100,
      amortizacao: Math.round(amort * 100) / 100,
      juros: Math.round(juros * 100) / 100,
      correcao: 0,
      seguro: seguroParcela,
      total: Math.round(total * 100) / 100,
      acumulado: Math.round(acumulado * 100) / 100,
      status,
    });
  }
  return parcelas;
}

export function gerarTabelaPRICE(
  valor: number, taxaMensal: number, prazo: number, dataInicio: string,
  seguroParcela = 0, carenciaMeses = 0
): Parcela[] {
  const parcelas: Parcela[] = [];
  const pmt = valor * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1);
  let saldo = valor;
  let acumulado = 0;
  const inicio = new Date(dataInicio);

  for (let i = 1; i <= prazo; i++) {
    const venc = new Date(inicio);
    venc.setMonth(venc.getMonth() + i - 1);
    const juros = saldo * taxaMensal;
    const amort = i <= carenciaMeses ? 0 : pmt - juros;
    const total = (i <= carenciaMeses ? juros : pmt) + seguroParcela;
    acumulado += total;
    saldo = Math.max(0, saldo - amort);

    const hoje = new Date();
    let status: Parcela["status"] = "futuro";
    if (i <= 3) status = "pago";
    else if (venc < hoje) status = "vencido";
    else if (venc.getMonth() === hoje.getMonth() && venc.getFullYear() === hoje.getFullYear()) status = "pendente";

    parcelas.push({
      numero: i,
      vencimento: venc.toISOString().split("T")[0],
      saldoDevedor: Math.round(saldo * 100) / 100,
      amortizacao: Math.round(amort * 100) / 100,
      juros: Math.round(juros * 100) / 100,
      correcao: 0,
      seguro: seguroParcela,
      total: Math.round(total * 100) / 100,
      acumulado: Math.round(acumulado * 100) / 100,
      status,
    });
  }
  return parcelas;
}

export function gerarTabela(
  valor: number, taxa: number, taxaTipo: "mensal" | "anual",
  prazo: number, sistema: SistemaAmortizacao, dataInicio: string,
  seguro = 0, carencia = 0
): Parcela[] {
  const tm = calcTaxaMensal(taxa, taxaTipo);
  if (sistema === "sac") return gerarTabelaSAC(valor, tm, prazo, dataInicio, seguro, carencia);
  return gerarTabelaPRICE(valor, tm, prazo, dataInicio, seguro, carencia);
}

// ── Mock data ──

const parcelasTrator = gerarTabelaSAC(180000, 0.0075, 48, "2025-01-15", 45);
const parcelasImovel = gerarTabelaPRICE(350000, 0.006, 360, "2024-06-10", 85);
const parcelasVeiculo = gerarTabelaPRICE(95000, 0.012, 60, "2025-06-01", 30);
const parcelasPronaf = gerarTabelaSAC(120000, 0.004, 60, "2025-03-01", 0, 12);

export const mockFinanciamentos: Financiamento[] = [
  {
    id: "fin-1", nome: "Trator John Deere 5075E", tipo: "maquina_equipamento",
    perfil: "empresarial", instituicao: "BNDES", numeroContrato: "2025.001.234",
    instrumentId: "pi-1", valorFinanciado: 180000, valorEntrada: 36000,
    dataContratacao: "2024-12-20", dataPrimeiraParcela: "2025-01-15", prazoMeses: 48,
    taxaJuros: 0.75, taxaTipo: "mensal", indiceCorrecao: "tlp",
    sistemaAmortizacao: "sac", possuiCarencia: false, possuiRebate: false,
    possuiSeguro: true, seguroValorParcela: 45, seguradora: "Porto Seguro",
    seguroVencimento: "2026-01-15", tipoGarantia: "alienacao",
    garantiaDescricao: "Alienação fiduciária do trator", programaGov: "moderfrota",
    status: "ativo", saldoDevedor: 168750,
    totalPago: parcelasTrator.filter(p => p.status === "pago").reduce((s, p) => s + p.total, 0),
    parcelas: parcelasTrator,
  },
  {
    id: "fin-2", nome: "Apartamento Centro — Goiânia", tipo: "imovel_residencial",
    perfil: "pessoal", instituicao: "Caixa Econômica Federal", numeroContrato: "8901.23456.789",
    instrumentId: "pi-2", valorFinanciado: 350000, valorEntrada: 70000,
    dataContratacao: "2024-05-15", dataPrimeiraParcela: "2024-06-10", prazoMeses: 360,
    taxaJuros: 7.5, taxaTipo: "anual", indiceCorrecao: "tr",
    sistemaAmortizacao: "price", possuiCarencia: false, possuiRebate: false,
    possuiSeguro: true, seguroValorParcela: 85, seguradora: "Caixa Seguradora",
    seguroVencimento: "2025-06-10", tipoGarantia: "alienacao",
    garantiaDescricao: "Alienação fiduciária do imóvel", status: "ativo",
    saldoDevedor: 344200,
    totalPago: parcelasImovel.filter(p => p.status === "pago").reduce((s, p) => s + p.total, 0),
    parcelas: parcelasImovel,
  },
  {
    id: "fin-3", nome: "Hilux SW4 2025", tipo: "veiculo",
    perfil: "pessoal", instituicao: "Banco do Brasil", numeroContrato: "BB-VEI-2025-4567",
    instrumentId: "pi-1", valorFinanciado: 95000, valorEntrada: 30000,
    dataContratacao: "2025-05-10", dataPrimeiraParcela: "2025-06-01", prazoMeses: 60,
    taxaJuros: 1.2, taxaTipo: "mensal", indiceCorrecao: "pre_fixado",
    sistemaAmortizacao: "price", possuiCarencia: false, possuiRebate: false,
    possuiSeguro: true, seguroValorParcela: 30, seguradora: "BB Seguros",
    seguroVencimento: "2026-06-01", tipoGarantia: "alienacao",
    garantiaDescricao: "Alienação fiduciária do veículo", status: "ativo",
    saldoDevedor: 95000, totalPago: 0, parcelas: parcelasVeiculo,
  },
  {
    id: "fin-4", nome: "Pronaf Custeio 2025 — Pastagem", tipo: "credito_rural",
    perfil: "empresarial", instituicao: "Sicoob", numeroContrato: "SCB-2025-00789",
    instrumentId: "pi-1", valorFinanciado: 120000, valorEntrada: 0,
    dataContratacao: "2025-02-01", dataPrimeiraParcela: "2025-03-01", prazoMeses: 60,
    taxaJuros: 5, taxaTipo: "anual", indiceCorrecao: "sem",
    sistemaAmortizacao: "sac", possuiCarencia: true,
    carenciaInicio: "2025-03-01", carenciaFim: "2026-03-01", carenciaTipo: "juros",
    possuiRebate: true, rebatePercentual: 5,
    rebateCondicao: "Desconto de 5% se todas as parcelas pagas em dia",
    possuiSeguro: false, tipoGarantia: "penhor_rural",
    garantiaDescricao: "Penhor sobre 200 cabeças de gado", programaGov: "pronaf",
    protocolo: "PRONAF-2025-GO-00789",
    status: "carencia", saldoDevedor: 120000,
    totalPago: parcelasPronaf.filter(p => p.status === "pago").reduce((s, p) => s + p.total, 0),
    parcelas: parcelasPronaf,
  },
];
