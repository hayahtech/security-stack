import { Radio } from "lucide-react";
import { useDevices } from "@/contexts/DeviceContext";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

export function DeviceStatusIndicator() {
  const { connectedCount, hasActiveConnection, lastEid } = useDevices();

  if (!hasActiveConnection) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="relative flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
          <Radio className="h-4 w-4 text-primary animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {connectedCount}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs max-w-64">
        <p className="font-semibold">{connectedCount} dispositivo{connectedCount !== 1 ? "s" : ""} conectado{connectedCount !== 1 ? "s" : ""}</p>
        {lastEid && (
          <p className="text-muted-foreground mt-1">
            Último EID: <span className="font-mono text-foreground">{lastEid.eid}</span>
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
