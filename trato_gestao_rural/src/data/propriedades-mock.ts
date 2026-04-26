/* ── Propriedades — mock data ────────────────────── */

export type TipoPosse = "propria" | "arrendada" | "parceria" | "comodato" | "posse";
export type TipoPropriedade = "rural" | "urbana" | "mista";
export type Bioma = "amazonia" | "cerrado" | "mata_atlantica" | "caatinga" | "pampa" | "pantanal";
export type ConservacaoEstado = "otimo" | "bom" | "regular" | "ruim";

export const BIOMA_LABELS: Record<Bioma, string> = {
  amazonia: "Amazônia", cerrado: "Cerrado", mata_atlantica: "Mata Atlântica",
  caatinga: "Caatinga", pampa: "Pampa", pantanal: "Pantanal",
};

export const BIOMA_RL_PERCENT: Record<Bioma, number> = {
  amazonia: 80, cerrado: 35, mata_atlantica: 20,
  caatinga: 20, pampa: 20, pantanal: 20,
};

export interface PropriedadeDados {
  id: string;
  nome: string;
  tipo: TipoPropriedade;
  areaTotal: number;
  areaProdutiva: number;
  areaPreservacao: number;
  municipio: string;
  estado: string;
  cep: string;
  latitude: number;
  longitude: number;
  proprietario: string;
  formaPosse: TipoPosse;
  nirf: string;
  incra: string;
  car: string;
  ccir: string;
  ie: string;
  cie: string;
  cnpj: string;
  areaTributavel: number;
  moduloFiscal: number;
  bioma: Bioma;
}

export interface Documento {
  id: string;
  nome: string;
  secao: "dominio" | "ambiental" | "fiscal" | "infraestrutura" | "outros";
  tipo: string;
  dataDocumento: string;
  dataVencimento: string | null;
  arquivo: string | null;
  observacoes: string;
}

export interface Benfeitoria {
  id: string;
  nome: string;
  categoria: "residencial" | "pecuaria" | "armazenagem" | "operacional" | "hidrico" | "energia" | "ambiental";
  tipo: string;
  areaCapacidade: string;
  anoConstrucao: number;
  conservacao: ConservacaoEstado;
  valorEstimado: number;
  observacoes: string;
  foto: string | null;
}

export interface Arrendamento {
  id: string;
  tipo: "recebido" | "cedido";
  parceiro: string;
  areaHa: number;
  descricaoArea: string;
  valorTipo: "reais_ha_ano" | "sacas_ha" | "percentual";
  valor: number;
  dataInicio: string;
  dataVencimento: string;
  formaPagamento: "dinheiro" | "produto" | "percentual";
  contrato: string | null;
}

export interface ItrExercicio {
  id: string;
  ano: number;
  areaTotal: number;
  areaTributavel: number;
  grauUtilizacao: number;
  vtnHa: number;
  itrLancado: number;
  itrPago: number;
  status: "pago" | "pendente" | "parcelado";
}

export const CATEGORIA_ICONS: Record<string, string> = {
  residencial: "🏠", pecuaria: "🐄", armazenagem: "🌾",
  operacional: "⚙️", hidrico: "💧", energia: "⚡", ambiental: "🌿",
};

export const TIPOS_BENFEITORIA: Record<string, string[]> = {
  residencial: ["Casa sede", "Casa de funcionário", "Alojamento"],
  pecuaria: ["Curral", "Brete", "Tronco", "Balança", "Embarcadouro", "Manga", "Cocheira"],
  armazenagem: ["Silo", "Paiol", "Armazém", "Câmara fria", "Galpão"],
  operacional: ["Oficina", "Garagem de máquinas", "Posto de combustível", "Casa de força"],
  hidrico: ["Açude", "Poço artesiano", "Caixa d'água", "Bebedouro fixo", "Pivô central", "Sistema de irrigação"],
  energia: ["Rede elétrica", "Gerador", "Painel solar", "Biodigestor"],
  ambiental: ["Reserva Legal", "APP", "Área de reflorestamento", "Cerca viva"],
};

export const SECAO_DOCS: Record<string, { label: string; tipos: string[] }> = {
  dominio: { label: "Domínio e Posse", tipos: ["Escritura", "Matrícula do imóvel", "CCIR", "Contrato de arrendamento"] },
  ambiental: { label: "Ambiental", tipos: ["CAR", "Licença ambiental", "ARL (Reserva Legal)", "APP"] },
  fiscal: { label: "Fiscal", tipos: ["ITR", "DIAT", "DIRPF (atividade rural)"] },
  infraestrutura: { label: "Infraestrutura", tipos: ["Projeto elétrico", "Outorga de água", "Licença de perfuração de poço"] },
  outros: { label: "Outros", tipos: ["Certidão", "Contrato", "Alvará", "Outro"] },
};

/* ── Mock data ─── */

export const mockPropriedade: PropriedadeDados = {
  id: "prop1",
  nome: "Fazenda Boa Vista",
  tipo: "rural",
  areaTotal: 850,
  areaProdutiva: 620,
  areaPreservacao: 170,
  municipio: "Uberaba",
  estado: "MG",
  cep: "38000-000",
  latitude: -19.7472,
  longitude: -47.9318,
  proprietario: "João Silva",
  formaPosse: "propria",
  nirf: "0.123.456-7",
  incra: "814.123.456.789-0",
  car: "MG-3170107-F8A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6",
  ccir: "123456789",
  ie: "001.234.567.0001",
  cie: "BR123456789",
  cnpj: "12.345.678/0001-90",
  areaTributavel: 680,
  moduloFiscal: 24,
  bioma: "cerrado",
};

export const mockDocumentos: Documento[] = [
  { id: "d1", nome: "Escritura Pública", secao: "dominio", tipo: "Escritura", dataDocumento: "2015-03-15", dataVencimento: null, arquivo: "escritura.pdf", observacoes: "Escritura registrada no 1° Cartório de Uberaba" },
  { id: "d2", nome: "Matrícula 12.345", secao: "dominio", tipo: "Matrícula do imóvel", dataDocumento: "2015-03-20", dataVencimento: null, arquivo: "matricula.pdf", observacoes: "" },
  { id: "d3", nome: "CCIR 2025", secao: "dominio", tipo: "CCIR", dataDocumento: "2025-01-15", dataVencimento: "2026-01-15", arquivo: "ccir_2025.pdf", observacoes: "Vence anualmente" },
  { id: "d4", nome: "CAR Fazenda Boa Vista", secao: "ambiental", tipo: "CAR", dataDocumento: "2018-06-10", dataVencimento: null, arquivo: "car.pdf", observacoes: "Protocolo ativo no SICAR" },
  { id: "d5", nome: "Licença Ambiental LP-123", secao: "ambiental", tipo: "Licença ambiental", dataDocumento: "2023-07-01", dataVencimento: "2026-07-01", arquivo: "licenca_amb.pdf", observacoes: "Licença Prévia" },
  { id: "d6", nome: "ITR 2025", secao: "fiscal", tipo: "ITR", dataDocumento: "2025-09-30", dataVencimento: null, arquivo: "itr_2025.pdf", observacoes: "" },
  { id: "d7", nome: "ITR 2024", secao: "fiscal", tipo: "ITR", dataDocumento: "2024-09-30", dataVencimento: null, arquivo: "itr_2024.pdf", observacoes: "" },
  { id: "d8", nome: "Outorga de Água", secao: "infraestrutura", tipo: "Outorga de água", dataDocumento: "2022-01-15", dataVencimento: "2027-01-15", arquivo: "outorga.pdf", observacoes: "IGAM — 10 m³/h" },
];

export const mockBenfeitorias: Benfeitoria[] = [
  { id: "b1", nome: "Casa Sede", categoria: "residencial", tipo: "Casa sede", areaCapacidade: "280 m²", anoConstrucao: 2005, conservacao: "otimo", valorEstimado: 450000, observacoes: "Reformada em 2020", foto: null },
  { id: "b2", nome: "Casa de Funcionários 1", categoria: "residencial", tipo: "Casa de funcionário", areaCapacidade: "80 m²", anoConstrucao: 2010, conservacao: "bom", valorEstimado: 120000, observacoes: "", foto: null },
  { id: "b3", nome: "Curral Principal", categoria: "pecuaria", tipo: "Curral", areaCapacidade: "2.500 m²", anoConstrucao: 2012, conservacao: "bom", valorEstimado: 180000, observacoes: "Capacidade 500 cabeças", foto: null },
  { id: "b4", nome: "Tronco + Brete", categoria: "pecuaria", tipo: "Brete", areaCapacidade: "120 m", anoConstrucao: 2015, conservacao: "otimo", valorEstimado: 85000, observacoes: "Brete com seringa", foto: null },
  { id: "b5", nome: "Balança Digital", categoria: "pecuaria", tipo: "Balança", areaCapacidade: "2.000 kg", anoConstrucao: 2020, conservacao: "otimo", valorEstimado: 35000, observacoes: "Marca Coimma", foto: null },
  { id: "b6", nome: "Galpão de Insumos", categoria: "armazenagem", tipo: "Galpão", areaCapacidade: "400 m²", anoConstrucao: 2014, conservacao: "bom", valorEstimado: 200000, observacoes: "", foto: null },
  { id: "b7", nome: "Oficina", categoria: "operacional", tipo: "Oficina", areaCapacidade: "150 m²", anoConstrucao: 2016, conservacao: "regular", valorEstimado: 90000, observacoes: "Necessita pintura", foto: null },
  { id: "b8", nome: "Poço Artesiano 1", categoria: "hidrico", tipo: "Poço artesiano", areaCapacidade: "15 m³/h", anoConstrucao: 2018, conservacao: "otimo", valorEstimado: 60000, observacoes: "Profundidade 120m", foto: null },
  { id: "b9", nome: "Açude Principal", categoria: "hidrico", tipo: "Açude", areaCapacidade: "3.5 ha", anoConstrucao: 2000, conservacao: "bom", valorEstimado: 150000, observacoes: "", foto: null },
  { id: "b10", nome: "Reserva Legal", categoria: "ambiental", tipo: "Reserva Legal", areaCapacidade: "170 ha", anoConstrucao: 0, conservacao: "otimo", valorEstimado: 0, observacoes: "Averbada na matrícula", foto: null },
];

export const mockArrendamentos: Arrendamento[] = [
  { id: "ar1", tipo: "recebido", parceiro: "José Pereira", areaHa: 120, descricaoArea: "Pasto 5, 6 e 7 — área norte", valorTipo: "reais_ha_ano", valor: 800, dataInicio: "2025-01-01", dataVencimento: "2027-12-31", formaPagamento: "dinheiro", contrato: "arrendamento_norte.pdf" },
  { id: "ar2", tipo: "cedido", parceiro: "Cooperativa Agrícola Central", areaHa: 80, descricaoArea: "Área de lavoura — talhão sul", valorTipo: "sacas_ha", valor: 12, dataInicio: "2025-07-01", dataVencimento: "2026-06-30", formaPagamento: "produto", contrato: null },
];

export const mockItrHistorico: ItrExercicio[] = [
  { id: "itr1", ano: 2025, areaTotal: 850, areaTributavel: 680, grauUtilizacao: 72.9, vtnHa: 8500, itrLancado: 1250, itrPago: 1250, status: "pago" },
  { id: "itr2", ano: 2024, areaTotal: 850, areaTributavel: 680, grauUtilizacao: 71.5, vtnHa: 7800, itrLancado: 1180, itrPago: 1180, status: "pago" },
  { id: "itr3", ano: 2023, areaTotal: 850, areaTributavel: 680, grauUtilizacao: 70.2, vtnHa: 7200, itrLancado: 1100, itrPago: 1100, status: "pago" },
  { id: "itr4", ano: 2022, areaTotal: 850, areaTributavel: 680, grauUtilizacao: 68.8, vtnHa: 6500, itrLancado: 980, itrPago: 980, status: "pago" },
  { id: "itr5", ano: 2021, areaTotal: 850, areaTributavel: 680, grauUtilizacao: 67.0, vtnHa: 6000, itrLancado: 900, itrPago: 900, status: "pago" },
];

export interface OutorgaAgua {
  possui: boolean;
  orgao: string;
  numero: string;
  validade: string;
  vazao: number;
}

export const mockOutorga: OutorgaAgua = {
  possui: true,
  orgao: "IGAM",
  numero: "OUT-2022-0456",
  validade: "2027-01-15",
  vazao: 15,
};
