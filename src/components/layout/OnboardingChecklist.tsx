import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { id: "bank", label: "Conectar banco (Open Finance)", done: true },
  { id: "accounts", label: "Importar plano de contas", done: true },
  { id: "costcenters", label: "Cadastrar centros de custo", done: false },
  { id: "approvals", label: "Definir alçadas de aprovação", done: false },
  { id: "team", label: "Convidar equipe", done: false },
];

export function OnboardingChecklist() {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || !visible) return null;

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card shadow-xl transition-all duration-300",
      "glass"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-sm">Setup do FinanceOS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-data">{completed}/{steps.length}</span>
          {collapsed ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <button onClick={(e) => { e.stopPropagation(); setDismissed(true); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completed / steps.length) * 100}%` }} />
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn("text-xs", step.done ? "text-muted-foreground line-through" : "text-foreground")}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <Button size="sm" className="w-full mt-2">
            Continuar setup
          </Button>
        </div>
      )}
    </div>
  );
}
