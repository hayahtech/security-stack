import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { KevarShell } from "@/components/KevarShell";
import DashboardPage from "@/pages/DashboardPage";
import ProcessamentoPage from "@/pages/folha/ProcessamentoPage";
import RubricasPage from "@/pages/folha/RubricasPage";
import HoleritesPage from "@/pages/folha/HoleritesPage";
import AdiantamentosPage from "@/pages/folha/AdiantamentosPage";
import NovaAdmissaoPage from "@/pages/admissoes/NovaAdmissaoPage";
import RescisoesPage from "@/pages/admissoes/RescisoesPage";
import ContratosPage from "@/pages/admissoes/ContratosPage";
import EventosPendentesPage from "@/pages/esocial/EventosPendentesPage";
import TransmissaoPage from "@/pages/esocial/TransmissaoPage";
import MonitorErrosPage from "@/pages/esocial/MonitorErrosPage";
import InssPage from "@/pages/encargos/InssPage";
import FgtsPage from "@/pages/encargos/FgtsPage";
import IrrfPage from "@/pages/encargos/IrrfPage";
import DarfPage from "@/pages/encargos/DarfPage";
import FeriasPage from "@/pages/FeriasPage";
import RelatoriosPage from "@/pages/RelatoriosPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <KevarShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/folha" element={<ProcessamentoPage />} />
              <Route path="/folha/processamento" element={<ProcessamentoPage />} />
              <Route path="/folha/rubricas" element={<RubricasPage />} />
              <Route path="/folha/holerites" element={<HoleritesPage />} />
              <Route path="/folha/adiantamentos" element={<AdiantamentosPage />} />
              <Route path="/admissoes" element={<NovaAdmissaoPage />} />
              <Route path="/admissoes/nova" element={<NovaAdmissaoPage />} />
              <Route path="/admissoes/rescisoes" element={<RescisoesPage />} />
              <Route path="/admissoes/contratos" element={<ContratosPage />} />
              <Route path="/esocial" element={<EventosPendentesPage />} />
              <Route path="/esocial/pendentes" element={<EventosPendentesPage />} />
              <Route path="/esocial/transmissao" element={<TransmissaoPage />} />
              <Route path="/esocial/erros" element={<MonitorErrosPage />} />
              <Route path="/encargos" element={<InssPage />} />
              <Route path="/encargos/inss" element={<InssPage />} />
              <Route path="/encargos/fgts" element={<FgtsPage />} />
              <Route path="/encargos/irrf" element={<IrrfPage />} />
              <Route path="/encargos/darf" element={<DarfPage />} />
              <Route path="/ferias" element={<FeriasPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/configuracoes" element={<PlaceholderPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </KevarShell>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
