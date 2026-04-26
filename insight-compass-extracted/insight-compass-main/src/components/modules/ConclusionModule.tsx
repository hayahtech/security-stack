import { Brain, TrendingUp } from "lucide-react";
import type { AIConclusion } from "@/lib/mock-data";

export function ConclusionModule({ data }: { data: AIConclusion }) {
  return (
    <div className="glass p-6 space-y-4 neon-glow-cyan">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Brain className="w-5 h-5" /> Conclusão Inteligente (IA)
      </h3>
      <p className="text-sm text-foreground/90 leading-relaxed">{data.diagnosis}</p>
      <div className="flex flex-wrap gap-3">
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
          data.riskLevel === "Baixo" ? "bg-success/10 text-success" :
          data.riskLevel === "Médio" ? "bg-warning/10 text-warning" :
          "bg-destructive/10 text-destructive"
        }`}>
          Risco: {data.riskLevel}
        </div>
        <div className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary">
          Confiabilidade: {data.reliability}%
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Cenários</p>
        {data.scenarios.map((s) => (
          <div key={s.title} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
            <span className="text-sm font-bold font-mono text-primary">{s.probability}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
