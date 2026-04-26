import { Shield, Lock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { SecurityAnalysis } from "@/lib/mock-data";

export function SecurityModule({ data }: { data: SecurityAnalysis }) {
  const headersPresent = data.headers.filter((h) => h.present).length;
  const headersTotal = data.headers.length;

  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Shield className="w-5 h-5" /> Segurança
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${data.https ? "bg-success/10" : "bg-destructive/10"}`}>
            <Lock className={`w-5 h-5 ${data.https ? "text-success" : "text-destructive"}`} />
            <span className="text-sm font-medium text-foreground">HTTPS {data.https ? "Ativo" : "Inativo"}</span>
          </div>
          <div className={`flex items-center gap-3 p-3 rounded-lg ${data.secureCookies ? "bg-success/10" : "bg-warning/10"}`}>
            <Shield className={`w-5 h-5 ${data.secureCookies ? "text-success" : "text-warning"}`} />
            <span className="text-sm font-medium text-foreground">Cookies Seguros: {data.secureCookies ? "Sim" : "Parcial"}</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Headers de Segurança ({headersPresent}/{headersTotal})</p>
            <div className="space-y-1">
              {data.headers.map((h) => (
                <div key={h.name} className="flex items-center gap-2 text-xs">
                  {h.present ? <CheckCircle className="w-3 h-3 text-success shrink-0" /> : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="font-mono text-foreground">{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {data.exposedEndpoints.length > 0 && (
            <div className="p-3 rounded-lg bg-warning/10">
              <p className="text-xs text-warning font-medium mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Endpoints Expostos</p>
              {data.exposedEndpoints.map((ep) => (
                <p key={ep} className="text-xs font-mono text-foreground">{ep}</p>
              ))}
            </div>
          )}
          {data.vulnerabilities.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10">
              <p className="text-xs text-destructive font-medium mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vulnerabilidades</p>
              {data.vulnerabilities.map((v) => (
                <p key={v} className="text-xs text-foreground">{v}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
