import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const shortcuts = [
  { keys: ["G", "D"], label: "Dashboard", action: "/" },
  { keys: ["G", "F"], label: "Fluxo de Caixa", action: "/fluxo-caixa" },
  { keys: ["G", "R"], label: "Relatórios", action: "/relatorios" },
  { keys: ["G", "E"], label: "DRE", action: "/dre" },
  { keys: ["G", "C"], label: "Configurações", action: "/configuracoes" },
  { keys: ["G", "O"], label: "Orçamento", action: "/orcamento" },
  { keys: ["G", "I"], label: "Integrações", action: "/integracoes" },
  { keys: ["G", "S"], label: "Saúde Financeira", action: "/saude" },
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      if (e.key === "Escape") {
        setPending(null);
        return;
      }

      const key = e.key.toUpperCase();

      if (pending) {
        const match = shortcuts.find((s) => s.keys[0] === pending && s.keys[1] === key);
        if (match) {
          e.preventDefault();
          navigate(match.action);
        }
        setPending(null);
        return;
      }

      if (key === "G") {
        setPending("G");
        setTimeout(() => setPending(null), 1000);
      }
    },
    [pending, navigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const ShortcutsDialog = () => (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md glass">
        <h2 className="font-display font-bold text-lg mb-4">Atalhos de Teclado</h2>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-data">Navegação</div>
          {shortcuts.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-xs font-data">{k}</kbd>
                    {i < s.keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-4 mb-2 font-data">Geral</div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm">Busca Global</span>
            <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-xs font-data">⌘K</kbd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm">Mostrar atalhos</span>
            <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-xs font-data">?</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { ShortcutsDialog, pending };
}
