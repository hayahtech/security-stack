import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ClientsList from "@/pages/clients/ClientsList";
import ClientForm from "@/pages/clients/ClientForm";
import ProjectsList from "@/pages/projects/ProjectsList";
import ProjectForm from "@/pages/projects/ProjectForm";
import ProjectDetails from "@/pages/projects/ProjectDetails";
import CalculatorPage from "@/pages/CalculatorPage";
import SettingsPage from "@/pages/SettingsPage";
import PromptsLibrary from "@/pages/PromptsLibrary";
import ScriptsLibrary from "@/pages/ScriptsLibrary";
import CodeSnippetsLibrary from "@/pages/CodeSnippetsLibrary";
import KanbanPage from "@/pages/KanbanPage";
import NotesPage from "@/pages/NotesPage";
import AgendaPage from "@/pages/AgendaPage";
import NotFound from "@/pages/NotFound";
import CronometroDashboard from "@/pages/cronometro/CronometroDashboard";
import CronometroNovoProjeto from "@/pages/cronometro/CronometroNovoProjeto";
import CronometroEditarProjeto from "@/pages/cronometro/CronometroEditarProjeto";
import CronometroRelatorios from "@/pages/cronometro/CronometroRelatorios";
import InvoicesList from "@/pages/financeiro/InvoicesList";
import InvoiceForm from "@/pages/financeiro/InvoiceForm";
import InvoiceView from "@/pages/financeiro/InvoiceView";
import TransactionsList from "@/pages/financeiro/TransactionsList";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <AppLayout><ErrorBoundary>{children}</ErrorBoundary></AppLayout>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="hayah-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><ClientsList /></ProtectedRoute>} />
            <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
            <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
            <Route path="/projects/new" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
            <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/prompts" element={<ProtectedRoute><PromptsLibrary /></ProtectedRoute>} />
            <Route path="/scripts" element={<ProtectedRoute><ScriptsLibrary /></ProtectedRoute>} />
            <Route path="/snippets" element={<ProtectedRoute><CodeSnippetsLibrary /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/cronometro" element={<ProtectedRoute><CronometroDashboard /></ProtectedRoute>} />
            <Route path="/cronometro/novo" element={<ProtectedRoute><CronometroNovoProjeto /></ProtectedRoute>} />
            <Route path="/cronometro/:id/editar" element={<ProtectedRoute><CronometroEditarProjeto /></ProtectedRoute>} />
            <Route path="/cronometro/relatorios" element={<ProtectedRoute><CronometroRelatorios /></ProtectedRoute>} />
            <Route path="/financeiro/faturas" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
            <Route path="/financeiro/faturas/nova" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
            <Route path="/financeiro/faturas/:id" element={<ProtectedRoute><InvoiceView /></ProtectedRoute>} />
            <Route path="/financeiro/faturas/:id/editar" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
            <Route path="/financeiro/transacoes" element={<ProtectedRoute><TransactionsList /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
