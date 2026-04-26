import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/use-theme";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import CompanyPage from "./pages/CompanyPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import CustomersPage from "./pages/CustomersPage";
import ContactsPage from "./pages/ContactsPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

function AuthGuard() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/company" element={<CompanyPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
