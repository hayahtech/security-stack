import { useState, useEffect, useCallback } from "react";
import { syncQueue, getPendingCount } from "@/lib/offline-sync";
import { toast } from "@/hooks/use-toast";

export type NetworkStatus = "online" | "offline" | "syncing";

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(
    navigator.onLine ? "online" : "offline",
  );
  // getPendingCount() é async — inicializa com 0 e carrega assincronamente
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPending = useCallback(() => {
    getPendingCount().then(setPendingCount).catch(() => setPendingCount(0));
  }, []);

  const doSync = useCallback(async () => {
    const count = await getPendingCount();
    if (count === 0) return;

    setStatus("syncing");
    try {
      const synced = await syncQueue();
      if (synced > 0) {
        toast({
          title: "Sincronização concluída",
          description: `${synced} registro${synced > 1 ? "s" : ""} sincronizado${synced > 1 ? "s" : ""} com sucesso.`,
        });
      }
    } catch {
      toast({
        title: "Erro na sincronização",
        description: "Tentaremos novamente quando a conexão estiver estável.",
        variant: "destructive",
      });
    } finally {
      setStatus(navigator.onLine ? "online" : "offline");
      refreshPending();
    }
  }, [refreshPending]);

  // Carrega contagem inicial de pendentes
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus("online");
      doSync();
    };
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [doSync]);

  return { status, pendingCount, refreshPending, doSync };
}
