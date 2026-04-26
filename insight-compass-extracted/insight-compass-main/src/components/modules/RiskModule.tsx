import { AlertTriangle, AlertOctagon, Info } from "lucide-react";
import type { RiskDetection } from "@/lib/mock-data";
import { ScoreRing } from "@/components/ScoreRing";

const severityConfig = {
  low: { icon: Info, color: "text-neon-cyan", bg: "bg-neon-cyan/10", label: "Baixo" },
  medium: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Médio" },
  high: { icon: AlertTriangle, color: "text-neon-amber", bg: "bg-neon-amber/10", label: "Alto" },
  critical: { icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10", label: "Crítico" },
};

export function RiskModule({ data }: { data: RiskDetection }) {
  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" /> Detecção de Risco
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={data.score} />
        <div className="flex-1 space-y-2 w-full">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            data.overallRisk === "Baixo" ? "bg-success/10 text-success" :
            data.overallRisk === "Médio" ? "bg-warning/10 text-warning" :
            "bg-destructive/10 text-destructive"
          }`}>
            Risco Geral: {data.overallRisk}
          </div>
          <div className="space-y-2 mt-4">
            {data.flags.map((flag, i) => {
              const config = severityConfig[flag.severity];
              const Icon = config.icon;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${config.bg}`}>
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{flag.description}</p>
                    <span className={`text-xs font-medium ${config.color}`}>⚠️ {config.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
