import { Outlet, useLocation, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const breadcrumbMap: Record<string, { parent?: { label: string; href: string }; label: string }> = {
  "/": { label: "Dashboard" },
  "/orcamento-familiar": { label: "Orçamento Familiar" },
  "/metas": { label: "Metas Financeiras" },
  "/compras-planejadas": { label: "Compras Planejadas" },
  "/analise-gastos": { label: "Análise de Gastos" },
  "/investimentos": { label: "Investimentos" },
  "/aposentadoria": { label: "Aposentadoria" },
  "/consorcios": { label: "Consórcios" },
  "/protecao-garantias": { label: "Proteção & Garantias" },
  "/saude-financeira": { label: "Saúde Financeira" },
  "/familia": { label: "Família" },
  "/relatorios/doacoes": { parent: { label: "Relatórios", href: "#" }, label: "Doações do Exercício" },
  "/relatorios/gastos-por-pessoa": { parent: { label: "Relatórios", href: "#" }, label: "Gastos por Pessoa" },
  "/movimentacoes": { label: "Movimentações" },
  "/contas": { label: "Contas Bancárias" },
  "/importar-extrato": { parent: { label: "Financeiro", href: "#" }, label: "Importar Extrato" },
  "/dividas": { parent: { label: "Financeiro", href: "#" }, label: "Dívidas" },
  "/configuracoes": { label: "Configurações" },
};

export function AppLayout() {
  const location = useLocation();
  const crumb = breadcrumbMap[location.pathname];
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background natus-gradient">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">N</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando Natus...</p>
        </div>
      </div>
    );
  }

  if (!user && !import.meta.env.DEV) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full natus-gradient">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card/80 backdrop-blur-sm shrink-0">
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
                <h2 className="font-display text-sm font-semibold text-foreground">Natus</h2>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
