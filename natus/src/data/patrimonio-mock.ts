export type ConsorcioStatus = "ativo" | "aguardando" | "contemplado" | "bem_adquirido" | "encerrado" | "cancelado";

export interface ConsorcioContemplacao {
  forma: "sorteio" | "lance_livre" | "lance_fixo";
  data: string;
  valorLance?: number;
}

export interface Consorcio {
  id: string;
  nome: string;
  administradora: string;
  tipoBem: "imovel" | "veiculo" | "maquina" | "servico";
  bemPretendido: "imovel" | "veiculo" | "maquina" | "servico";
  grupo: string;
  cota: string;
  valorCredito: number;
  valorParcela: number;
  parcelaAtual: number;
  prazoMeses: number;
  totalParcelas: number;
  parcelasPagas: number;
  taxaAdministracao: number;
  taxaTipo: "mensal" | "total";
  dataInicio: string;
  status: ConsorcioStatus;
  contemplado: boolean;
  contemplacao?: ConsorcioContemplacao;
  lance?: number;
  observacoes?: string;
}

export const consorcioStatusLabels: Record<ConsorcioStatus, string> = {
  ativo: "Ativo",
  aguardando: "Aguardando",
  contemplado: "Contemplado",
  bem_adquirido: "Bem Adquirido",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export const consorcioStatusColors: Record<ConsorcioStatus, string> = {
  ativo: "bg-blue-100 text-blue-700",
  aguardando: "bg-yellow-100 text-yellow-700",
  contemplado: "bg-green-100 text-green-700",
  bem_adquirido: "bg-emerald-100 text-emerald-700",
  encerrado: "bg-gray-100 text-gray-600",
  cancelado: "bg-red-100 text-red-700",
};

export const mockConsorcios: Consorcio[] = [
  {
    id: "1",
    nome: "Consórcio Imóvel Casa Própria",
    administradora: "Embracon",
    tipoBem: "imovel",
    bemPretendido: "imovel",
    grupo: "0245",
    cota: "032",
    valorCredito: 250000,
    valorParcela: 1850,
    parcelaAtual: 1850,
    prazoMeses: 200,
    totalParcelas: 200,
    parcelasPagas: 48,
    taxaAdministracao: 0.17,
    taxaTipo: "mensal",
    dataInicio: "2021-03-01",
    status: "ativo",
    contemplado: false,
    observacoes: "Grupo 0245 — sorteio toda última sexta do mês",
  },
  {
    id: "2",
    nome: "Consórcio Veículo SUV",
    administradora: "Porto Seguro",
    tipoBem: "veiculo",
    bemPretendido: "veiculo",
    grupo: "1182",
    cota: "007",
    valorCredito: 120000,
    valorParcela: 980,
    parcelaAtual: 980,
    prazoMeses: 84,
    totalParcelas: 84,
    parcelasPagas: 84,
    taxaAdministracao: 18,
    taxaTipo: "total",
    dataInicio: "2017-06-01",
    status: "bem_adquirido",
    contemplado: true,
    contemplacao: {
      forma: "lance_livre",
      data: "2021-08-15",
      valorLance: 15000,
    },
    lance: 15000,
  },
];
