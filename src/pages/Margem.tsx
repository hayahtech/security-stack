import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  margins, marginsBenchmarkSaaS, marginsHistory,
} from "@/mock/marginsData";
import { cn } from "@/lib/utils";

export default function Margem() {
  const radarData = marginsBenchmarkSaaS.map((m) => ({
    subject: m.label,
    TechBR: m.company,
    Setor: m.sector,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Margem & Rentabilidade</h1>
        <p className="text-muted-foreground font-data">Análise de margens operacionais e benchmarks SaaS</p>
      </div>

      {/* Margin Bars */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-lg mb-6">Margens Atuais — Março/2025</h3>
        <div className="space-y-5">
          {margins.map((m) => {
            const inRange = m.value >= m.benchmarkMin && m.value <= m.benchmarkMax;
            const above = m.value > m.benchmarkMax;
            return (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-data">{m.label}</span>
                    {inRange ? (
                      <Badge className="bg-success/20 text-success border-success/30 text-xs">✓ No benchmark</Badge>
                    ) : above ? (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">⚠ Acima!</Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">Abaixo</Badge>
                    )}
                  </div>
                  <span className="text-lg font-display font-bold" style={{ color: m.color }}>{m.value}%</span>
                </div>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.value}%`, backgroundColor: m.color }} />
                  {/* Benchmark zone indicator */}
                  <div
                    className="absolute top-0 h-full border-l-2 border-dashed border-foreground/30"
                    style={{ left: `${m.benchmarkMin}%` }}
                  />
                  <div
                    className="absolute top-0 h-full border-l-2 border-dashed border-foreground/30"
                    style={{ left: `${m.benchmarkMax}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>Benchmark: {m.benchmarkMin}%-{m.benchmarkMax}%</span>
                  <span>100%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <Target className="inline-block h-5 w-5 mr-2 text-primary" />
            Radar: TechBR vs Setor SaaS
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(222, 30%, 20%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 80]} tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} />
                <Radar name="TechBR" dataKey="TechBR" stroke="hsl(187, 100%, 50%)" fill="hsl(187, 100%, 50%)" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Setor" dataKey="Setor" stroke="hsl(252, 100%, 69%)" fill="hsl(252, 100%, 69%)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <TrendingUp className="inline-block h-5 w-5 mr-2 text-success" />
            Evolução 12 Meses
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginsHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} domain={[20, 75]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [`${v}%`, ""]} />
                <Line type="monotone" dataKey="gross" name="M. Bruta" stroke="hsl(152, 100%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ebitda" name="M. EBITDA" stroke="hsl(252, 100%, 69%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" name="M. Líquida" stroke="hsl(354, 100%, 64%)" strokeWidth={2} dot={{ r: 3 }} />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
