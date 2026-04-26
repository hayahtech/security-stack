import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, Tractor, Beef, ClipboardList, Leaf, Users,
  FileBarChart, History, CalendarDays, Phone, Sun, Moon,
  ChevronDown, ArrowLeftRight, CreditCard, FileDown, Receipt, MapPin,
  Weight, Stethoscope, Baby, Milk, PlusCircle, Landmark, Settings, RotateCcw,
  Calculator, TrendingUp, ShieldAlert, Handshake, Package, Cog, Sprout, BarChart3,
  Fish, Apple, PanelLeftClose, PanelLeftOpen, CloudRain, Plane, Zap, ScanLine, Radio, Navigation,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/contexts/ThemeContext";
import { useFazenda } from "@/contexts/FazendaContext";
import {
  Select as ShadSelect, SelectContent as ShadSelectContent,
  SelectItem as ShadSelectItem, SelectTrigger as ShadSelectTrigger,
  SelectValue as ShadSelectValue,
} from "@/components/ui/select";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { fazendas, activeFazenda, setActiveFazendaId } = useFazenda();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold text-sm">
            AF
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              AgroFinance
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="mt-2">
            <ShadSelect value={activeFazenda?.id || ""} onValueChange={setActiveFazendaId}>
              <ShadSelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground">
                <Tractor className="h-3 w-3 mr-1 shrink-0" />
                <ShadSelectValue placeholder="Selecionar fazenda" />
              </ShadSelectTrigger>
              <ShadSelectContent>
                {fazendas.map((f) => (
                  <ShadSelectItem key={f.id} value={f.id}>{f.name}</ShadSelectItem>
                ))}
              </ShadSelectContent>
            </ShadSelect>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Theme toggle */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col gap-3 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                    <Sun className="h-3.5 w-3.5" />
                    <span>Claro</span>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-sidebar-primary"
                  />
                  <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                    <Moon className="h-3.5 w-3.5" />
                    <span>Escuro</span>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Separator className="bg-sidebar-border" />

        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")} tooltip="Dashboard">
                  <NavLink to="/" end activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financeiro */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="flex-1 text-left">Financeiro</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuSub>
                    {[
                      { to: "/financeiro/fluxo-de-caixa", label: "Fluxo de Caixa", icon: ArrowLeftRight },
                      { to: "/financeiro/contas-cartoes", label: "Contas & Cartões", icon: CreditCard },
                      { to: "/financeiro/pagar-receber", label: "A Pagar & A Receber", icon: Landmark },
                      { to: "/financeiro/importar-extrato", label: "Importar Extrato", icon: FileDown },
                      { to: "/financeiro/despesas-custos", label: "Despesas & Custos", icon: Receipt },
                      { to: "/financeiro/conciliacao", label: "Conciliação Bancária", icon: RotateCcw },
                      { to: "/financeiro/dre", label: "DRE", icon: FileBarChart },
                      { to: "/financeiro/dfc", label: "DFC", icon: FileBarChart },
                      { to: "/financeiro/orcamento", label: "Orçamento", icon: Calculator },
                      { to: "/financeiro/projecao", label: "Projeção de Caixa", icon: TrendingUp },
                    ].map((item) => (
                      <SidebarMenuSubItem key={item.to}>
                        <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                          <NavLink to={item.to} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                            <item.icon className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Fazenda */}
        <SidebarGroup>
            <Collapsible className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2">
                  <Tractor className="h-4 w-4" />
                  <span className="flex-1 text-left">Fazenda</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuSub>
                      {[
                        { to: "/fazenda/minhas-fazendas", label: "Minhas Fazendas", icon: Tractor },
                        { to: "/fazenda/propriedades", label: "Propriedades", icon: MapPin },
                        { to: "/fazenda/estoque", label: "Estoque", icon: Package },
                        { to: "/fazenda/operacoes-campo", label: "Operações de Campo", icon: Plane },
                        { to: "/fazenda/zonas-manejo", label: "Zonas de Manejo (VRA)", icon: Zap },
                        { to: "/fazenda/ndvi", label: "Mapa NDVI", icon: ScanLine },
                        { to: "/fazenda/telemetria", label: "Telemetria de Voo", icon: Radio },
                        { to: "/fazenda/missao-drone", label: "Planejador de Missão", icon: Navigation },
                        { to: "/fazenda/maquinas", label: "Máquinas & Manutenção", icon: Cog },
                        { to: "/fazenda/mercado", label: "Mercado & Clima", icon: BarChart3 },
                        { to: "/fazenda/historico-arroba", label: "Histórico da Arroba", icon: TrendingUp },
                        { to: "/fazenda/historico-pluvio", label: "Histórico Pluviométrico", icon: CloudRain },
                      ].map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                            <NavLink to={item.to} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>

        {/* Rebanho */}
        <SidebarGroup>
            <Collapsible className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2">
                  <Beef className="h-4 w-4" />
                  <span className="flex-1 text-left">Rebanho</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuSub>
                      {[
                        { to: "/rebanho/animais", label: "Animais", icon: Beef },
                        { to: "/rebanho/adicionar", label: "Adicionar Animal", icon: PlusCircle },
                        { to: "/rebanho/pesagens", label: "Pesagens", icon: Weight },
                        { to: "/rebanho/pesagens/lote", label: "Pesagem em Lote", icon: Weight },
                        { to: "/rebanho/movimentacoes", label: "Movimentações", icon: MapPin },
                        { to: "/rebanho/tratamentos", label: "Tratamentos", icon: Stethoscope },
                        { to: "/rebanho/reproducao", label: "Reprodução", icon: Baby },
                        { to: "/rebanho/leite", label: "Leite", icon: Milk },
                        { to: "/rebanho/carencia", label: "Carência", icon: ShieldAlert },
                      ].map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                            <NavLink to={item.to} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>

        {/* Produção */}
        <SidebarGroup>
            <Collapsible className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2">
                  <Sprout className="h-4 w-4" />
                  <span className="flex-1 text-left">Produção</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuSub>
                      {[
                        { to: "/producao/piscicultura", label: "Piscicultura", icon: Fish },
                        { to: "/producao/agricultura", label: "Agricultura", icon: Apple },
                      ].map((item) => (
                        <SidebarMenuSubItem key={item.to}>
                          <SidebarMenuSubButton asChild isActive={isActive(item.to)}>
                            <NavLink to={item.to} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                              <item.icon className="h-3.5 w-3.5" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>

        {/* Simple items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/atividades")} tooltip="Atividades">
                  <NavLink to="/atividades" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <ClipboardList className="h-4 w-4" />
                    <span>Atividades</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/pastos")} tooltip="Pastos">
                    <NavLink to="/pastos" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Leaf className="h-4 w-4" />
                      <span>Pastos</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/pastos/forragem")} tooltip="Forragem & Plantio">
                    <NavLink to="/pastos/forragem" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Sprout className="h-4 w-4" />
                      <span>Forragem & Plantio</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/funcionarios")} tooltip="Funcionários">
                    <NavLink to="/funcionarios" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Users className="h-4 w-4" />
                      <span>Funcionários</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

              <Collapsible defaultOpen={location.pathname.startsWith("/relatorios")}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Relatórios">
                      <FileBarChart className="h-4 w-4" />
                      <span>Relatórios</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/relatorios")}>
                          <NavLink to="/relatorios" activeClassName="text-sidebar-primary font-medium">
                            <span>Geral</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/relatorios/analise-economica")}>
                          <NavLink to="/relatorios/analise-economica" activeClassName="text-sidebar-primary font-medium">
                            <span>Análise Econômica</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/historico")} tooltip="Histórico">
                  <NavLink to="/historico" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <History className="h-4 w-4" />
                    <span>Histórico</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/calendario")} tooltip="Calendário">
                  <NavLink to="/calendario" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <CalendarDays className="h-4 w-4" />
                    <span>Calendário</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/contato")} tooltip="Contato">
                  <NavLink to="/contato" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <Phone className="h-4 w-4" />
                    <span>Contatos</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/contato/parceiros") || location.pathname.startsWith("/contato/parceiros")} tooltip="Parceiros">
                  <NavLink to="/contato/parceiros" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <Handshake className="h-4 w-4" />
                    <span>Parceiros & Fornecedores</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={collapsed ? "Expandir menu" : "Recolher menu"}
              onClick={toggleSidebar}
              className="justify-center hover:bg-sidebar-accent/50"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              {!collapsed && <span className="text-sm">Recolher menu</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/configuracoes")} tooltip="Configurações">
              <NavLink to="/configuracoes" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                <div className="h-6 w-6 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-[10px] font-bold shrink-0">JS</div>
                {!collapsed && <span className="text-sm">João Silva</span>}
                {!collapsed && <Settings className="ml-auto h-4 w-4 text-sidebar-foreground/50" />}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/40 text-center mt-1">AgroFinance Pro v1.0</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
