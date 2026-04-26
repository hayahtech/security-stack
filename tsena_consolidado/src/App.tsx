import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppModeProvider } from "@/contexts/AppModeContext";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import VisitorsPage from "@/pages/VisitorsPage";
import VehiclesPage from "@/pages/VehiclesPage";
import BlacklistPage from "@/pages/BlacklistPage";
import DeliveriesPage from "@/pages/DeliveriesPage";
import NfePage from "@/pages/NfePage";
import ScalePage from "@/pages/ScalePage";
import YardPage from "@/pages/YardPage";
import SstPage from "@/pages/SstPage";
import SorteioPage from "@/pages/SorteioPage";
import RefeitoryPage from "@/pages/RefeitoryPage";
import ReportsPage from "@/pages/ReportsPage";
import CadastrosPage from "@/pages/CadastrosPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AppModeProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/visitantes" element={<VisitorsPage />} />
              <Route path="/veiculos" element={<VehiclesPage />} />
              <Route path="/blacklist" element={<BlacklistPage />} />
              <Route path="/entregas" element={<DeliveriesPage />} />
              <Route path="/nfe" element={<NfePage />} />
              <Route path="/balanca" element={<ScalePage />} />
              <Route path="/patio" element={<YardPage />} />
              <Route path="/sst" element={<SstPage />} />
              <Route path="/sorteio" element={<SorteioPage />} />
              <Route path="/refeitorio" element={<RefeitoryPage />} />
              <Route path="/cadastros" element={<CadastrosPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
