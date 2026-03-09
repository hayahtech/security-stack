import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, User, Layers, AlertTriangle } from "lucide-react";
import { entities, type Entity } from "@/mock/costCentersData";
import { cn } from "@/lib/utils";

const typeIcons: Record<Entity["type"], typeof Building2> = {
  empresa: Building2,
  holding: Layers,
  pessoa_fisica: User,
  consolidado: Layers,
};

const typeLabels: Record<Entity["type"], string> = {
  empresa: "Empresa",
  holding: "Holding",
  pessoa_fisica: "PF",
  consolidado: "Grupo",
};

export function EntitySelector() {
  const [selected, setSelected] = useState<Entity>(entities[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 bg-muted/50 border-border hover:bg-muted h-8 text-xs max-w-[180px]">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected.color }} />
          <span className="font-data truncate">{selected.name}</span>
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-card border-border">
        <div className="px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-data">Selecionar Entidade</p>
        </div>
        {entities.map((entity, i) => {
          const Icon = typeIcons[entity.type];
          const isConsolidado = entity.type === "consolidado";
          return (
            <div key={entity.id}>
              {isConsolidado && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => setSelected(entity)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  selected.id === entity.id && "bg-muted"
                )}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entity.color }} />
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-data truncate">{entity.name}</p>
                  <p className="text-[10px] text-muted-foreground font-data">{entity.cnpjCpf}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">{typeLabels[entity.type]}</Badge>
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
