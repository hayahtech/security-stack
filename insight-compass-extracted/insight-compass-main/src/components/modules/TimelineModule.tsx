import { Clock, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { TimelineEvent } from "@/lib/mock-data";

const typeConfig = {
  info: { icon: Info, color: "text-neon-cyan", dot: "bg-neon-cyan" },
  warning: { icon: AlertTriangle, color: "text-warning", dot: "bg-warning" },
  success: { icon: CheckCircle, color: "text-success", dot: "bg-success" },
  danger: { icon: XCircle, color: "text-destructive", dot: "bg-destructive" },
};

export function TimelineModule({ data }: { data: TimelineEvent[] }) {
  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Clock className="w-5 h-5" /> Timeline de Eventos
      </h3>
      <div className="relative pl-6 space-y-4">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
        {data.map((event, i) => {
          const config = typeConfig[event.type];
          return (
            <div key={i} className="relative flex items-start gap-3">
              <div className={`absolute left-[-18px] top-1.5 w-2.5 h-2.5 rounded-full ${config.dot}`} />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-mono">{event.date}</p>
                <p className={`text-sm font-medium ${config.color}`}>{event.event}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
