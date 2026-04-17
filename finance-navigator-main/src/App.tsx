import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Dre from "./pages/Dre";
import BalancoPatrimonial from "./pages/BalancoPatrimonial";
import FluxoCaixa from "./pages/FluxoCaixa";
import Tesouraria from "./pages/Tesouraria";
import ConciliacaoBancaria from "./pages/ConciliacaoBancaria";
import Contas from "./pages/Contas";
import Contratos from "./pages/Contratos";
import Inadimplencia from "./pages/Inadimplencia";
import Liquidez from "./pages/Liquidez";
import Margem from "./pages/Margem";
import CicloFinanceiro from "./pages/CicloFinanceiro";
import CMV from "./pages/CMV";
import KpisRoi from "./pages/KpisRoi";
import KpisAvancados from "./pages/KpisAvancados";
import AnaliseRiscos from "./pages/AnaliseRiscos";
import Projecoes from "./pages/Projecoes";
import NFePage from "./pages/NFe";
import Custos from "./pages/Custos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import CapturaAutomatica from "./pages/CapturaAutomatica";
import CentrosCusto from "./pages/CentrosCusto";
import Governanca from "./pages/Governanca";
import Integracoes from "./pages/Integracoes";
import Orcamento from "./pages/Orcamento";
import SaudeFinanceira from "./pages/SaudeFinanceira";
import PlaceholderPage from "./pages/PlaceholderPage";
import PlanoContas from "./pages/PlanoContas";
import DiarioContabil from "./pages/DiarioContabil";
import ReguaCobranca from "./pages/ReguaCobranca";
import SegurancaConformidade from "./pages/SegurancaConformidade";
import Onboarding from "./pages/Onboarding";
import ImportarDados from "./pages/ImportarDados";
import Provisoes from "./pages/Provisoes";
import Imobilizado from "./pages/Imobilizado";
import CentralCredito from "./pages/CentralCredito";
import Socios from "./pages/Socios";
import Precificacao from "./pages/Precificacao";
import ProjetosFinanceiros from "./pages/ProjetosFinanceiros";
import Metas from "./pages/Metas";
import NotFound from "./pages/NotFound";
import { HealthPage } from "./pages/Health";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dre" element={<Dre />} />
            <Route path="/balanco" element={<BalancoPatrimonial />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/liquidez" element={<Liquidez />} />
            <Route path="/capital-giro" element={<Liquidez />} />
            <Route path="/margem" element={<Margem />} />
            <Route path="/ciclo" element={<CicloFinanceiro />} />
            <Route path="/inadimplencia" element={<Inadimplencia />} />
            <Route path="/tesouraria" element={<Tesouraria />} />
            <Route path="/conciliacao" element={<ConciliacaoBancaria />} />
            <Route path="/custos" element={<Custos />} />
            <Route path="/cmv" element={<CMV />} />
            <Route path="/kpis" element={<KpisAvancados />} />
            <Route path="/analise-hv" element={<PlaceholderPage />} />
            <Route path="/projecoes" element={<Projecoes />} />
            <Route path="/riscos" element={<AnaliseRiscos />} />
            <Route path="/nfe" element={<NFePage />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/captura" element={<CapturaAutomatica />} />
            <Route path="/centros-custo" element={<CentrosCusto />} />
            <Route path="/governanca" element={<Governanca />} />
            <Route path="/integracoes" element={<Integracoes />} />
            <Route path="/orcamento" element={<Orcamento />} />
            <Route path="/saude" element={<SaudeFinanceira />} />
            <Route path="/plano-contas" element={<PlanoContas />} />
            <Route path="/diario-contabil" element={<DiarioContabil />} />
            <Route path="/cobranca" element={<ReguaCobranca />} />
            <Route path="/seguranca" element={<SegurancaConformidade />} />
            <Route path="/provisoes" element={<Provisoes />} />
            <Route path="/imobilizado" element={<Imobilizado />} />
            <Route path="/credito" element={<CentralCredito />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/precificacao" element={<Precificacao />} />
            <Route path="/projetos" element={<ProjetosFinanceiros />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/importar" element={<ImportarDados />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
