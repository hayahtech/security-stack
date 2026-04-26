import { GitCompare, AlertTriangle } from "lucide-react";
import type { Competitor } from "@/lib/mock-data";

export function CompetitorModule({ data }: { data: Competitor[] }) {
  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <GitCompare className="w-5 h-5" /> Análise Comparativa
      </h3>
      <div className="space-y-3">
        {data.map((c) => (
          <div key={c.domain} className={`p-4 rounded-lg flex items-center justify-between ${c.conflict ? "bg-warning/10" : "bg-muted/30"}`}>
            <div>
              <p className="text-sm font-medium text-foreground">{c.domain}</p>
              <p className="text-xs text-muted-foreground">Similaridade: {c.similarity}%</p>
            </div>
            {c.conflict && (
              <span className="flex items-center gap-1 text-xs text-warning font-medium">
                <AlertTriangle className="w-3 h-3" /> Possível conflito
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
