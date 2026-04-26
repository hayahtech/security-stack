import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import SKUCatalog from "@/pages/SKUCatalog";
import Warehouses from "@/pages/Warehouses";
import Movements from "@/pages/Movements";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Alerts from "@/pages/Alerts";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Receiving from "@/pages/Receiving";
import Validity from "@/pages/Validity";
import Pricing from "@/pages/Pricing";
import Logistics from "@/pages/Logistics";
import ControlTower from "@/pages/ControlTower";
import FinancialAutomation from "@/pages/FinancialAutomation";
import CostCenters from "@/pages/CostCenters";
import Forecast from "@/pages/Forecast";
import Governance from "@/pages/Governance";
import MultiCnpj from "@/pages/MultiCnpj";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/skus" element={<SKUCatalog />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/recebimento" element={<Receiving />} />
            <Route path="/validade" element={<Validity />} />
            <Route path="/precificacao" element={<Pricing />} />
            <Route path="/logistica" element={<Logistics />} />
            <Route path="/torre-controle" element={<ControlTower />} />
            <Route path="/automacao" element={<FinancialAutomation />} />
            <Route path="/centros-custo" element={<CostCenters />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/governanca" element={<Governance />} />
            <Route path="/multi-cnpj" element={<MultiCnpj />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
