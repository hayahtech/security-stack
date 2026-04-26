import React, { createContext, useContext, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────
export type NotificationSeverity = "urgente" | "atencao" | "informativo" | "sucesso";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  description?: string;
  icon: string; // lucide icon name key
  timestamp: string; // ISO
  read: boolean;
  link?: string; // route to navigate
  category: string;
}

export interface NotificationSettings {
  urgente: boolean;
  atencao: boolean;
  informativo: boolean;
  sucesso: boolean;
  antecedenciaVencimento: number; // days
  emailFrequency: "imediata" | "diario" | "semanal" | "desativado";
}

const defaultSettings: NotificationSettings = {
  urgente: true, atencao: true, informativo: true, sucesso: true,
  antecedenciaVencimento: 3,
  emailFrequency: "diario",
};

// ── Mock notifications ─────────────────────────────────────
const now = new Date("2026-03-08T14:30:00");
function hoursAgo(h: number) { return new Date(now.getTime() - h * 3600000).toISOString(); }
function daysAgo(d: number) { return new Date(now.getTime() - d * 86400000).toISOString(); }

const mockNotifications: AppNotification[] = [
  // Urgente (red)
  { id: "n1", severity: "urgente", title: "Conta de energia vencida há 5 dias", description: "Vencimento: 03/03/2026 — R$ 1.850,00", icon: "wallet", timestamp: hoursAgo(2), read: false, link: "/financeiro/pagar-receber", category: "financeiro" },
  { id: "n2", severity: "urgente", title: "Estoque zerado: Vermífugo Ivermectina", description: "Reposição necessária imediatamente", icon: "package", timestamp: hoursAgo(5), read: false, link: "/fazenda/estoque", category: "estoque" },
  { id: "n3", severity: "urgente", title: "Animal óbito registrado — BR045", description: "Causa: complicação respiratória", icon: "beef", timestamp: hoursAgo(8), read: false, link: "/rebanho/animais", category: "rebanho" },

  // Atenção (orange)
  { id: "n4", severity: "atencao", title: "Parcela de financiamento vence em 3 dias", description: "Vencimento: 11/03/2026 — R$ 4.200,00", icon: "wallet", timestamp: hoursAgo(1), read: false, link: "/financeiro/pagar-receber", category: "financeiro" },
  { id: "n5", severity: "atencao", title: "12 animais em período de carência", description: "Lote #137 — carência até 15/03/2026", icon: "shield-alert", timestamp: hoursAgo(3), read: false, link: "/rebanho/carencia", category: "rebanho" },
  { id: "n6", severity: "atencao", title: "Estoque baixo: Sal Mineral", description: "Atual: 15 kg — Mínimo: 50 kg", icon: "package", timestamp: hoursAgo(6), read: false, link: "/fazenda/estoque", category: "estoque" },
  { id: "n7", severity: "atencao", title: "Projeção: saldo negativo em 5 dias", description: "Conta Itaú: saldo projetado -R$ 2.300", icon: "trending-down", timestamp: hoursAgo(10), read: true, link: "/financeiro/projecao", category: "financeiro" },
  { id: "n8", severity: "atencao", title: "Manutenção pendente: Ordenhadeira DeLaval", description: "Revisão semestral em andamento", icon: "wrench", timestamp: daysAgo(1), read: true, link: "/fazenda/maquinas", category: "fazenda" },

  // Informativo (yellow)
  { id: "n9", severity: "informativo", title: "Conta de internet vence em 7 dias", description: "Vencimento: 15/03/2026 — R$ 289,90", icon: "wallet", timestamp: hoursAgo(4), read: false, link: "/financeiro/pagar-receber", category: "financeiro" },
  { id: "n10", severity: "informativo", title: "Vacina de brucelose programada para esta semana", description: "Lote #140 — 28 animais", icon: "syringe", timestamp: hoursAgo(12), read: false, link: "/rebanho/tratamentos", category: "rebanho" },
  { id: "n11", severity: "informativo", title: "Parto previsto nos próximos 5 dias", description: "Vaca BR012 — 2º parto", icon: "baby", timestamp: daysAgo(1), read: true, link: "/rebanho/reproducao", category: "rebanho" },
  { id: "n12", severity: "informativo", title: "Novo extrato disponível para importar", description: "Banco Itaú — período 01/03 a 07/03", icon: "file-down", timestamp: daysAgo(1), read: true, link: "/financeiro/importar-extrato", category: "financeiro" },
  { id: "n13", severity: "informativo", title: "Preço da arroba em alta: R$ 262/@", description: "+3.2% vs última semana", icon: "trending-up", timestamp: daysAgo(2), read: true, link: "/fazenda/mercado", category: "mercado" },

  // Sucesso (green)
  { id: "n14", severity: "sucesso", title: "Pagamento registrado: Ração Nutrifarm", description: "R$ 12.800,00 — Conta Itaú", icon: "check-circle", timestamp: hoursAgo(1), read: false, link: "/financeiro/fluxo-de-caixa", category: "financeiro" },
  { id: "n15", severity: "sucesso", title: "Conciliação bancária concluída", description: "Março 2026 — 47 transações conciliadas", icon: "check-circle", timestamp: daysAgo(1), read: true, link: "/financeiro/conciliacao", category: "financeiro" },
  { id: "n16", severity: "sucesso", title: "Meta de despesas: dentro do limite", description: "Despesas operacionais a 78% do orçamento", icon: "target", timestamp: daysAgo(2), read: true, link: "/financeiro/orcamento", category: "financeiro" },
  { id: "n17", severity: "sucesso", title: "Pesagem em lote concluída", description: "Lote #139 — 32 animais pesados", icon: "weight", timestamp: daysAgo(3), read: true, link: "/rebanho/pesagens", category: "rebanho" },
];

// ── Context ────────────────────────────────────────────────
interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  settings: NotificationSettings;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  updateSettings: (s: Partial<NotificationSettings>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem("notification_settings");
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch { return defaultSettings; }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateSettings = useCallback((partial: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("notification_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, settings, markAsRead, markAllAsRead, updateSettings }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

// ── Helpers ────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  const diff = new Date("2026-03-08T14:30:00").getTime() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export const severityConfig: Record<NotificationSeverity, { label: string; color: string; bg: string; dot: string }> = {
  urgente: { label: "Urgente", color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
  atencao: { label: "Atenção", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", dot: "bg-yellow-500" },
  informativo: { label: "Informativo", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  sucesso: { label: "Sucesso", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
};
