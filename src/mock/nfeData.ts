export interface NFe {
  id: string;
  numero: string;
  tomador: string;
  cnpj: string;
  servico: string;
  valor: number;
  iss: number;
  pis: number;
  cofins: number;
  valorLiquido: number;
  status: "Emitida" | "Cancelada" | "Pendente";
  dataEmissao: string;
}

const clientes = [
  "TechCorp Brasil", "Inovação Digital Ltda", "CloudServ S.A.", "DataPrime Solutions",
  "FinTech Pro", "LogiSmart Ltda", "MegaStore Online", "NetBridge Telecom",
  "OmniPay Serviços", "PrimeConsult", "QualiSoft", "RedeTech", "SigmaData",
  "TopLine SA", "UniCloud", "VirtuPay", "WebFlex", "XData Analytics", "YieldTech", "ZetaCore"
];

export const nfeList: NFe[] = Array.from({ length: 50 }, (_, i) => {
  const valor = Math.round((Math.random() * 40000 + 2000) * 100) / 100;
  const iss = Math.round(valor * 0.02 * 100) / 100;
  const pis = Math.round(valor * 0.0065 * 100) / 100;
  const cofins = Math.round(valor * 0.03 * 100) / 100;
  const statuses: NFe["status"][] = ["Emitida", "Emitida", "Emitida", "Emitida", "Pendente", "Cancelada"];
  const day = Math.floor(Math.random() * 28) + 1;
  const month = Math.random() > 0.5 ? 2 : 1;
  return {
    id: `nfe-${i + 1}`,
    numero: `NFS-e ${String(2024001 + i).padStart(7, "0")}`,
    tomador: clientes[i % clientes.length],
    cnpj: `${String(10 + i).padStart(2, "0")}.${String(Math.floor(Math.random() * 999)).padStart(3, "0")}.${String(Math.floor(Math.random() * 999)).padStart(3, "0")}/0001-${String(Math.floor(Math.random() * 99)).padStart(2, "0")}`,
    servico: "Licenciamento de Software SaaS",
    valor,
    iss,
    pis,
    cofins,
    valorLiquido: Math.round((valor - iss - pis - cofins) * 100) / 100,
    status: statuses[i % statuses.length],
    dataEmissao: `2025-0${month + 1}-${String(day).padStart(2, "0")}`,
  };
});

export const nfeResumo = {
  totalEmitido: 4850000,
  totalNFs: 847,
  totalPendentes: 12,
  totalCanceladas: 3,
  issTotal: 97000,
  pisTotal: 31525,
  cofinsTotal: 145500,
};
