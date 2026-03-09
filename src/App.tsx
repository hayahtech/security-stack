import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
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
            <Route path="/dre" element={<PlaceholderPage />} />
            <Route path="/fluxo-caixa" element={<PlaceholderPage />} />
            <Route path="/contas" element={<PlaceholderPage />} />
            <Route path="/liquidez" element={<PlaceholderPage />} />
            <Route path="/capital-giro" element={<PlaceholderPage />} />
            <Route path="/margem" element={<PlaceholderPage />} />
            <Route path="/ciclo" element={<PlaceholderPage />} />
            <Route path="/inadimplencia" element={<PlaceholderPage />} />
            <Route path="/tesouraria" element={<PlaceholderPage />} />
            <Route path="/conciliacao" element={<PlaceholderPage />} />
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
