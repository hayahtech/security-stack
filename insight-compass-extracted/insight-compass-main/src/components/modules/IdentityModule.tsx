import { Building2, MapPin, Users, Briefcase, Calendar } from "lucide-react";
import type { CompanyIdentity } from "@/lib/mock-data";

export function IdentityModule({ data }: { data: CompanyIdentity }) {
  const items = [
    { icon: Building2, label: "Razão Social", value: data.name },
    { icon: Briefcase, label: "CNPJ", value: data.cnpj },
    { icon: MapPin, label: "Localização", value: data.location },
    { icon: Users, label: "Sócios", value: data.partners.join(", ") },
    { icon: Briefcase, label: "Porte", value: data.size },
    { icon: Briefcase, label: "Atividade", value: data.activity },
    { icon: Calendar, label: "Fundação", value: data.foundedDate },
  ];

  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Building2 className="w-5 h-5" /> Identidade da Empresa
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
