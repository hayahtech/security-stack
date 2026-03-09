import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dre": "DRE - Demonstração do Resultado",
  "/fluxo-caixa": "Fluxo de Caixa",
  "/contas": "Contas a Pagar / Receber",
  "/liquidez": "Indicadores de Liquidez",
  "/capital-giro": "Capital de Giro & Dívida",
  "/margem": "Margem & Rentabilidade",
  "/ciclo": "Ciclo Financeiro",
  "/inadimplencia": "Inadimplência",
  "/tesouraria": "Tesouraria",
  "/conciliacao": "Conciliação Bancária",
  "/custos": "Custos & Despesas",
  "/cmv": "CMV - Custo da Mercadoria Vendida",
  "/kpis": "KPIs & ROI",
  "/analise-hv": "Análise Horizontal/Vertical",
  "/projecoes": "Projeções & Forecasting",
  "/riscos": "Análise de Riscos",
  "/nfe": "Emissão de NF-e",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
};

export default function PlaceholderPage() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Página";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-slide-in">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground font-data max-w-md">
          Este módulo está em fase de desenvolvimento no momento. Em breve você terá acesso a todas
          as funcionalidades. Agradecemos sua compreensão.
        </p>
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-sm text-muted-foreground font-data">
            Em construção
          </span>
        </div>
      </div>
    </div>
  );
}
