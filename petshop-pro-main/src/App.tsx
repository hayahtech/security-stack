import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "@/components/AdminLayout";
import PetDetailPage from "@/pages/PetDetailPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientesPage from "@/pages/ClientesPage";
import PetsPage from "@/pages/PetsPage";
import ProdutosPage from "@/pages/ProdutosPage";
import ServicosPage from "@/pages/ServicosPage";
import VendasPage from "@/pages/VendasPage";
import EstoquePage from "@/pages/EstoquePage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/pets" element={<PetsPage />} />
                  <Route path="/pets/:id" element={<PetDetailPage />} />
                  <Route path="/produtos" element={<ProdutosPage />} />
                  <Route path="/servicos" element={<ServicosPage />} />
                  <Route path="/estoque" element={<EstoquePage />} />
                  <Route path="/vendas" element={<VendasPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AdminLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
