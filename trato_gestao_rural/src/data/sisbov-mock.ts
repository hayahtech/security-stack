/* ── SISBOV & Rastreabilidade — tipos e dados mock ── */

import { mockAnimals, type Animal } from "./rebanho-mock";

// ── Types ──
export type SisbovStatus = "ativo" | "auditoria" | "suspenso" | "nao_certificado";
export type BrincoTipo = "convencional" | "eletronico" | "botton" | "tatuagem";
export type SisbovAnimalStatus = "identificado" | "pendente" | "nao_identificado" | "substituido";
export type EventoTipo = "nascimento" | "entrada" | "pesagem" | "tratamento" | "vacina" | "movimentacao" | "reproducao" | "alimentacao" | "saida";
export type AlimentacaoTipo = "pasto" | "suplementacao" | "confinamento" | "semiconfinamento";

export const SISBOV_STATUS_LABEL: Record<SisbovStatus, string> = {
  ativo: "Ativo", auditoria: "Em auditoria", suspenso: "Suspenso", nao_certificado: "Não certificado",
};

export const SISBOV_STATUS_COLOR: Record<SisbovStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  auditoria: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  suspenso: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  nao_certificado: "bg-muted text-muted-foreground",
};

export const BRINCO_TIPO_LABEL: Record<BrincoTipo, string> = {
  convencional: "Convencional", eletronico: "Eletrônico (RFID)", botton: "Botton", tatuagem: "Tatuagem",
};

export const ANIMAL_SISBOV_STATUS_LABEL: Record<SisbovAnimalStatus, string> = {
  identificado: "Identificado", pendente: "Pendente", nao_identificado: "Não identificado", substituido: "Substituído",
};

export const ANIMAL_SISBOV_STATUS_COLOR: Record<SisbovAnimalStatus, string> = {
  identificado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  pendente: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  nao_identificado: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  substituido: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export const CERTIFICADORAS = [
  "Argus", "Bureau Veritas", "Control Union", "IMC – Instituto Mineiro de Controle",
  "ABCZ Serviços", "Sertão Consultoria", "Outro",
];

export const EVENTO_LABEL: Record<EventoTipo, string> = {
  nascimento: "Nascimento", entrada: "Entrada na propriedade", pesagem: "Pesagem",
  tratamento: "Tratamento", vacina: "Vacinação", movimentacao: "Movimentação de pasto",
  reproducao: "Diagnóstico reprodutivo", alimentacao: "Registro de alimentação", saida: "Saída da propriedade",
};

export const EVENTO_ICON: Record<EventoTipo, string> = {
  nascimento: "🐣", entrada: "📥", pesagem: "⚖️", tratamento: "💊",
  vacina: "💉", movimentacao: "🔄", reproducao: "🔬", alimentacao: "🌾", saida: "📤",
};

// ── Interfaces ──
export interface SisbovConfig {
  numeroCertificacao: string;
  certificadora: string;
  dataInicio: string;
  cie: string;
  nirf: string;
  ie: string;
  status: SisbovStatus;
  proximaAuditoria: string;
}

export interface SisbovAnimal {
  animalId: string;
  brincoSisbov: string;
  dataIdentificacao: string;
  tipoBrinco: BrincoTipo;
  statusSisbov: SisbovAnimalStatus;
}

export interface EventoRastreabilidade {
  id: string;
  animalId: string;
  tipo: EventoTipo;
  data: string;
  descricao: string;
  responsavel: string;
  detalhes?: string;
}

export interface AlimentacaoRegistro {
  id: string;
  animalId: string;
  tipo: AlimentacaoTipo;
  insumos: string;
  periodo: string;
  certificacaoOrigem: string;
}

export interface AlertaSisbov {
  id: string;
  tipo: "identificacao" | "gta" | "vacina" | "carencia" | "auditoria" | "conformidade";
  severidade: "urgente" | "atencao" | "info";
  titulo: string;
  descricao: string;
  data: string;
}

// ── Mock Data ──
export const mockSisbovConfig: SisbovConfig = {
  numeroCertificacao: "SISBOV-MG-2024-00456",
  certificadora: "Bureau Veritas",
  dataInicio: "2020-03-15",
  cie: "BR123456789",
  nirf: "0.123.456-7",
  ie: "001.234.567.0001",
  status: "ativo",
  proximaAuditoria: "2026-06-15",
};

// Generate SISBOV identification for animals
export const mockSisbovAnimals: SisbovAnimal[] = mockAnimals
  .filter((a) => a.species === "bovino" && a.current_status === "ativo")
  .map((a, i) => ({
    animalId: a.id,
    brincoSisbov: i < 15 ? `BR${String(900000 + i).padStart(9, "0")}` : "",
    dataIdentificacao: i < 15 ? `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}` : "",
    tipoBrinco: (i < 15 ? (i % 3 === 0 ? "eletronico" : i % 3 === 1 ? "convencional" : "botton") : "convencional") as BrincoTipo,
    statusSisbov: (i < 15 ? "identificado" : i < 18 ? "pendente" : "nao_identificado") as SisbovAnimalStatus,
  }));

// Timeline events for first few animals
const baseEvents: Omit<EventoRastreabilidade, "id">[] = [
  { animalId: "a1", tipo: "nascimento", data: "2022-03-15", descricao: "Nascimento na propriedade — parto normal", responsavel: "João Silva" },
  { animalId: "a1", tipo: "vacina", data: "2022-09-15", descricao: "Febre Aftosa — 1ª dose", responsavel: "Dr. Carlos Mendes", detalhes: "Vacina Ourovac — Lote 2022A" },
  { animalId: "a1", tipo: "pesagem", data: "2023-01-10", descricao: "Pesagem rotina — 185 kg", responsavel: "José Pereira" },
  { animalId: "a1", tipo: "movimentacao", data: "2023-02-01", descricao: "Piquete Maternidade → Pasto Norte", responsavel: "José Pereira" },
  { animalId: "a1", tipo: "vacina", data: "2023-05-15", descricao: "Brucelose — dose única (B19)", responsavel: "Dr. Carlos Mendes", detalhes: "Vacina Brucelina — Lote BR23" },
  { animalId: "a1", tipo: "pesagem", data: "2023-07-20", descricao: "Pesagem rotina — 310 kg", responsavel: "José Pereira" },
  { animalId: "a1", tipo: "tratamento", data: "2023-08-05", descricao: "Vermifugação — Ivermectina 1%", responsavel: "Dr. Carlos Mendes", detalhes: "Dose: 10ml — Carência: 35 dias" },
  { animalId: "a1", tipo: "alimentacao", data: "2023-09-01", descricao: "Suplementação mineral — período de seca", responsavel: "João Silva" },
  { animalId: "a1", tipo: "movimentacao", data: "2024-01-15", descricao: "Pasto Norte → Pasto Grande", responsavel: "José Pereira" },
  { animalId: "a1", tipo: "pesagem", data: "2024-06-10", descricao: "Pesagem rotina — 420 kg", responsavel: "José Pereira" },
  { animalId: "a1", tipo: "reproducao", data: "2024-09-20", descricao: "Diagnóstico: apta para reprodução", responsavel: "Dr. Carlos Mendes" },
  { animalId: "a1", tipo: "vacina", data: "2025-05-15", descricao: "Febre Aftosa — reforço anual", responsavel: "Dr. Carlos Mendes", detalhes: "Campanha estadual 2025" },
  { animalId: "a1", tipo: "pesagem", data: "2026-01-15", descricao: "Pesagem rotina — 480 kg", responsavel: "José Pereira" },
  { animalId: "a2", tipo: "entrada", data: "2023-06-10", descricao: "Entrada via compra — GTA nº 12345", responsavel: "João Silva", detalhes: "Origem: Fazenda São José — Sacramento/MG" },
  { animalId: "a2", tipo: "pesagem", data: "2023-06-10", descricao: "Pesagem entrada — 350 kg", responsavel: "José Pereira" },
  { animalId: "a2", tipo: "vacina", data: "2023-11-15", descricao: "Febre Aftosa", responsavel: "Dr. Carlos Mendes" },
  { animalId: "a2", tipo: "pesagem", data: "2024-03-20", descricao: "Pesagem rotina — 410 kg", responsavel: "José Pereira" },
  { animalId: "a2", tipo: "movimentacao", data: "2024-08-01", descricao: "Pasto Sul → Confinamento", responsavel: "José Pereira" },
  { animalId: "a2", tipo: "alimentacao", data: "2024-08-01", descricao: "Confinamento — ração balanceada + silagem", responsavel: "João Silva" },
];

export const mockEventos: EventoRastreabilidade[] = baseEvents.map((e, i) => ({ ...e, id: `ev-${i + 1}` }));

export const mockAlimentacao: AlimentacaoRegistro[] = [
  { id: "alim-1", animalId: "a1", tipo: "pasto", insumos: "Braquiária Marandu + sal mineral", periodo: "2022-03 a 2023-08", certificacaoOrigem: "Sal mineral Matsuda" },
  { id: "alim-2", animalId: "a1", tipo: "suplementacao", insumos: "Proteinado 40% + silagem de milho", periodo: "2023-09 a 2024-01", certificacaoOrigem: "Proteinado Nutriphos — Lote 2023" },
  { id: "alim-3", animalId: "a1", tipo: "pasto", insumos: "Tanzânia + suplementação mineral", periodo: "2024-02 a presente", certificacaoOrigem: "Sal mineral Guabi" },
  { id: "alim-4", animalId: "a2", tipo: "confinamento", insumos: "Ração balanceada 22% PB + silagem + caroço de algodão", periodo: "2024-08 a presente", certificacaoOrigem: "Ração Agroceres — NF 4567" },
];

export const mockAlertasSisbov: AlertaSisbov[] = [
  { id: "al-1", tipo: "identificacao", severidade: "urgente", titulo: "3 animais sem identificação SISBOV", descricao: "Bovinos BR-019, BR-020, BR-021 nasceram há mais de 30 dias sem brinco SISBOV registrado.", data: "2026-03-08" },
  { id: "al-2", tipo: "vacina", severidade: "atencao", titulo: "Vacinação Febre Aftosa pendente", descricao: "Campanha de vacinação estadual em andamento. 5 animais sem registro de dose.", data: "2026-03-05" },
  { id: "al-3", tipo: "auditoria", severidade: "atencao", titulo: "Auditoria SISBOV em 99 dias", descricao: "Próxima auditoria da Bureau Veritas agendada para 15/06/2026. Prepare a documentação.", data: "2026-03-08" },
  { id: "al-4", tipo: "gta", severidade: "info", titulo: "Movimentação sem GTA", descricao: "Transferência de 2 animais do Pasto Sul para Confinamento sem GTA vinculado.", data: "2026-03-02" },
  { id: "al-5", tipo: "carencia", severidade: "atencao", titulo: "Animais em período de carência", descricao: "4 animais com tratamento recente — carência de Ivermectina até 12/04/2026.", data: "2026-03-08" },
  { id: "al-6", tipo: "conformidade", severidade: "info", titulo: "Conformidade SISBOV: 83%", descricao: "Taxa de identificação abaixo de 95%. Risco de observação na próxima auditoria.", data: "2026-03-08" },
];

// ── Helpers ──
export function getAnimalSisbov(animalId: string): SisbovAnimal | undefined {
  return mockSisbovAnimals.find((s) => s.animalId === animalId);
}

export function getAnimalEventos(animalId: string): EventoRastreabilidade[] {
  return mockEventos.filter((e) => e.animalId === animalId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function getAnimalAlimentacao(animalId: string): AlimentacaoRegistro[] {
  return mockAlimentacao.filter((a) => a.animalId === animalId);
}

export function getSisbovStats() {
  const bovinos = mockAnimals.filter((a) => a.species === "bovino" && a.current_status === "ativo");
  const total = bovinos.length;
  const identificados = mockSisbovAnimals.filter((s) => s.statusSisbov === "identificado").length;
  const pendentes = mockSisbovAnimals.filter((s) => s.statusSisbov === "pendente").length;
  const naoIdentificados = total - identificados - pendentes;
  const conformidade = total > 0 ? Math.round((identificados / total) * 100) : 0;
  return { total, identificados, pendentes, naoIdentificados, conformidade };
}
