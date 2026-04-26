import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { FazendaProvider } from "@/contexts/FazendaContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";

import Dashboard from "@/pages/Dashboard";
import FluxoDeCaixa from "@/pages/financeiro/FluxoDeCaixa";
import ContasCartoes from "@/pages/financeiro/ContasCartoes";
import PagarReceber from "@/pages/financeiro/PagarReceber";
import ImportarExtrato from "@/pages/financeiro/ImportarExtrato";
import DespesasCustos from "@/pages/financeiro/DespesasCustos";
import DREPage from "@/pages/financeiro/DREPage";
import DFCPage from "@/pages/financeiro/DFCPage";
import ConciliacaoBancaria from "@/pages/financeiro/ConciliacaoBancaria";
import Orcamento from "@/pages/financeiro/Orcamento";
import ProjecaoCaixa from "@/pages/financeiro/ProjecaoCaixa";
import MinhasFazendas from "@/pages/fazenda/MinhasFazendas";
import Propriedades from "@/pages/fazenda/Propriedades";
import Animais from "@/pages/rebanho/Animais";
import AdicionarAnimal from "@/pages/rebanho/AdicionarAnimal";
import AnimalDetail from "@/pages/rebanho/AnimalDetail";
import Pesagens from "@/pages/rebanho/Pesagens";
import PesagemLote from "@/pages/rebanho/PesagemLote";
import Movimentacoes from "@/pages/rebanho/Movimentacoes";
import Tratamentos from "@/pages/rebanho/Tratamentos";
import Reproducao from "@/pages/rebanho/Reproducao";
import Leite from "@/pages/rebanho/Leite";
import GmdReport from "@/pages/rebanho/GmdReport";
import Carencia from "@/pages/rebanho/Carencia";
import Estoque from "@/pages/fazenda/Estoque";
import EstoqueMovimentacoes from "@/pages/fazenda/EstoqueMovimentacoes";
import ReceberXml from "@/pages/fazenda/ReceberXml";
import Maquinas from "@/pages/fazenda/Maquinas";
import MaquinaDetail from "@/pages/fazenda/MaquinaDetail";
import Mercado from "@/pages/fazenda/Mercado";
import Atividades from "@/pages/Atividades";
import Pastos from "@/pages/Pastos";
import ForragemPlantio from "@/pages/ForragemPlantio";
import Funcionarios from "@/pages/Funcionarios";
import Relatorios from "@/pages/Relatorios";
import Historico from "@/pages/Historico";
import Calendario from "@/pages/Calendario";
import Contato from "@/pages/Contato";
import Configuracoes from "@/pages/Configuracoes";
import Parceiros from "@/pages/contato/Parceiros";
import ParceiroDetail from "@/pages/contato/ParceiroDetail";
import NotFound from "@/pages/NotFound";
import Notificacoes from "@/pages/Notificacoes";
import Piscicultura from "@/pages/producao/Piscicultura";
import Agricultura from "@/pages/producao/Agricultura";
import Financiamentos from "@/pages/financeiro/Financiamentos";
import FinanciamentoDetail from "@/pages/financeiro/FinanciamentoDetail";
import CreditoRural from "@/pages/financeiro/CreditoRural";
import Patrimonio from "@/pages/financeiro/Patrimonio";
import LeasingPage from "@/pages/financeiro/LeasingPage";
// Módulos PF removidos → ver projeto Natus
import AnaliseEconomica from "@/pages/relatorios/AnaliseEconomica";
import PosicaoFinanciamentos from "@/pages/relatorios/PosicaoFinanciamentos";
import LcprdPage from "@/pages/relatorios/LcprdPage";
import OperacoesCampo from "@/pages/fazenda/OperacoesCampo";
import ZonasManejo from "@/pages/fazenda/ZonasManejo";
import MapaNDVI from "@/pages/fazenda/MapaNDVI";
import TelemetriaPage from "@/pages/fazenda/TelemetriaPage";
import MissaoDrone from "@/pages/fazenda/MissaoDrone";
import MdfePage from "@/pages/fazenda/MdfePage";
import NfeSaidaPage from "@/pages/fazenda/NfeSaidaPage";
import CentralNfePage from "@/pages/fazenda/CentralNfePage";
import CategoriasRastreamento from "@/pages/configuracoes/CategoriasRastreamento";
import UsuariosPermissoes from "@/pages/configuracoes/UsuariosPermissoes";
import LogAuditoria from "@/pages/configuracoes/LogAuditoria";
import Aprovacoes from "@/pages/configuracoes/Aprovacoes";
import ModoCampo from "@/pages/configuracoes/ModoCampo";
// DoacoesExercicio e GastosPorPessoa → ver projeto Natus
import Clima from "@/pages/fazenda/Clima";
import HistoricoArroba from "@/pages/fazenda/HistoricoArroba";
import HistoricoPluviometrico from "@/pages/fazenda/HistoricoPluviometrico";
import GtaPage from "@/pages/fazenda/GtaPage";
import MapaFazenda from "@/pages/fazenda/MapaFazenda";
import SisbovPage from "@/pages/rebanho/SisbovPage";
import PegadaCarbono from "@/pages/fazenda/PegadaCarbono";
import CmvPage from "@/pages/financeiro/CmvPage";
import LeitoresBalanca from "@/pages/configuracoes/LeitoresBalanca";
import OpenFinance from "@/pages/configuracoes/OpenFinance";
import RevisaoTransacoes from "@/pages/financeiro/RevisaoTransacoes";
import NotificacoesPush from "@/pages/configuracoes/NotificacoesPush";
import { PushPermissionModal } from "@/components/PushPermissionModal";
import Onboarding from "@/pages/Onboarding";
import PrivacidadePage from "@/pages/PrivacidadePage";
import Login from "@/pages/Login";
import TestE2E from "@/pages/TestE2E";
import InfraE2EStatus from "@/pages/InfraE2EStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <FazendaProvider>
            <DeviceProvider>
              <NotificationProvider>
                <TooltipProvider>
          <Toaster />
          <Sonner />
          <PushPermissionModal />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/financeiro/fluxo-de-caixa" element={<FluxoDeCaixa />} />
                <Route path="/financeiro/contas-cartoes" element={<ContasCartoes />} />
                <Route path="/financeiro/pagar-receber" element={<PagarReceber />} />
                <Route path="/financeiro/importar-extrato" element={<ImportarExtrato />} />
                <Route path="/financeiro/despesas-custos" element={<DespesasCustos />} />
                <Route path="/financeiro/dre" element={<DREPage />} />
                <Route path="/financeiro/dfc" element={<DFCPage />} />
                <Route path="/financeiro/conciliacao" element={<ConciliacaoBancaria />} />
                <Route path="/financeiro/orcamento" element={<Orcamento />} />
                <Route path="/financeiro/projecao" element={<ProjecaoCaixa />} />
                <Route path="/financeiro/financiamentos" element={<Financiamentos />} />
                <Route path="/financeiro/financiamentos/:id" element={<FinanciamentoDetail />} />
                <Route path="/financeiro/credito-rural" element={<CreditoRural />} />
                <Route path="/financeiro/patrimonio" element={<Patrimonio />} />
                <Route path="/financeiro/leasing" element={<LeasingPage />} />
                {/* Rotas PF removidas → projeto Natus */}
                <Route path="/financeiro/cmv" element={<CmvPage />} />

                <Route path="/fazenda/minhas-fazendas" element={<MinhasFazendas />} />
                <Route path="/fazenda/propriedades" element={<Propriedades />} />
                <Route path="/fazenda/estoque" element={<Estoque />} />
                <Route path="/fazenda/estoque/movimentacoes" element={<EstoqueMovimentacoes />} />
                <Route path="/fazenda/estoque/receber-xml" element={<ReceberXml />} />
                <Route path="/fazenda/operacoes-campo" element={<OperacoesCampo />} />
                <Route path="/fazenda/zonas-manejo" element={<ZonasManejo />} />
                <Route path="/fazenda/ndvi" element={<MapaNDVI />} />
                <Route path="/fazenda/telemetria" element={<TelemetriaPage />} />
                <Route path="/fazenda/missao-drone" element={<MissaoDrone />} />
                <Route path="/fazenda/maquinas" element={<Maquinas />} />
                <Route path="/fazenda/maquinas/:id" element={<MaquinaDetail />} />
                <Route path="/fazenda/mercado" element={<Mercado />} />
                <Route path="/fazenda/mdfe" element={<MdfePage />} />
                <Route path="/fazenda/nfe-saida" element={<NfeSaidaPage />} />
                <Route path="/fazenda/central-nfe" element={<CentralNfePage />} />
                <Route path="/fazenda/clima" element={<Clima />} />
                <Route path="/fazenda/historico-arroba" element={<HistoricoArroba />} />
                <Route path="/fazenda/historico-pluvio" element={<HistoricoPluviometrico />} />
                <Route path="/fazenda/gta" element={<GtaPage />} />
                <Route path="/fazenda/mapa" element={<MapaFazenda />} />
                <Route path="/fazenda/pegada-carbono" element={<PegadaCarbono />} />
                <Route path="/rebanho/animais" element={<Animais />} />
                <Route path="/rebanho/adicionar" element={<AdicionarAnimal />} />
                <Route path="/rebanho/animais/:id" element={<AnimalDetail />} />
                <Route path="/rebanho/pesagens" element={<Pesagens />} />
                <Route path="/rebanho/pesagens/lote" element={<PesagemLote />} />
                <Route path="/rebanho/movimentacoes" element={<Movimentacoes />} />
                <Route path="/rebanho/tratamentos" element={<Tratamentos />} />
                <Route path="/rebanho/reproducao" element={<Reproducao />} />
                <Route path="/rebanho/leite" element={<Leite />} />
                <Route path="/rebanho/relatorios/gmd" element={<GmdReport />} />
                <Route path="/rebanho/carencia" element={<Carencia />} />
                <Route path="/rebanho/sisbov" element={<SisbovPage />} />
                <Route path="/atividades" element={<Atividades />} />
                <Route path="/pastos" element={<Pastos />} />
                <Route path="/pastos/forragem" element={<ForragemPlantio />} />
                <Route path="/funcionarios" element={<Funcionarios />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/relatorios/analise-economica" element={<AnaliseEconomica />} />
                <Route path="/relatorios/lcprd" element={<LcprdPage />} />
                <Route path="/relatorios/posicao-financiamentos" element={<PosicaoFinanciamentos />} />
                {/* /relatorios/doacoes-exercicio → projeto Natus */}
                {/* /relatorios/gastos-por-pessoa → projeto Natus */}
                <Route path="/historico" element={<Historico />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/contato/parceiros" element={<Parceiros />} />
                <Route path="/contato/parceiros/:id" element={<ParceiroDetail />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/configuracoes/categorias" element={<CategoriasRastreamento />} />
                <Route path="/configuracoes/usuarios" element={<UsuariosPermissoes />} />
                <Route path="/configuracoes/auditoria" element={<LogAuditoria />} />
                <Route path="/configuracoes/aprovacoes" element={<Aprovacoes />} />
                <Route path="/configuracoes/modo-campo" element={<ModoCampo />} />
                <Route path="/configuracoes/leitores-balanca" element={<LeitoresBalanca />} />
                <Route path="/configuracoes/open-finance" element={<OpenFinance />} />
                <Route path="/financeiro/revisao-transacoes" element={<RevisaoTransacoes />} />
                <Route path="/configuracoes/notificacoes-push" element={<NotificacoesPush />} />
                <Route path="/notificacoes" element={<Notificacoes />} />
                <Route path="/producao/piscicultura" element={<Piscicultura />} />
                <Route path="/producao/agricultura" element={<Agricultura />} />
              </Route>
                  <Route path="/login" element={<Login />} />
                  {/* Rotas de teste: disponíveis APENAS em desenvolvimento */}
                  {import.meta.env.DEV && <Route path="/test-e2e" element={<TestE2E />} />}
                  {import.meta.env.DEV && <Route path="/infra-e2e-status" element={<InfraE2EStatus />} />}
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/privacidade" element={<PrivacidadePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </DeviceProvider>
        </FazendaProvider>
      </ProfileProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
