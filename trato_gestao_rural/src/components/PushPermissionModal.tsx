import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, Shield, Smartphone } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { toast } from "@/hooks/use-toast";

export function PushPermissionModal() {
  const [open, setOpen] = useState(false);
  const { supported, permission, subscribe, loading } = usePushNotifications();

  useEffect(() => {
    if (!supported) return;
    if (permission !== "default") return;
    // Check if user already dismissed
    const dismissed = localStorage.getItem("push_permission_dismissed");
    if (dismissed) return;
    // Show after 3 seconds
    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [supported, permission]);

  const handleActivate = async () => {
    const sub = await subscribe();
    if (sub) {
      toast({ title: "🔔 Alertas ativados!", description: "Você receberá notificações push do AgroFinance Pro." });
    } else {
      toast({ title: "Permissão negada", description: "Você pode ativar depois em Configurações > Notificações.", variant: "destructive" });
    }
    setOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("push_permission_dismissed", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5 text-primary" />
            Ativar Alertas Push
          </DialogTitle>
          <DialogDescription>
            Receba notificações importantes diretamente no seu dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-foreground leading-relaxed">
            O AgroFinance Pro pode enviar alertas sobre:
          </p>
          <div className="space-y-2">
            {[
              { emoji: "🐄", text: "Partos próximos e vacinas vencendo" },
              { emoji: "💰", text: "Boletos e contas a pagar" },
              { emoji: "🌡️", text: "Alertas climáticos importantes" },
              { emoji: "📦", text: "Estoque baixo de insumos" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm">
                <span>{item.emoji}</span>
                <span className="text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Seus dados são protegidos. Você pode desativar a qualquer momento em Configurações.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleDismiss}>
            Agora não
          </Button>
          <Button className="flex-1 gap-1" onClick={handleActivate} disabled={loading}>
            <Bell className="h-4 w-4" /> Ativar alertas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
