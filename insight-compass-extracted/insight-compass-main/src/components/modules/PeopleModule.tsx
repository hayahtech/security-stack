import { Users, User, Briefcase, Globe, Building2 } from "lucide-react";
import type { InvestigationReport } from "@/lib/mock-data";

interface PersonFound {
  name: string;
  role: string;
  source: string;
  icon: typeof User;
}

function extractPeople(report: InvestigationReport): PersonFound[] {
  const people: PersonFound[] = [];
  const seen = new Set<string>();

  // Partners from identity
  for (const partner of report.identity.partners) {
    if (!seen.has(partner)) {
      seen.add(partner);
      people.push({ name: partner, role: "Sócio / Administrador", source: "Registro Empresarial", icon: Briefcase });
    }
  }

  // Technical contacts (simulated from domain)
  const techContacts = [
    { name: `Admin - ${report.domain.hostingProvider}`, role: "Responsável Técnico (Hosting)", source: "WHOIS / Hosting" },
    { name: `Registrante DNS (${report.domain.dns.ns[0]})`, role: "Responsável DNS", source: "DNS Records" },
  ];

  for (const tc of techContacts) {
    if (!seen.has(tc.name)) {
      seen.add(tc.name);
      people.push({ ...tc, icon: Globe });
    }
  }

  // Simulated additional people
  const extras = [
    { name: "Roberto Mendes", role: "Responsável Técnico do Site", source: "WHOIS", icon: Globe },
    { name: "Ana Paula Costa", role: "Contato Administrativo", source: "Registro.br", icon: Building2 },
  ];

  for (const e of extras) {
    if (!seen.has(e.name)) {
      seen.add(e.name);
      people.push(e);
    }
  }

  return people;
}

export function PeopleModule({ report }: { report: InvestigationReport }) {
  const people = extractPeople(report);

  return (
    <div className="glass p-6 space-y-4">
      <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Users className="w-5 h-5" /> Pessoas Envolvidas & Vinculadas
      </h3>
      <p className="text-xs text-muted-foreground">
        Todos os nomes encontrados, vinculados ou expostos durante a investigação.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {people.map((person, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <person.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground">{person.role}</p>
              <p className="text-xs text-primary/70 font-mono mt-1">Fonte: {person.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
