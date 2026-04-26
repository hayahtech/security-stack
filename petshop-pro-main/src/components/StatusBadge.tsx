import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  Pago: "bg-success/15 text-success",
  Concluído: "bg-success/15 text-success",
  Confirmado: "bg-primary/15 text-primary",
  Agendado: "bg-warning/15 text-warning-foreground",
  Pendente: "bg-warning/15 text-warning-foreground",
  Cancelado: "bg-destructive/15 text-destructive",
  Normal: "bg-success/15 text-success",
  Baixo: "bg-warning/15 text-warning-foreground",
  "Crítico": "bg-destructive/15 text-destructive",
  Esgotado: "bg-destructive/15 text-destructive",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("badge-status", statusStyles[status] || "bg-muted text-muted-foreground", className)}>
      {status}
    </span>
  );
}
