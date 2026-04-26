import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pwa_install_dismissed") === "true");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 safe-area-bottom">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-4">
        <div className="rounded-xl bg-primary/10 p-3 shrink-0">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-foreground text-sm">Instalar AgroFinance Pro</p>
          <p className="text-xs text-muted-foreground">Acesse offline direto da tela inicial</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleInstall} className="h-9 min-h-[44px] px-4">
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
