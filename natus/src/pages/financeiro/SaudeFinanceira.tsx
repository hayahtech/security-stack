import { useState } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Heart, ArrowRight, TrendingUp, Shield, PiggyBank, Wallet, BarChart3, Target } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Dimension {
  key: string;
  label: string;
  shortLabel: string;
  weight: number;
  score: number;
  icon: React.ReactNode;
  description: string;
  levels: string[];
}

interface ActionItem {
  dimension: string;
  impact: number;
  description: string;
  route: string;
  buttonLabel: string;
}

const scoreHistory = [
  { month: "Out/25", score: 58 },
  { month: "Nov/25", score: 61 },
  { month: "Dez/25", score: 63 },
  { month: "Jan/26", score: 68 },
  { month: "Fev/26", score: 72 },
  { month: "Mar/26", score: 76 },
];

export default function SaudeFinanceira() {
  const { isEmpresarial } = useProfile();
  const navigate = useNavigate();

  // Editable scores for each dimension
  const [reservaScore, setReservaScore] = useState(63);
  const [dividaScore, setDividaScore] = useState(75);
  const [poupancaScore, setPoupancaScore] = useState(75);
  const [investimentoScore, setInvestimentoScore] = useState(50);
  const [planejamentoScore, setPlanejamentoScore] = useState(75);
  const [protecaoScore, setProtecaoScore] = useState(50);

  if (isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Saúde Financeira</h2>
        <p className="text-muted-foreground text-center max-w-md">Disponível apenas no perfil Pessoal.</p>
      </div>
    );
  }

  const dimensions: Dimension[] = [
    { key: "reserva", label: "Reserva de Emergência", shortLabel: "Reserva", weight: 20, score: reservaScore, icon: <Shield className="h-5 w-5" />,
      description: "Meses de despesas guardados como colchão de segurança",
      levels: ["Sem reserva", "Menos de 1 mês", "1 a 3 meses", "3 a 6 meses", "6+ meses"] },
    { key: "divida", label: "Controle de Dívidas", shortLabel: "Dívidas", weight: 20, score: dividaScore, icon: <Wallet className="h-5 w-5" />,
      description: "Percentual da renda comprometido com parcelas",
      levels: [">50% da renda", "30 a 50%", "15 a 30%", "Até 15%", "Sem dívidas"] },
    { key: "poupanca", label: "Poupança Mensal", shortLabel: "Poupança", weight: 20, score: poupancaScore, icon: <PiggyBank className="h-5 w-5" />,
      description: "Percentual da renda que você poupa mensalmente",
      levels: ["Não poupa", "Menos de 5%", "5 a 10%", "10 a 20%", "20%+"] },
    { key: "investimento", label: "Investimentos", shortLabel: "Investimentos", weight: 20, score: investimentoScore, icon: <BarChart3 className="h-5 w-5" />,
      description: "Diversificação e regularidade dos investimentos",
      levels: ["Sem investimentos", "Começando", "Apenas poupança", "Sem diversificação", "Diversificado"] },
    { key: "planejamento", label: "Planejamento", shortLabel: "Planejamento", weight: 10, score: planejamentoScore, icon: <Target className="h-5 w-5" />,
      description: "Orçamento, metas e plano de aposentadoria",
      levels: ["Sem planejamento", "Acompanha gastos", "Tem orçamento", "Orçamento + metas", "Completo"] },
    { key: "protecao", label: "Proteção", shortLabel: "Proteção", weight: 10, score: protecaoScore, icon: <Shield className="h-5 w-5" />,
      description: "Seguros de vida, saúde e bens",
      levels: ["Sem proteção", "Parcial", "Apenas saúde", "Saúde + vida", "Completa"] },
  ];

  const totalScore = Math.round(dimensions.reduce((s, d) => s + d.score * (d.weight / 100), 0));

  const getScoreColor = (score: number) => {
    if (score >= 90) return "149 62% 20%";
    if (score >= 75) return "149 62% 26%";
    if (score >= 60) return "45 90% 45%";
    if (score >= 40) return "37 100% 50%";
    return "0 72% 50%";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Excelente", msg: "Parabéns! Sua saúde financeira é exemplar. Continue assim! 🏆" };
    if (score >= 75) return { label: "Boa saúde financeira", msg: "Você está no caminho certo! Continue assim. 💪" };
    if (score >= 60) return { label: "Em desenvolvimento", msg: "Bom progresso! Algumas melhorias podem fazer diferença. 📈" };
    if (score >= 40) return { label: "Atenção necessária", msg: "Alguns pontos precisam de atenção. Veja as sugestões abaixo. ⚠️" };
    return { label: "Situação crítica", msg: "É hora de agir. Comece pelas ações de maior impacto abaixo. 🚨" };
  };

  const scoreInfo = getScoreLabel(totalScore);
  const scoreColor = getScoreColor(totalScore);

  // Radar data
  const radarData = dimensions.map(d => ({ subject: d.shortLabel, score: d.score, fullMark: 100 }));

  // Action items sorted by impact
  const actions: ActionItem[] = [];
  if (reservaScore < 75) actions.push({ dimension: "Reserva", impact: Math.round((75 - reservaScore) * 0.2), description: "Crie uma meta de reserva de emergência para cobrir 6 meses de despesas", route: "/financeiro/metas", buttonLabel: "Criar meta" });
  if (investimentoScore < 75) actions.push({ dimension: "Investimentos", impact: Math.round((75 - investimentoScore) * 0.2), description: "Registre seus investimentos no sistema e diversifique sua carteira", route: "/financeiro/investimentos-pessoal", buttonLabel: "Adicionar investimento" });
  if (planejamentoScore < 100) actions.push({ dimension: "Planejamento", impact: Math.round((100 - planejamentoScore) * 0.1), description: "Configure um orçamento mensal para controlar seus gastos", route: "/financeiro/orcamento-familiar", buttonLabel: "Criar orçamento" });
  if (poupancaScore < 100) actions.push({ dimension: "Poupança", impact: Math.round((100 - poupancaScore) * 0.2), description: "Aumente sua taxa de poupança para pelo menos 20% da renda", route: "/financeiro/metas", buttonLabel: "Definir meta" });
  if (protecaoScore < 75) actions.push({ dimension: "Proteção", impact: Math.round((75 - protecaoScore) * 0.1), description: "Contrate seguros de vida e revise suas apólices atuais", route: "/financeiro/patrimonio", buttonLabel: "Ver patrimônio" });
  if (dividaScore < 100) actions.push({ dimension: "Dívidas", impact: Math.round((100 - dividaScore) * 0.2), description: "Planeje a quitação antecipada dos financiamentos mais caros", route: "/financeiro/financiamentos", buttonLabel: "Ver financiamentos" });
  if (planejamentoScore < 75) actions.push({ dimension: "Planejamento", impact: Math.round((75 - planejamentoScore) * 0.1), description: "Configure seu plano de aposentadoria", route: "/financeiro/aposentadoria", buttonLabel: "Planejar aposentadoria" });
  actions.sort((a, b) => b.impact - a.impact);

  const previousScore = scoreHistory.length >= 2 ? scoreHistory[scoreHistory.length - 2].score : totalScore;
  const scoreDiff = totalScore - previousScore;
  const threeMonthsAgo = scoreHistory.length >= 4 ? scoreHistory[scoreHistory.length - 4].score : totalScore;
  const threeMonthDiff = totalScore - threeMonthsAgo;

  // Gauge drawing
  const gaugeRadius = 120;
  const gaugeStroke = 16;
  const gaugeCircumference = Math.PI * gaugeRadius; // semicircle
  const gaugeFill = (totalScore / 100) * gaugeCircumference;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saúde Financeira</h1>
          <p className="text-muted-foreground">Diagnóstico completo da sua vida financeira</p>
        </div>
      </div>

      {/* Score Gauge */}
      <Card>
        <CardContent className="pt-8 pb-6">
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 280, height: 160 }}>
              <svg width="280" height="160" viewBox="0 0 280 160">
                {/* Background arc */}
                <path
                  d="M 20 150 A 120 120 0 0 1 260 150"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={gaugeStroke}
                  strokeLinecap="round"
                />
                {/* Score arc */}
                <path
                  d="M 20 150 A 120 120 0 0 1 260 150"
                  fill="none"
                  stroke={`hsl(${scoreColor})`}
                  strokeWidth={gaugeStroke}
                  strokeLinecap="round"
                  strokeDasharray={`${gaugeFill} ${gaugeCircumference}`}
                  className="transition-all duration-700"
                />
                {/* Score text */}
                <text x="140" y="120" textAnchor="middle" className="text-5xl font-bold" fill={`hsl(${scoreColor})`} fontSize="52">{totalScore}</text>
                <text x="140" y="148" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="13">de 100 pontos</text>
              </svg>
            </div>
            <Badge className="text-sm px-4 py-1 mt-2" style={{ background: `hsl(${scoreColor})`, color: "white" }}>
              {scoreInfo.label}
            </Badge>
            <p className="text-muted-foreground text-center mt-2 max-w-md">{scoreInfo.msg}</p>
            {threeMonthDiff !== 0 && (
              <p className="text-sm mt-2 font-medium" style={{ color: `hsl(${threeMonthDiff > 0 ? "149 62% 26%" : "0 72% 50%"})` }}>
                {threeMonthDiff > 0 ? `Seu score subiu ${threeMonthDiff} pontos nos últimos 3 meses! 🎉` : `Seu score caiu ${Math.abs(threeMonthDiff)} pontos nos últimos 3 meses`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Radar + Dimensions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Dimensões Avaliadas</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke={`hsl(${scoreColor})`} fill={`hsl(${scoreColor} / 0.2)`} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Detalhamento por Dimensão</CardTitle><CardDescription>Ajuste os scores para simular melhorias</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {dimensions.map((dim, idx) => {
              const setters = [setReservaScore, setDividaScore, setPoupancaScore, setInvestimentoScore, setPlanejamentoScore, setProtecaoScore];
              const levelIdx = dim.score >= 90 ? 4 : dim.score >= 75 ? 3 : dim.score >= 50 ? 2 : dim.score >= 25 ? 1 : 0;
              return (
                <div key={dim.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {dim.icon}
                      <span className="text-sm font-medium text-foreground">{dim.label}</span>
                      <Badge variant="outline" className="text-[10px]">Peso {dim.weight}%</Badge>
                    </div>
                    <span className="text-sm font-bold" style={{ color: `hsl(${getScoreColor(dim.score)})` }}>{dim.score}</span>
                  </div>
                  <Slider min={0} max={100} step={1} value={[dim.score]} onValueChange={v => setters[idx](v[0])} />
                  <p className="text-xs text-muted-foreground">{dim.levels[levelIdx]}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Action Plan */}
      {actions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">🎯 Plano de Ação Personalizado</CardTitle><CardDescription>Ações ordenadas por impacto no seu score</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: `hsl(${getScoreColor(100 - action.impact * 3)} / 0.15)`, color: `hsl(${getScoreColor(100 - action.impact * 3)})` }}>
                    +{action.impact}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{action.dimension}</Badge>
                      <span className="text-xs text-muted-foreground">+{action.impact} pontos no score</span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{action.description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 flex-shrink-0" onClick={() => navigate(action.route)}>
                    {action.buttonLabel} <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Evolução do Score</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </div>
            {scoreDiff !== 0 && (
              <Badge variant={scoreDiff > 0 ? "default" : "destructive"} className="gap-1">
                <TrendingUp className="h-3 w-3" /> {scoreDiff > 0 ? "+" : ""}{scoreDiff} pts este mês
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke={`hsl(${scoreColor})`} strokeWidth={2.5} dot={{ fill: `hsl(${scoreColor})`, r: 4 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
