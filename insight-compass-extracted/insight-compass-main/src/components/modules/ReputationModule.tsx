import { Star, MessageSquare, TrendingUp } from "lucide-react";
import type { Reputation } from "@/lib/mock-data";

export function ReputationModule({ data }: { data: Reputation }) {
  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Star className="w-5 h-5" /> Reputação
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Reclamações</p>
          {data.complaints.map((c) => (
            <div key={c.source} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.source}</p>
                <p className="text-xs text-muted-foreground">{c.count} reclamações • {c.resolved} resolvidas</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-foreground">{Math.round((c.resolved / c.count) * 100)}%</p>
                <p className="text-xs text-muted-foreground">resolvidas</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Avaliações</p>
          {data.platforms.map((p) => (
            <div key={p.name} className={`p-3 rounded-lg ${p.present ? "bg-muted/30" : "bg-muted/10"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{p.name}</span>
                {p.present && p.score !== undefined ? (
                  <span className={`text-sm font-bold font-mono ${p.score >= 7 ? "text-success" : p.score >= 5 ? "text-warning" : "text-destructive"}`}>
                    {p.score}/10
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Não encontrado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
