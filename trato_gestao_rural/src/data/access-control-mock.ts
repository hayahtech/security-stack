/* ── Access Control Mock Data ────────────────────── */

export type PermissionLevel = "none" | "read" | "write" | "full";

export interface AccessProfile {
  id: string;
  name: string;
  slug: string;
  description: string;
  isDefault: boolean;
  permissions: Record<string, PermissionLevel>;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  profileId: string;
  farms: string[];
  lastAccess: string | null;
  status: "active" | "inactive" | "pending";
  invitedAt?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "create" | "update" | "delete" | "login" | "approve" | "reject";
  module: string;
  record: string;
  ip: string;
}

export interface PendingApproval {
  id: string;
  description: string;
  amount: number;
  requestedBy: string;
  requestedByName: string;
  date: string;
  module: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

export const SYSTEM_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "financeiro", label: "Financeiro" },
  { id: "rebanho", label: "Rebanho" },
  { id: "fazenda", label: "Fazenda" },
  { id: "pastos", label: "Pastos" },
  { id: "funcionarios", label: "Funcionários" },
  { id: "relatorios", label: "Relatórios" },
  { id: "configuracoes", label: "Configurações" },
  { id: "contato", label: "Contato" },
  { id: "producao", label: "Produção" },
  { id: "calendario", label: "Calendário" },
  { id: "atividades", label: "Atividades" },
] as const;

function makePerms(defaults: Record<string, PermissionLevel>): Record<string, PermissionLevel> {
  const base: Record<string, PermissionLevel> = {};
  SYSTEM_MODULES.forEach((m) => (base[m.id] = "none"));
  return { ...base, ...defaults };
}

const allFull = () => makePerms(Object.fromEntries(SYSTEM_MODULES.map((m) => [m.id, "full" as const])));

export const DEFAULT_PROFILES: AccessProfile[] = [
  {
    id: "owner",
    name: "Proprietário",
    slug: "owner",
    description: "Acesso total a tudo — sem restrições",
    isDefault: true,
    permissions: allFull(),
  },
  {
    id: "manager",
    name: "Gerente",
    slug: "manager",
    description: "Acesso total exceto gerenciar usuários e dados pessoais/salários",
    isDefault: true,
    permissions: makePerms({
      dashboard: "full", financeiro: "full", rebanho: "full", fazenda: "full",
      pastos: "full", funcionarios: "read", relatorios: "full", configuracoes: "read",
      contato: "full", producao: "full", calendario: "full", atividades: "full",
    }),
  },
  {
    id: "vet",
    name: "Veterinário",
    slug: "vet",
    description: "Acesso completo a Rebanho; somente leitura em Fazenda e Pastos",
    isDefault: true,
    permissions: makePerms({
      dashboard: "read", rebanho: "full", fazenda: "read", pastos: "read",
      atividades: "read", calendario: "read",
    }),
  },
  {
    id: "field",
    name: "Vaqueiro / Operador",
    slug: "field",
    description: "Interface simplificada — pesagens, tratamentos, ordenha e movimentações",
    isDefault: true,
    permissions: makePerms({
      rebanho: "write", pastos: "write", atividades: "write",
    }),
  },
  {
    id: "accountant",
    name: "Contador",
    slug: "accountant",
    description: "Acesso completo a Financeiro e Relatórios; somente leitura em Dashboard",
    isDefault: true,
    permissions: makePerms({
      dashboard: "read", financeiro: "full", relatorios: "full",
    }),
  },
  {
    id: "viewer",
    name: "Visualizador",
    slug: "viewer",
    description: "Somente leitura em tudo — sócios e investidores",
    isDefault: true,
    permissions: makePerms(Object.fromEntries(SYSTEM_MODULES.map((m) => [m.id, "read" as const]))),
  },
];

export const mockUsers: AppUser[] = [
  { id: "u1", name: "Usuario Proprietario", email: "usuario1@exemplo.com", profileId: "owner", farms: ["Fazenda Boa Vista", "Fazenda São José"], lastAccess: "2026-03-08T09:15:00", status: "active" },
  { id: "u2", name: "Usuario Gerente", email: "usuario2@exemplo.com", profileId: "manager", farms: ["Fazenda Boa Vista"], lastAccess: "2026-03-07T18:30:00", status: "active" },
  { id: "u3", name: "Usuario Veterinario", email: "usuario3@exemplo.com", profileId: "vet", farms: ["Fazenda Boa Vista", "Fazenda São José"], lastAccess: "2026-03-06T14:00:00", status: "active" },
  { id: "u4", name: "Usuario Campo", email: "usuario4@exemplo.com", profileId: "field", farms: ["Fazenda Boa Vista"], lastAccess: "2026-03-08T06:45:00", status: "active" },
  { id: "u5", name: "Usuario Contador", email: "usuario5@exemplo.com", profileId: "accountant", farms: ["Fazenda Boa Vista", "Fazenda São José"], lastAccess: "2026-03-05T10:00:00", status: "active" },
  { id: "u6", name: "Usuario Investidor", email: "usuario6@exemplo.com", profileId: "viewer", farms: ["Fazenda Boa Vista"], lastAccess: null, status: "pending", invitedAt: "2026-03-07T12:00:00" },
];

export const mockAuditLog: AuditEntry[] = [
  { id: "a1", timestamp: "2026-03-08T09:15:22", userId: "u1", userName: "Usuario Proprietario", action: "update", module: "Financeiro", record: "Lançamento #1042 — R$ 5.200", ip: "0.0.0.1" },
  { id: "a2", timestamp: "2026-03-08T08:30:10", userId: "u4", userName: "Usuario Campo", action: "create", module: "Rebanho", record: "Pesagem lote — 32 animais", ip: "0.0.0.2" },
  { id: "a3", timestamp: "2026-03-07T18:22:05", userId: "u2", userName: "Usuario Gerente", action: "approve", module: "Financeiro", record: "Lançamento #1039 — R$ 12.800", ip: "0.0.0.1" },
  { id: "a4", timestamp: "2026-03-07T16:10:33", userId: "u3", userName: "Usuario Veterinario", action: "create", module: "Rebanho", record: "Tratamento — BR015 Ivermectina", ip: "0.0.0.3" },
  { id: "a5", timestamp: "2026-03-07T14:05:00", userId: "u5", userName: "Usuario Contador", action: "create", module: "Relatórios", record: "Exportação LCPRD Fev/2026", ip: "0.0.0.4" },
  { id: "a6", timestamp: "2026-03-07T10:00:00", userId: "u1", userName: "Usuario Proprietario", action: "delete", module: "Rebanho", record: "Animal BR099 — Descartado", ip: "0.0.0.1" },
  { id: "a7", timestamp: "2026-03-06T09:30:00", userId: "u2", userName: "Usuario Gerente", action: "reject", module: "Financeiro", record: "Lançamento #1035 — R$ 45.000", ip: "0.0.0.1" },
  { id: "a8", timestamp: "2026-03-06T08:00:00", userId: "u4", userName: "Usuario Campo", action: "create", module: "Rebanho", record: "Ordenha grupo — 520L manhã", ip: "0.0.0.2" },
  { id: "a9", timestamp: "2026-03-05T11:20:00", userId: "u1", userName: "Usuario Proprietario", action: "login", module: "Sistema", record: "Login bem-sucedido", ip: "0.0.0.1" },
  { id: "a10", timestamp: "2026-03-05T10:05:00", userId: "u5", userName: "Usuario Contador", action: "update", module: "Financeiro", record: "Conciliação bancária — Mar/2026", ip: "0.0.0.4" },
];

export const mockPendingApprovals: PendingApproval[] = [
  { id: "pa1", description: "Compra de insumos — ração", amount: 18500, requestedBy: "u4", requestedByName: "Usuario Campo", date: "2026-03-08", module: "Financeiro", status: "pending" },
  { id: "pa2", description: "Manutenção trator John Deere", amount: 7200, requestedBy: "u2", requestedByName: "Usuario Gerente", date: "2026-03-07", module: "Financeiro", status: "pending" },
  { id: "pa3", description: "Compra de sêmen importado", amount: 32000, requestedBy: "u3", requestedByName: "Usuario Veterinario", date: "2026-03-06", module: "Rebanho", status: "pending" },
];

export interface ApprovalConfig {
  enabled: boolean;
  limitValue: number;
  approverIds: string[];
}

export const defaultApprovalConfig: ApprovalConfig = {
  enabled: true,
  limitValue: 5000,
  approverIds: ["u1", "u2"],
};
