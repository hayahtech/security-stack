import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type NetworkStatus } from "@/hooks/use-network-status";

interface Props {
  status: NetworkStatus;
  pendingCount: number;
  onSync: () => void;
}

export function NetworkStatusIndicator({ status, pendingCount, onSync }: Props) {
  if (status === "online" && pendingCount === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Wifi className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Online</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>Conectado — tudo sincronizado</TooltipContent>
      </Tooltip>
    );
  }

  if (status === "syncing") {
    return (
      <div className="flex items-center gap-1.5 text-primary">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-xs hidden sm:inline">Sincronizando...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive hidden sm:inline">Offline</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">{pendingCount}</Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>{pendingCount} registro{pendingCount !== 1 ? "s" : ""} pendente{pendingCount !== 1 ? "s" : ""}</TooltipContent>
      </Tooltip>
    );
  }

  // Online with pending items
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-yellow-600 dark:text-yellow-400" onClick={onSync}>
          <RefreshCw className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">{pendingCount} pendentes</span>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{pendingCount}</Badge>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Clique para sincronizar {pendingCount} registro{pendingCount !== 1 ? "s" : ""}</TooltipContent>
    </Tooltip>
  );
}
