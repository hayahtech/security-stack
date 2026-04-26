/* ── Parceiros & Fornecedores — types + mock data ── */

export type ParceiroTipo =
  | "fornecedor" | "veterinario" | "transportador" | "servicos_aereos"
  | "frigorifico" | "contador" | "cliente" | "funcionario" | "familiar" | "outro";

export const tipoLabel: Record<ParceiroTipo, string> = {
  fornecedor: "Fornecedor",
  veterinario: "Veterinário",
  transportador: "Transportador",
  servicos_aereos: "Serviços Aéreos (Drone)",
  frigorifico: "Frigorífico/Abatedouro",
  contador: "Contador",
  cliente: "Cliente",
  funcionario: "Funcionário",
  familiar: "Familiar",
  outro: "Outro",
};

export const tipoColor: Record<ParceiroTipo, string> = {
  fornecedor: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  veterinario: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  transportador: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  servicos_aereos: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  frigorifico: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  contador: "bg-primary/15 text-primary border-primary/30",
  cliente: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  funcionario: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  familiar: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
  outro: "bg-muted text-muted-foreground border-border",
};

export const especialidades: Record<string, string[]> = {
  fornecedor: ["Ração & Insumos", "Medicamentos", "Combustível", "Máquinas & Peças", "Sementes & Defensivos", "Outros"],
  veterinario: ["Clínico Geral", "Reprodução", "Cirurgião", "Nutricionista", "Outros"],
  transportador: ["Gado", "Grãos", "Combustível", "Carga Geral"],
  servicos_aereos: ["Pulverização", "Mapeamento & Topografia", "Monitoramento de Pastagem", "Contagem de Rebanho", "Outros"],
};

export const filterTabs: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "fornecedor", label: "Fornecedores" },
  { value: "veterinario", label: "Veterinários" },
  { value: "transportador", label: "Transportadores" },
  { value: "servicos_aereos", label: "Serviços Aéreos" },
  { value: "frigorifico", label: "Frigoríficos" },
  { value: "contador", label: "Contadores" },
  { value: "cliente", label: "Clientes" },
  { value: "outro", label: "Outros" },
];

export interface Parceiro {
  id: string;
  name: string;
  tipo: ParceiroTipo;
  especialidade: string;
  doc: string;
  phones: string[];
  email: string;
  city: string;
  state: string;
  address: string;
  crmv: string;
  anac_sisant: string;
  notes: string;
  active: boolean;
}

export interface ParceiroTxn {
  date: string;
  description: string;
  amount: number;
  direction: "entrada" | "saida";
}

export const mockParceiros: Parceiro[] = [
  {
    id: "p1", name: "Agropecuária Boa Safra", tipo: "fornecedor", especialidade: "Ração & Insumos",
    doc: "00.000.000/0001-01", phones: ["(00) 00000-0010", "(00) 00000-0011"],
    email: "fornecedor1@exemplo.com", city: "Uberaba", state: "MG",
    address: "Av. Brasil 1500, Centro", crmv: "", anac_sisant: "",
    notes: "Ração, sal mineral, medicamentos", active: true,
  },
  {
    id: "p2", name: "Dr. Paulo Mendes", tipo: "veterinario", especialidade: "Reprodução",
    doc: "000.000.001-00", phones: ["(00) 00000-0001"],
    email: "veterinario1@exemplo.com", city: "Uberaba", state: "MG",
    address: "", crmv: "CRMV-MG 12345", anac_sisant: "",
    notes: "Especialista em reprodução bovina, IATF", active: true,
  },
  {
    id: "p3", name: "Transportadora Rápido", tipo: "transportador", especialidade: "Gado",
    doc: "00.000.000/0001-02", phones: ["(00) 00000-0020"],
    email: "transportador1@exemplo.com", city: "Uberlândia", state: "MG",
    address: "Distrito Industrial, Rua B 350", crmv: "", anac_sisant: "",
    notes: "Transporte de gado vivo — caminhão boiadeiro", active: true,
  },
  {
    id: "p4", name: "Frigorífico São Paulo", tipo: "frigorifico", especialidade: "",
    doc: "00.000.000/0001-03", phones: ["(00) 00000-0030"],
    email: "frigorifico1@exemplo.com", city: "Lins", state: "SP",
    address: "Rod. SP-300 km 420", crmv: "", anac_sisant: "",
    notes: "Compra bois gordos, pagamento 7 dias", active: true,
  },
  {
    id: "p5", name: "Carlos Ferreira Contabilidade", tipo: "contador", especialidade: "",
    doc: "000.000.002-00", phones: ["(00) 00000-0002"],
    email: "contador1@exemplo.com", city: "Uberaba", state: "MG",
    address: "R. Santos Dumont 200, Sala 5", crmv: "", anac_sisant: "",
    notes: "Escritório contábil parceiro", active: true,
  },
  {
    id: "p6", name: "AgroDrone Soluções", tipo: "servicos_aereos", especialidade: "Pulverização",
    doc: "00.000.000/0001-04", phones: ["(00) 00000-0040"],
    email: "drone1@exemplo.com", city: "Uberlândia", state: "MG",
    address: "Av. Rondon Pacheco 2050", crmv: "", anac_sisant: "ANAC-OP-2024-0987",
    notes: "Pulverização e mapeamento com drone", active: true,
  },
  {
    id: "p7", name: "Fazenda Três Barras", tipo: "cliente", especialidade: "",
    doc: "00.000.000/0001-05", phones: ["(00) 00000-0050"],
    email: "cliente1@exemplo.com", city: "Sacramento", state: "MG",
    address: "Zona Rural, Sacramento-MG", crmv: "", anac_sisant: "",
    notes: "Compra bezerros desmamados", active: true,
  },
  {
    id: "p8", name: "Dra. Ana Costa", tipo: "veterinario", especialidade: "Clínico Geral",
    doc: "000.000.003-00", phones: ["(00) 00000-0003"],
    email: "veterinario2@exemplo.com", city: "Uberaba", state: "MG",
    address: "", crmv: "CRMV-MG 67890", anac_sisant: "",
    notes: "Clínica geral, atende emergências", active: false,
  },
];

export const mockParceiroTxns: Record<string, ParceiroTxn[]> = {
  p1: [
    { date: "2026-03-06", description: "Compra de ração concentrada", amount: 3850, direction: "saida" },
    { date: "2026-01-10", description: "Sal mineral — 500kg", amount: 1200, direction: "saida" },
    { date: "2025-12-05", description: "Medicamentos veterinários", amount: 980, direction: "saida" },
    { date: "2025-11-20", description: "Ração confinamento", amount: 5200, direction: "saida" },
  ],
  p2: [
    { date: "2026-03-07", description: "Diagnóstico de prenhez — 15 vacas", amount: 1500, direction: "saida" },
    { date: "2026-01-20", description: "IATF protocolo — lote 2025-A", amount: 2800, direction: "saida" },
    { date: "2025-09-15", description: "Consulta clínica — BR001", amount: 350, direction: "saida" },
  ],
  p3: [
    { date: "2026-01-10", description: "Frete — transporte de 8 bois", amount: 2400, direction: "saida" },
    { date: "2025-10-05", description: "Frete — transporte de 5 bois", amount: 1600, direction: "saida" },
  ],
  p4: [
    { date: "2026-01-10", description: "Venda de boi gordo — BR007 Valente", amount: 14507, direction: "entrada" },
    { date: "2025-10-05", description: "Venda de boi gordo — BR020 Guerreiro", amount: 14673, direction: "entrada" },
    { date: "2025-06-12", description: "Venda de novilha — BR015", amount: 8200, direction: "entrada" },
  ],
  p6: [
    { date: "2026-02-15", description: "Pulverização — 120 ha", amount: 4800, direction: "saida" },
    { date: "2025-08-10", description: "Mapeamento topográfico", amount: 3500, direction: "saida" },
  ],
  p7: [
    { date: "2026-02-20", description: "Venda 5 bezerros desmamados", amount: 12500, direction: "entrada" },
    { date: "2025-07-15", description: "Venda 3 bezerros", amount: 7200, direction: "entrada" },
  ],
};
