import { Financiamento, mockFinanciamentos } from "./financiamentos-mock";
import { mockCreditoRuralFinanciamentos } from "./credito-rural-mock";

// ── Patrimônio ──
export type BemTipo = "imovel_rural" | "imovel_urbano" | "veiculo" | "maquina" | "semovente" | "investimento" | "outro";
export type BemSituacao = "quitado" | "financiado" | "arrendado" | "em_compra";

export interface BemPatrimonial {
  id: string;
  nome: string;
  tipo: BemTipo;
  valorAquisicao: number;
  dataAquisicao: string;
  valorMercado: number;
  dataAvaliacao: string;
  situacao: BemSituacao;
  financiamentoId?: string;
  segurado: boolean;
  seguradora?: string;
  apolice?: string;
  valorSegurado?: number;
  seguroVencimento?: string;
  localizacao?: string;
  area?: number;
  areaUnidade?: "ha" | "m2";
  matricula?: string;
  placa?: string;
  notas?: string;
}

export const bemTipoLabels: Record<BemTipo, string> = {
  imovel_rural: "Imóvel Rural", imovel_urbano: "Imóvel Urbano", veiculo: "Veículo",
  maquina: "Máquina/Equipamento", semovente: "Semovente", investimento: "Investimento", outro: "Outro",
};

export const bemTipoColors: Record<BemTipo, string> = {
  imovel_rural: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  imovel_urbano: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  veiculo: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  maquina: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  semovente: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  investimento: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  outro: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export const situacaoLabels: Record<BemSituacao, string> = {
  quitado: "Quitado", financiado: "Financiado", arrendado: "Arrendado", em_compra: "Em processo de compra",
};

export const mockBens: BemPatrimonial[] = [
  { id: "bem-1", nome: "Fazenda Boa Vista — 450 ha", tipo: "imovel_rural", valorAquisicao: 2700000, dataAquisicao: "2018-03-15", valorMercado: 4500000, dataAvaliacao: "2025-11-01", situacao: "quitado", segurado: true, seguradora: "Porto Seguro", apolice: "PS-2025-001", valorSegurado: 3000000, seguroVencimento: "2026-03-15", localizacao: "Goianésia, GO", area: 450, areaUnidade: "ha", matricula: "MAT-12345-GO" },
  { id: "bem-2", nome: "Trator John Deere 5075E", tipo: "maquina", valorAquisicao: 216000, dataAquisicao: "2024-12-20", valorMercado: 195000, dataAvaliacao: "2026-01-15", situacao: "financiado", financiamentoId: "fin-1", segurado: true, seguradora: "Porto Seguro", apolice: "PS-2025-002", valorSegurado: 200000, seguroVencimento: "2026-01-15" },
  { id: "bem-3", nome: "Apartamento Centro — Goiânia", tipo: "imovel_urbano", valorAquisicao: 420000, dataAquisicao: "2024-05-15", valorMercado: 450000, dataAvaliacao: "2025-12-01", situacao: "financiado", financiamentoId: "fin-2", segurado: true, seguradora: "Caixa Seguradora", apolice: "CS-2024-789", valorSegurado: 420000, seguroVencimento: "2025-06-10", localizacao: "Goiânia, GO", area: 120, areaUnidade: "m2" },
  { id: "bem-4", nome: "Hilux SW4 2025", tipo: "veiculo", valorAquisicao: 125000, dataAquisicao: "2025-05-10", valorMercado: 118000, dataAvaliacao: "2026-01-01", situacao: "financiado", financiamentoId: "fin-3", segurado: true, seguradora: "BB Seguros", apolice: "BB-2025-456", valorSegurado: 120000, seguroVencimento: "2026-06-01", placa: "ABC-1D23" },
  { id: "bem-5", nome: "Rebanho Nelore — 200 cabeças", tipo: "semovente", valorAquisicao: 600000, dataAquisicao: "2023-06-01", valorMercado: 720000, dataAvaliacao: "2026-02-01", situacao: "quitado", segurado: false },
  { id: "bem-6", nome: "Pivô Central — 80 ha", tipo: "maquina", valorAquisicao: 200000, dataAquisicao: "2025-04-01", valorMercado: 195000, dataAvaliacao: "2026-01-01", situacao: "financiado", financiamentoId: "fin-cr-2", segurado: false },
  { id: "bem-7", nome: "CDB Pré-fixado Banco do Brasil", tipo: "investimento", valorAquisicao: 50000, dataAquisicao: "2025-01-15", valorMercado: 53200, dataAvaliacao: "2026-03-01", situacao: "quitado", segurado: false },
];

// ── Consórcio ──
export type ConsorcioStatus = "aguardando" | "contemplado" | "bem_adquirido" | "encerrado";
export type ContemplacaoForma = "sorteio" | "lance_livre" | "lance_fixo" | "lance_embutido";

export interface Consorcio {
  id: string;
  administradora: string;
  grupo: string;
  cota: string;
  bemPretendido: "imovel" | "veiculo" | "maquina" | "servico";
  valorCredito: number;
  prazoMeses: number;
  taxaAdministracao: number;
  taxaTipo: "total" | "mensal";
  fundoReserva: number;
  parcelaAtual: number;
  status: ConsorcioStatus;
  contemplado: boolean;
  contemplacao?: {
    forma: ContemplacaoForma;
    data: string;
    valorLance?: number;
    dataAquisicao?: string;
    bemPatrimonialId?: string;
  };
  parcelasPagas: number;
  notas?: string;
}

export const consorcioStatusLabels: Record<ConsorcioStatus, string> = {
  aguardando: "Aguardando", contemplado: "Contemplado", bem_adquirido: "Bem Adquirido", encerrado: "Encerrado",
};
export const consorcioStatusColors: Record<ConsorcioStatus, string> = {
  aguardando: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  contemplado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  bem_adquirido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  encerrado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export const mockConsorcios: Consorcio[] = [
  { id: "cons-1", administradora: "Porto Seguro Consórcios", grupo: "G-2045", cota: "C-0123", bemPretendido: "veiculo", valorCredito: 85000, prazoMeses: 72, taxaAdministracao: 15, taxaTipo: "total", fundoReserva: 2, parcelaAtual: 1420, status: "aguardando", contemplado: false, parcelasPagas: 18, notas: "Consórcio para caminhonete 4x4" },
  { id: "cons-2", administradora: "Bradesco Consórcios", grupo: "G-3100", cota: "C-0456", bemPretendido: "maquina", valorCredito: 250000, prazoMeses: 120, taxaAdministracao: 18, taxaTipo: "total", fundoReserva: 3, parcelaAtual: 2750, status: "contemplado", contemplado: true, contemplacao: { forma: "lance_livre", data: "2026-01-20", valorLance: 62500 }, parcelasPagas: 24 },
  { id: "cons-3", administradora: "Embracon", grupo: "G-5200", cota: "C-0789", bemPretendido: "imovel", valorCredito: 400000, prazoMeses: 180, taxaAdministracao: 20, taxaTipo: "total", fundoReserva: 2.5, parcelaAtual: 2890, status: "aguardando", contemplado: false, parcelasPagas: 36 },
];

// ── Leasing ──
export type LeasingTipo = "financeiro" | "operacional" | "leaseback";

export interface LeasingContract {
  id: string;
  arrendador: string;
  bemDescricao: string;
  bemAssetId?: string;
  valorBem: number;
  valorResidual: number;
  tipoLeasing: LeasingTipo;
  prazoMeses: number;
  dataInicio: string;
  dataTermino: string;
  contraprestacaoMensal: number;
  opcaoCompra: boolean;
  valorCompraFinal?: number;
  parcelasPagas: number;
  status: "ativo" | "encerrado" | "pendente_devolucao";
  manutencoes?: { data: string; descricao: string; custo: number }[];
  notas?: string;
}

export const leasingTipoLabels: Record<LeasingTipo, string> = {
  financeiro: "Financeiro", operacional: "Operacional", leaseback: "Lease-back",
};

export const leasingContabil: Record<LeasingTipo, { titulo: string; descricao: string }> = {
  financeiro: {
    titulo: "Leasing Financeiro — Ativo Imobilizado",
    descricao: "O bem entra no ativo imobilizado do arrendatário. As parcelas são desdobradas em amortização do principal + juros. Deprecia-se o bem normalmente. No LCPRD, registrar como despesa de juros (parcela de juros) e no balanço como ativo.",
  },
  operacional: {
    titulo: "Leasing Operacional — Despesa Operacional",
    descricao: "As parcelas são registradas integralmente como despesa operacional (aluguel). O bem NÃO entra no ativo do arrendatário. No DRE e LCPRD, registrar como despesa de aluguel de máquinas/equipamentos.",
  },
  leaseback: {
    titulo: "Lease-back — Venda com Arrendamento",
    descricao: "A empresa vende o bem e imediatamente o arrenda de volta. Gera receita na venda e despesa no arrendamento. Tratamento contábil depende se é classificado como financeiro ou operacional após a operação.",
  },
};

export const mockLeasings: LeasingContract[] = [
  { id: "leas-1", arrendador: "BV Leasing", bemDescricao: "Colheitadeira New Holland CR 7.90", valorBem: 680000, valorResidual: 68000, tipoLeasing: "financeiro", prazoMeses: 60, dataInicio: "2024-07-01", dataTermino: "2029-07-01", contraprestacaoMensal: 12800, opcaoCompra: true, valorCompraFinal: 68000, parcelasPagas: 20, status: "ativo", manutencoes: [{ data: "2025-07-15", descricao: "Revisão 1.000 horas", custo: 3500 }, { data: "2026-01-20", descricao: "Troca de correias", custo: 1200 }] },
  { id: "leas-2", arrendador: "Safra Leasing", bemDescricao: "Frota de 3 caminhões (locação operacional)", valorBem: 900000, valorResidual: 0, tipoLeasing: "operacional", prazoMeses: 36, dataInicio: "2025-01-01", dataTermino: "2028-01-01", contraprestacaoMensal: 28500, opcaoCompra: false, parcelasPagas: 14, status: "ativo", manutencoes: [{ data: "2025-06-01", descricao: "Revisão obrigatória — caminhão 1", custo: 2800 }, { data: "2025-06-15", descricao: "Revisão obrigatória — caminhão 2", custo: 2650 }] },
];

// ── Helpers ──
export function getAllFinanciamentos(): Financiamento[] {
  return [...mockFinanciamentos, ...mockCreditoRuralFinanciamentos];
}
