import { useState, useMemo } from "react";
import {
  Heart,
  TrendingUp,
  Droplets,
  Landmark,
  Zap,
  Shield,
  ArrowUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCountUp } from "@/hooks/use-count-up";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { cn } from "@/lib/utils";

interface Dimension {
  key: string;
  label: string;
  score: number;
  icon: typeof Heart;
  indicators: { name: string; value: string; score: number; improvement: string }[];
}

const dimensions: Dimension[] = [
  {
    key: "profitability", label: "Rentabilidade", score: 82, icon: TrendingUp,
    indicators: [
      { name: "Margem EBITDA", value: "40,4%", score: 90, improvement: "Reduzir custos operacionais em 3%" },
      { name: "Margem Líquida", value: "20,0%", score: 78, improvement: "Renegociar despesas financeiras" },
      { name: "ROE", value: "107,1%", score: 95, improvement: "Manter nível atual" },
      { name: "ROA", value: "18,2%", score: 65, improvement: "Otimizar utilização de ativos" },
    ],
  },
  {
    key: "liquidity", label: "Liquidez", score: 91, icon: Droplets,
    indicators: [
      { name: "Liquidez Corrente", value: "1,62", score: 88, improvement: "Meta acima de 1,5 — OK" },
      { name: "Liquidez Seca", value: "1,23", score: 85, improvement: "Reduzir estoque parado" },
      { name: "Dias de Caixa", value: "41 dias", score: 95, improvement: "Excelente cobertura" },
      { name: "Capital de Giro", value: "R$ 3,2M", score: 92, improvement: "Manter níveis atuais" },
    ],
  },
  {
    key: "debt", label: "Endividamento", score: 88, icon: Landmark,
    indicators: [
      { name: "Dívida Liq./EBITDA", value: "0,33x", score: 96, improvement: "Excelente — baixo risco" },
      { name: "Cobertura de Juros", value: "5,0x", score: 85, improvement: "Manter acima de 3x" },
      { name: "Endividamento Geral", value: "32%", score: 82, improvement: "Manter abaixo de 50%" },
    ],
  },
  {
    key: "efficiency", label: "Eficiência", score: 84, icon: Zap,
    indicators: [
      { name: "Ciclo Financeiro", value: "42 dias", score: 80, improvement: "Reduzir PMR em 5 dias" },
      { name: "Giro de Ativos", value: "0,91x", score: 75, improvement: "Aumentar receita por ativo" },
      { name: "Custo por Funcionário", value: "R$ 7.177", score: 88, improvement: "Dentro do benchmark SaaS" },
      { name: "Taxa Automação", value: "84%", score: 92, improvement: "Meta: 90% até dez/25" },
    ],
  },
  {
    key: "growth", label: "Crescimento", score: 78, icon: ArrowUp,
    indicators: [
      { name: "Crescimento Receita (YoY)", value: "18,5%", score: 82, improvement: "Acelerar aquisição" },
      { name: "Expansão MRR", value: "2,1%/mês", score: 76, improvement: "Aumentar upsell" },
      { name: "Churn Rate", value: "2,3%", score: 70, improvement: "Meta: abaixo de 2%" },
      { name: "NRR", value: "108%", score: 85, improvement: "Manter acima de 100%" },
    ],
  },
  {
    key: "governance", label: "Governança", score: 83, icon: Shield,
    indicators: [
      { name: "Aderência Budget", value: "94,2%", score: 90, improvement: "Manter acima de 90%" },
      { name: "Conciliação Auto.", value: "98,6%", score: 98, improvement: "Excelente" },
      { name: "Audit Trail", value: "100%", score: 100, improvement: "Todas ações rastreadas" },
      { name: "Alçadas Ativas", value: "3/3", score: 85, improvement: "Revisar limites trimestralmente" },
    ],
  },
];

const overallScore = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);

const scoreHistory = [
  { month: "Out/24", score: 79 },
  { month: "Nov/24", score: 81 },
  { month: "Dez/24", score: 83 },
  { month: "Jan/25", score: 84 },
  { month: "Fev/25", score: 85 },
  { month: "Mar/25", score: overallScore },
];

const radarData = dimensions.map((d) => ({ dimension: d.label, score: d.score, fullMark: 100 }));

export default function SaudeFinanceira() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const animatedScore = useCountUp(overallScore);

  const scoreLabel = overallScore >= 80 ? "Excelente condição" : overallScore >= 60 ? "Boa condição" : "Atenção necessária";
  const scoreColor = overallScore >= 80 ? "text-success" : overallScore >= 60 ? "text-yellow-500" : "text-destructive";

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Saúde Financeira</h1>
          <p className="text-muted-foreground font-data">Score composto e análise por dimensão</p>
        </div>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1.5" /> Gerar Relatório Executivo
        </Button>
      </div>

      {/* Main score */}
      <div className="rounded-xl border-gradient bg-card p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Heart className={cn("h-8 w-8", scoreColor)} />
          <span className="text-6xl font-display font-bold">{animatedScore}</span>
          <span className="text-2xl font-display text-muted-foreground">/100</span>
        </div>
        <p className={cn("text-lg font-display font-semibold", scoreColor)}>{scoreLabel}</p>
        <p className="text-sm text-muted-foreground mt-1 font-data">
          Score composto baseado em 6 dimensões financeiras
        </p>
      </div>

      {/* Dimensions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          const isExpanded = expanded === dim.key;
          return (
            <div
              key={dim.key}
              className={cn(
                "rounded-xl border border-border/50 bg-card p-5 cursor-pointer transition-all duration-200 hover:border-border",
                isExpanded && "md:col-span-2 lg:col-span-3 border-primary/30"
              )}
              onClick={() => setExpanded(isExpanded ? null : dim.key)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-display font-semibold">{dim.label}</span>
                </div>
                <span className={cn(
                  "text-xl font-display font-bold",
                  dim.score >= 85 ? "text-success" : dim.score >= 70 ? "text-yellow-500" : "text-destructive"
                )}>
                  {dim.score}
                </span>
              </div>
              <Progress
                value={dim.score}
                className="h-2"
              />

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-border pt-4" onClick={(e) => e.stopPropagation()}>
                  {dim.indicators.map((ind) => (
                    <div key={ind.name} className="flex items-center gap-4">
                      <span className="text-sm w-44 truncate">{ind.name}</span>
                      <span className="text-sm font-data font-semibold w-20 text-right">{ind.value}</span>
                      <div className="flex-1">
                        <Progress value={ind.score} className="h-1.5" />
                      </div>
                      <span className="text-xs font-data w-8 text-right">{ind.score}</span>
                      <span className="text-xs text-muted-foreground hidden lg:block w-56 truncate">💡 {ind.improvement}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score history */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Evolução do Score</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreHistory} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Mapa de Dimensões</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Radar
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
