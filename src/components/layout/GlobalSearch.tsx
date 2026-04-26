import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, BarChart3, Users, TrendingUp, Settings, Receipt, Droplets, Wallet, Target, ShieldAlert, Calculator, Package, LineChart, PieChart, RefreshCcw } from "lucide-react";

interface SearchItem {
  label: string;
  description: string;
  url: string;
  icon: typeof Search;
  category: string;
}

const searchItems: SearchItem[] = [
  { label: "Dashboard", description: "Visão geral executiva", url: "/", icon: BarChart3, category: "Páginas" },
  { label: "DRE", description: "Demonstração do Resultado", url: "/dre", icon: FileText, category: "Páginas" },
  { label: "Fluxo de Caixa", description: "Movimentação financeira", url: "/fluxo-caixa", icon: TrendingUp, category: "Páginas" },
  { label: "Contas a Pagar/Receber", description: "Gestão de contas", url: "/contas", icon: Wallet, category: "Páginas" },
  { label: "Indicadores de Liquidez", description: "Liquidez corrente, seca, imediata", url: "/liquidez", icon: Droplets, category: "Indicadores" },
  { label: "Margem & Rentabilidade", description: "Margens bruta, EBITDA, líquida", url: "/margem", icon: PieChart, category: "Indicadores" },
  { label: "Ciclo Financeiro", description: "PME, PMR, PMP", url: "/ciclo", icon: RefreshCcw, category: "Indicadores" },
  { label: "CMV", description: "Custo da Mercadoria Vendida", url: "/cmv", icon: Package, category: "Operacional" },
  { label: "Custos & Despesas", description: "Gestão de custos operacionais", url: "/custos", icon: Calculator, category: "Operacional" },
  { label: "KPIs & ROI", description: "ROE, ROA, ROIC, ROCE", url: "/kpis", icon: Target, category: "Analytics" },
  { label: "Projeções", description: "Forecasting e cenários", url: "/projecoes", icon: LineChart, category: "Analytics" },
  { label: "Análise de Riscos", description: "Riscos empresa, clientes, fornecedores", url: "/riscos", icon: ShieldAlert, category: "Analytics" },
  { label: "NF-e", description: "Emissão de notas fiscais", url: "/nfe", icon: Receipt, category: "Operacional" },
  { label: "Relatórios", description: "Hub central de relatórios", url: "/relatorios", icon: FileText, category: "Outros" },
  { label: "Configurações", description: "Metas, alertas, integrações", url: "/configuracoes", icon: Settings, category: "Outros" },
  // Metrics
  { label: "Margem EBITDA: 40,4%", description: "Benchmark SaaS: 20-40%", url: "/margem", icon: TrendingUp, category: "Métricas" },
  { label: "ROE: 107,1%", description: "Return on Equity", url: "/kpis", icon: Target, category: "Métricas" },
  { label: "Churn Rate: 2,3%", description: "Taxa de cancelamento", url: "/kpis", icon: Users, category: "Métricas" },
  { label: "Liquidez Corrente: 1,62", description: "AC/PC", url: "/liquidez", icon: Droplets, category: "Métricas" },
  { label: "Dívida Líquida/EBITDA: 0,33x", description: "Indicador de alavancagem", url: "/liquidez", icon: BarChart3, category: "Métricas" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filtered = query.length > 0
    ? searchItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : searchItems.slice(0, 8);

  const grouped = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="font-data hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-data border border-border">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden glass">
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar páginas, métricas, relatórios..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-data"
              autoFocus
            />
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-data">{category}</p>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label + item.url}
                      onClick={() => handleSelect(item.url)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-data text-foreground truncate">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 font-data">Nenhum resultado encontrado</p>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] text-muted-foreground font-data">
            <span>↑↓ para navegar</span>
            <span>↵ para selecionar</span>
            <span>ESC para fechar</span>
            <span>? para atalhos</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
