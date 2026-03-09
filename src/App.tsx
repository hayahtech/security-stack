import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Dre from "./pages/Dre";
import FluxoCaixa from "./pages/FluxoCaixa";
import Tesouraria from "./pages/Tesouraria";
import ConciliacaoBancaria from "./pages/ConciliacaoBancaria";
import Contas from "./pages/Contas";
import Inadimplencia from "./pages/Inadimplencia";
import Liquidez from "./pages/Liquidez";
import Margem from "./pages/Margem";
import CicloFinanceiro from "./pages/CicloFinanceiro";
import CMV from "./pages/CMV";
import KpisRoi from "./pages/KpisRoi";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dre" element={<Dre />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/liquidez" element={<Liquidez />} />
            <Route path="/capital-giro" element={<Liquidez />} />
            <Route path="/margem" element={<PlaceholderPage />} />
            <Route path="/ciclo" element={<PlaceholderPage />} />
            <Route path="/inadimplencia" element={<Inadimplencia />} />
            <Route path="/tesouraria" element={<Tesouraria />} />
            <Route path="/conciliacao" element={<ConciliacaoBancaria />} />
            <Route path="/custos" element={<PlaceholderPage />} />
            <Route path="/cmv" element={<PlaceholderPage />} />
            <Route path="/kpis" element={<PlaceholderPage />} />
            <Route path="/analise-hv" element={<PlaceholderPage />} />
            <Route path="/projecoes" element={<PlaceholderPage />} />
            <Route path="/riscos" element={<PlaceholderPage />} />
            <Route path="/nfe" element={<PlaceholderPage />} />
            <Route path="/relatorios" element={<PlaceholderPage />} />
            <Route path="/configuracoes" element={<PlaceholderPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
