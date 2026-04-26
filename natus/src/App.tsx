import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";

// Páginas
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";

// Financeiro pessoal
import OrcamentoFamiliar from "@/pages/financeiro/OrcamentoFamiliar";
import ComprasPlanejadas from "@/pages/financeiro/ComprasPlanejadas";
import Investimentos from "@/pages/financeiro/Investimentos";
import Aposentadoria from "@/pages/financeiro/Aposentadoria";
import SaudeFinanceira from "@/pages/financeiro/SaudeFinanceira";
import AnaliseGastos from "@/pages/financeiro/AnaliseGastos";
import Familia from "@/pages/financeiro/Familia";
import ProtecaoGarantias from "@/pages/financeiro/ProtecaoGarantias";
import MetasFinanceiras from "@/pages/financeiro/MetasFinanceiras";
import Consorcios from "@/pages/financeiro/Consorcios";

import ImportarExtrato from "@/pages/financeiro/ImportarExtrato";
import Dividas from "@/pages/financeiro/Dividas";
import Movimentacoes from "@/pages/financeiro/Movimentacoes";
import Contas from "@/pages/financeiro/Contas";

// Relatórios pessoais
import DoacoesExercicio from "@/pages/relatorios/DoacoesExercicio";
import GastosPorPessoa from "@/pages/relatorios/GastosPorPessoa";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />

                    {/* Financeiro Pessoal */}
                    <Route path="/orcamento-familiar" element={<OrcamentoFamiliar />} />
                    <Route path="/compras-planejadas" element={<ComprasPlanejadas />} />
                    <Route path="/investimentos" element={<Investimentos />} />
                    <Route path="/aposentadoria" element={<Aposentadoria />} />
                    <Route path="/saude-financeira" element={<SaudeFinanceira />} />
                    <Route path="/analise-gastos" element={<AnaliseGastos />} />
                    <Route path="/familia" element={<Familia />} />
                    <Route path="/protecao-garantias" element={<ProtecaoGarantias />} />
                    <Route path="/metas" element={<MetasFinanceiras />} />
                    <Route path="/consorcios" element={<Consorcios />} />
                    <Route path="/importar-extrato" element={<ImportarExtrato />} />
                    <Route path="/dividas" element={<Dividas />} />
                    <Route path="/movimentacoes" element={<Movimentacoes />} />
                    <Route path="/contas" element={<Contas />} />

                    {/* Relatórios */}
                    <Route path="/relatorios/doacoes" element={<DoacoesExercicio />} />
                    <Route path="/relatorios/gastos-por-pessoa" element={<GastosPorPessoa />} />
                  </Route>

                  <Route path="/login" element={<Login />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
