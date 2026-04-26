import { Monitor, History, Share2, Smartphone, CheckCircle, XCircle } from "lucide-react";
import type { DigitalPresence } from "@/lib/mock-data";

export function PresenceModule({ data }: { data: DigitalPresence }) {
  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Monitor className="w-5 h-5" /> Presença Digital
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <Monitor className={`w-8 h-8 mx-auto mb-2 ${data.siteActive ? "text-success" : "text-destructive"}`} />
          <p className="text-sm font-medium text-foreground">{data.siteActive ? "Site Ativo" : "Site Inativo"}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <History className="w-8 h-8 mx-auto mb-2 text-neon-purple" />
          <p className="text-2xl font-bold font-mono text-foreground">{data.waybackSnapshots}</p>
          <p className="text-xs text-muted-foreground">Snapshots (Wayback)</p>
          <p className="text-xs text-muted-foreground">Desde {data.firstSeen}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 text-center">
          <Smartphone className="w-8 h-8 mx-auto mb-2 text-neon-cyan" />
          <p className="text-sm font-medium text-foreground">{data.apps.length} App(s)</p>
          {data.apps.map((app) => (
            <p key={app.name} className="text-xs text-muted-foreground">{app.store}: ⭐ {app.rating}</p>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2"><Share2 className="w-4 h-4" /> Redes Sociais</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.socialMedia.map((s) => (
            <div key={s.platform} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${s.active ? "bg-success/10 text-success" : "bg-muted/30 text-muted-foreground"}`}>
              {s.active ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              {s.platform}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
