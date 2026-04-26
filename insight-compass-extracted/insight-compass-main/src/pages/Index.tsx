import { useState, useCallback, useEffect } from "react";
import { Search, FileDown, Shield, Eye, History, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { generateMockReport, type InvestigationReport } from "@/lib/mock-data";
import { InvestigationLoader } from "@/components/InvestigationLoader";
import { IdentityModule } from "@/components/modules/IdentityModule";
import { DomainModule } from "@/components/modules/DomainModule";
import { PresenceModule } from "@/components/modules/PresenceModule";
import { SecurityModule } from "@/components/modules/SecurityModule";
import { ReputationModule } from "@/components/modules/ReputationModule";
import { RiskModule } from "@/components/modules/RiskModule";
import { CompetitorModule } from "@/components/modules/CompetitorModule";
import { ConclusionModule } from "@/components/modules/ConclusionModule";
import { TimelineModule } from "@/components/modules/TimelineModule";
import { PeopleModule } from "@/components/modules/PeopleModule";

type AppState = "idle" | "loading" | "report";

interface HistoryEntry {
  query: string;
  timestamp: string;
  report: InvestigationReport;
}

const HISTORY_KEY = "osint_inspector_history";

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<AppState>("idle");
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  const handleInvestigate = () => {
    if (!query.trim()) return;
    setState("loading");
  };

  const handleLoadingComplete = useCallback(() => {
    const data = generateMockReport(query);
    setReport(data);
    setState("report");

    const entry: HistoryEntry = { query, timestamp: new Date().toISOString(), report: data };
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50);
      saveHistory(updated);
      return updated;
    });
  }, [query]);

  const handleNewSearch = () => {
    setState("idle");
    setReport(null);
    setQuery("");
    setShowHistory(false);
  };

  const handleViewHistoryEntry = (entry: HistoryEntry) => {
    setReport(entry.report);
    setQuery(entry.query);
    setState("report");
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleNewSearch}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center neon-glow-cyan">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">OSINT Inspector</h1>
                <p className="text-xs text-muted-foreground">Inteligência Digital & Due Diligence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {state === "report" && (
                <button onClick={handleNewSearch} className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                  Nova Investigação
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {state === "idle" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto neon-glow-cyan">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground neon-text-cyan">OSINT Inspector</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Análise automatizada de reputação, segurança e infraestrutura digital. Insira um domínio, empresa ou CNPJ.
                </p>
              </div>
              <div className="w-full max-w-xl">
                <div className="glass-strong p-2 flex gap-2 neon-glow-cyan">
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvestigate()}
                      placeholder="ex: canapolis.mg.gov.br, Empresa XYZ, 12.345.678/0001-90"
                      className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm py-3"
                    />
                  </div>
                  <button
                    onClick={handleInvestigate}
                    disabled={!query.trim()}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Investigar
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                {["WHOIS", "DNS", "SSL", "Headers", "Wayback Machine", "Reputação"].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-muted/50 border border-border">{tag}</span>
                ))}
              </div>

              {/* History button */}
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg glass border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="w-4 h-4" />
                  Histórico de Buscas ({history.length})
                </button>
              )}

              {/* History panel */}
              {showHistory && history.length > 0 && (
                <div className="w-full max-w-xl glass-strong p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <History className="w-4 h-4 text-primary" /> Investigações Anteriores
                    </h3>
                    <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {history.map((entry, i) => (
                      <button
                        key={i}
                        onClick={() => handleViewHistoryEntry(entry)}
                        className="w-full text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{entry.query}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {new Date(entry.timestamp).toLocaleString("pt-BR")}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {state === "loading" && <InvestigationLoader onComplete={handleLoadingComplete} />}

          {state === "report" && report && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Report header */}
              <div className="glass-strong p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">Relatório gerado em {new Date(report.timestamp).toLocaleString("pt-BR")}</p>
                  <h2 className="text-xl font-bold text-foreground mt-1">{report.identity.name}</h2>
                  <p className="text-sm text-muted-foreground font-mono">{report.domain.domain}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <FileDown className="w-4 h-4" /> Exportar PDF
                </button>
              </div>

              <ConclusionModule data={report.conclusion} />
              <RiskModule data={report.risk} />
              <IdentityModule data={report.identity} />
              <PeopleModule report={report} />
              <DomainModule data={report.domain} />
              <SecurityModule data={report.security} />
              <PresenceModule data={report.presence} />
              <ReputationModule data={report.reputation} />
              <CompetitorModule data={report.competitors} />
              <TimelineModule data={report.timeline} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
