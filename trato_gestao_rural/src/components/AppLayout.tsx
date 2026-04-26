import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { NotificationBell } from "@/components/NotificationBell";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { GlobalScannerButton } from "@/components/GlobalScanner";
import { RebanhoFloatingScanner } from "@/components/RebanhoScanner";
import { DeviceStatusIndicator } from "@/components/DeviceStatusIndicator";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useAuth } from "@/hooks/useAuth";
import { useSecurityGuard } from "@/hooks/useSecurityGuard";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const breadcrumbMap: Record<string, { parent?: { label: string; href: string }; label: string }> = {
  "/": { label: "Dashboard" },
  "/financeiro/fluxo-de-caixa": { parent: { label: "Financeiro", href: "#" }, label: "Fluxo de Caixa" },
  "/financeiro/contas-cartoes": { parent: { label: "Financeiro", href: "#" }, label: "Contas & Cartões" },
  "/financeiro/pagar-receber": { parent: { label: "Financeiro", href: "#" }, label: "A Pagar & Receber" },
  "/financeiro/importar-extrato": { parent: { label: "Financeiro", href: "#" }, label: "Importar Extrato" },
  "/financeiro/despesas-custos": { parent: { label: "Financeiro", href: "#" }, label: "Despesas & Custos" },
  "/financeiro/dre": { parent: { label: "Financeiro", href: "#" }, label: "DRE" },
  "/financeiro/dfc": { parent: { label: "Financeiro", href: "#" }, label: "DFC" },
  "/fazenda/operacoes-campo": { parent: { label: "Fazenda", href: "#" }, label: "Operações de Campo" },
  "/fazenda/zonas-manejo": { parent: { label: "Fazenda", href: "#" }, label: "Zonas de Manejo (VRA)" },
  "/fazenda/ndvi": { parent: { label: "Fazenda", href: "#" }, label: "Mapa NDVI" },
  "/fazenda/telemetria": { parent: { label: "Fazenda", href: "#" }, label: "Telemetria de Voo" },
  "/fazenda/missao-drone": { parent: { label: "Fazenda", href: "#" }, label: "Planejador de Missão" },
  "/fazenda/minhas-fazendas": { parent: { label: "Fazenda", href: "#" }, label: "Minhas Fazendas" },
  "/fazenda/propriedades": { parent: { label: "Fazenda", href: "#" }, label: "Propriedades" },
  "/fazenda/estoque": { parent: { label: "Fazenda", href: "#" }, label: "Estoque" },
  "/fazenda/maquinas": { parent: { label: "Fazenda", href: "#" }, label: "Máquinas & Manutenção" },
  "/fazenda/mercado": { parent: { label: "Fazenda", href: "#" }, label: "Mercado — Arroba" },
  "/rebanho/animais": { parent: { label: "Rebanho", href: "#" }, label: "Animais" },
  "/rebanho/adicionar": { parent: { label: "Rebanho", href: "/rebanho/animais" }, label: "Adicionar Animal" },
  "/rebanho/pesagens": { parent: { label: "Rebanho", href: "#" }, label: "Pesagens" },
  "/rebanho/pesagens/lote": { parent: { label: "Rebanho", href: "/rebanho/pesagens" }, label: "Pesagem em Lote" },
  "/rebanho/movimentacoes": { parent: { label: "Rebanho", href: "#" }, label: "Movimentações" },
  "/rebanho/tratamentos": { parent: { label: "Rebanho", href: "#" }, label: "Tratamentos" },
  "/rebanho/reproducao": { parent: { label: "Rebanho", href: "#" }, label: "Reprodução" },
  "/rebanho/leite": { parent: { label: "Rebanho", href: "#" }, label: "Leite" },
  "/atividades": { label: "Atividades" },
  "/pastos": { label: "Pastos" },
  "/pastos/forragem": { parent: { label: "Pastos", href: "/pastos" }, label: "Forragem & Plantio" },
  "/funcionarios": { label: "Funcionários" },
  "/relatorios": { label: "Relatórios" },
  "/historico": { label: "Histórico" },
  "/calendario": { label: "Calendário" },
  "/contato": { label: "Contatos" },
  "/contato/parceiros": { parent: { label: "Contatos", href: "/contato" }, label: "Parceiros & Fornecedores" },
  "/configuracoes": { label: "Configurações" },
  "/configuracoes/leitores-balanca": { parent: { label: "Configurações", href: "/configuracoes" }, label: "Leitores & Balança" },
};

export function AppLayout() {
  const location = useLocation();
  const crumb = breadcrumbMap[location.pathname];
  const { status, pendingCount, doSync } = useNetworkStatus();
  const { user, loading } = useAuth();
  const { completed: onboardingCompleted } = useOnboarding();

  // Ativa proteção de segurança (DevTools, F12, right-click) em produção
  useSecurityGuard();

  // Aguarda verificação de sessão antes de redirecionar
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Redireciona para /login se não autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redireciona para /onboarding se o usuário não concluiu a configuração inicial
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-3" aria-label="Alternar sidebar" />
            <div className="flex-1 min-w-0">
              {crumb ? (
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/">Início</BreadcrumbLink>
                    </BreadcrumbItem>
                    {crumb.parent && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink href={crumb.parent.href}>{crumb.parent.label}</BreadcrumbLink>
                        </BreadcrumbItem>
                      </>
                    )}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              ) : (
                <h2 className="font-display text-sm font-semibold text-foreground">AgroFinance Pro</h2>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DeviceStatusIndicator />
              <GlobalScannerButton />
              <NetworkStatusIndicator status={status} pendingCount={pendingCount} onSync={doSync} />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
      <PWAInstallBanner />
      <RebanhoFloatingScanner />
    </SidebarProvider>
  );
}
