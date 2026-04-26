import { Globe, Server, Shield, Wifi } from "lucide-react";
import type { DomainInfo } from "@/lib/mock-data";

export function DomainModule({ data }: { data: DomainInfo }) {
  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Globe className="w-5 h-5" /> Domínio e Infraestrutura
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <InfoRow label="Domínio" value={data.domain} />
          <InfoRow label="IP Atual" value={data.currentIp} mono />
          <InfoRow label="Hosting" value={data.hostingProvider} />
          <InfoRow label="CDN" value={data.cdn} />
          <InfoRow label="País do Servidor" value={data.serverCountry} />
          <InfoRow label="HTTP Status" value={`${data.httpStatus} OK`} success />
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">DNS Records</p>
            <div className="space-y-1">
              <p className="text-xs font-mono text-foreground">A: {data.dns.a.join(", ")}</p>
              <p className="text-xs font-mono text-foreground">MX: {data.dns.mx.join(", ")}</p>
              <p className="text-xs font-mono text-foreground">NS: {data.dns.ns.join(", ")}</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
            <Shield className={`w-5 h-5 ${data.sslValid ? "text-success" : "text-destructive"}`} />
            <div>
              <p className="text-xs text-muted-foreground">SSL Certificate</p>
              <p className="text-sm font-medium text-foreground">{data.sslValid ? "Válido" : "Inválido"} — {data.sslIssuer}</p>
              <p className="text-xs text-muted-foreground">Expira: {data.sslExpiry}</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">IPs Históricos</p>
            <div className="flex flex-wrap gap-1">
              {data.historicalIps.map((ip) => (
                <span key={ip} className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{ip}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, success }: { label: string; value: string; mono?: boolean; success?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono" : ""} ${success ? "text-success" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
