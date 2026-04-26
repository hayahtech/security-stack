import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ScopeProvider } from "@/contexts/ScopeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Revenue from "./pages/Revenue";
import OperationalExpenses from "./pages/OperationalExpenses";
import FixedExpenses from "./pages/FixedExpenses";
import TaxesPage from "./pages/TaxesPage";
import MarketingPage from "./pages/MarketingPage";
import CampaignDetailPage from "./pages/CampaignDetailPage";
import PersonalExpenses from "./pages/PersonalExpenses";
import LoansPage from "./pages/LoansPage";
import StockPage from "./pages/StockPage";
import SuppliersPage from "./pages/SuppliersPage";
import EmployeesPage from "./pages/EmployeesPage";
import CashFlowPage from "./pages/CashFlowPage";
import SalesPage from "./pages/SalesPage";
import MenuPage from "./pages/MenuPage";
import RecipesPage from "./pages/RecipesPage";
import PerformancePage from "./pages/PerformancePage";
import DemandForecastPage from "./pages/DemandForecastPage";
import DeliveryZonesPage from "./pages/DeliveryZonesPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import LoyaltyPage from "./pages/LoyaltyPage";
import CashRegisterPage from "./pages/CashRegisterPage";
import SanitaryPage from "./pages/SanitaryPage";
import ReviewsPage from "./pages/ReviewsPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PublicMenuPage from "./pages/PublicMenuPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import ReportsPage from "./pages/ReportsPage";
import InstallPage from "./pages/InstallPage";
import StockEntryPage from "./pages/StockEntryPage";
import InventoryPage from "./pages/InventoryPage";
import CustomerLoyaltyPage from "./pages/CustomerLoyaltyPage";
import CMVPage from "./pages/CMVPage";
import BalanceSheetPage from "./pages/BalanceSheetPage";
import EquipmentPage from "./pages/EquipmentPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import TablesPage from "./pages/TablesPage";
import DeliveryPage from "./pages/DeliveryPage";
import TeamPage from "./pages/TeamPage";
import BillsPage from "./pages/BillsPage";
import AuditPage from "./pages/AuditPage";
import ReservationsPage from "./pages/ReservationsPage";
import CostCenterPage from "./pages/CostCenterPage";
import TimeTrackingPage from "./pages/TimeTrackingPage";
import BudgetPage from "./pages/BudgetPage";
import ReconciliationPage from "./pages/ReconciliationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <RestaurantProvider>
        <ScopeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/menu/:slug" element={<PublicMenuPage />} />
                <Route path="/cliente/:token" element={<CustomerLoyaltyPage />} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/*" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/receitas" element={<Revenue />} />
                        <Route path="/despesas-operacionais" element={<OperationalExpenses />} />
                        <Route path="/despesas-fixas" element={<FixedExpenses />} />
                        <Route path="/taxas" element={<TaxesPage />} />
                        <Route path="/marketing" element={<MarketingPage />} />
                        <Route path="/marketing/:id" element={<CampaignDetailPage />} />
                        <Route path="/pessoal" element={<PersonalExpenses />} />
                        <Route path="/emprestimos" element={<LoansPage />} />
                        <Route path="/estoque" element={<StockPage />} />
                        <Route path="/estoque/entrada" element={<StockEntryPage />} />
                        <Route path="/estoque/inventario" element={<InventoryPage />} />
                        <Route path="/fornecedores" element={<SuppliersPage />} />
                        <Route path="/funcionarios" element={<EmployeesPage />} />
                        <Route path="/fluxo-de-caixa" element={<CashFlowPage />} />
                        <Route path="/vendas" element={<SalesPage />} />
                        <Route path="/cardapio" element={<MenuPage />} />
                        <Route path="/fichas-tecnicas" element={<RecipesPage />} />
                        <Route path="/desempenho" element={<PerformancePage />} />
                        <Route path="/clientes" element={<CustomersPage />} />
                        <Route path="/clientes/:id" element={<CustomerProfilePage />} />
                        <Route path="/fidelidade" element={<LoyaltyPage />} />
                        <Route path="/caixa" element={<CashRegisterPage />} />
                        <Route path="/sanitario" element={<SanitaryPage />} />
                        <Route path="/avaliacoes" element={<ReviewsPage />} />
                        <Route path="/previsao-demanda" element={<DemandForecastPage />} />
                        <Route path="/zonas-entrega" element={<DeliveryZonesPage />} />
                        <Route path="/notificacoes" element={<NotificationSettingsPage />} />
                        <Route path="/cmv" element={<CMVPage />} />
                        <Route path="/balanco" element={<BalanceSheetPage />} />
                        <Route path="/equipamentos" element={<EquipmentPage />} />
                        <Route path="/equipamentos/:id" element={<EquipmentDetailPage />} />
                        <Route path="/mesas" element={<TablesPage />} />
                        <Route path="/delivery" element={<DeliveryPage />} />
                        <Route path="/contas" element={<BillsPage />} />
                        <Route path="/auditoria" element={<AuditPage />} />
                        <Route path="/reservas" element={<ReservationsPage />} />
                        <Route path="/centro-custos" element={<CostCenterPage />} />
                        <Route path="/ponto" element={<TimeTrackingPage />} />
                        <Route path="/orcamento" element={<BudgetPage />} />
                        <Route path="/conciliacao" element={<ReconciliationPage />} />
                        <Route path="/configuracoes/equipe" element={<TeamPage />} />
                        <Route path="/relatorios" element={<ReportsPage />} />
                        <Route path="/instalar" element={<InstallPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ScopeProvider>
        </RestaurantProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
