export type ConsorcioStatus = "ativo" | "contemplado" | "encerrado" | "cancelado";

export interface Consorcio {
  id: string;
  nome: string;
  administradora: string;
  tipoBem: "imovel" | "veiculo" | "maquina" | "servico";
  valorCredito: number;
  valorParcela: number;
  totalParcelas: number;
  parcelasPagas: number;
  dataInicio: string;
  status: ConsorcioStatus;
  lance?: number;
  observacoes?: string;
}

export const consorcioStatusLabels: Record<ConsorcioStatus, string> = {
  ativo: "Ativo",
  contemplado: "Contemplado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export const consorcioStatusColors: Record<ConsorcioStatus, string> = {
  ativo: "bg-blue-100 text-blue-700",
  contemplado: "bg-green-100 text-green-700",
  encerrado: "bg-gray-100 text-gray-600",
  cancelado: "bg-red-100 text-red-700",
};

export const mockConsorcios: Consorcio[] = [
  {
    id: "1",
    nome: "Consórcio Imóvel Casa Própria",
    administradora: "Embracon",
    tipoBem: "imovel",
    valorCredito: 250000,
    valorParcela: 1850,
    totalParcelas: 200,
    parcelasPagas: 48,
    dataInicio: "2021-03-01",
    status: "ativo",
    observacoes: "Grupo 0245",
  },
  {
    id: "2",
    nome: "Consórcio Veículo SUV",
    administradora: "Porto Seguro",
    tipoBem: "veiculo",
    valorCredito: 120000,
    valorParcela: 980,
    totalParcelas: 84,
    parcelasPagas: 84,
    dataInicio: "2017-06-01",
    status: "contemplado",
    lance: 15000,
  },
];
