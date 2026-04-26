import { useEffect, useState } from "react";
import { Shield, Search, Server, FileText } from "lucide-react";

const stages = [
  { icon: Search, text: "Coletando dados...", color: "text-neon-cyan" },
  { icon: Server, text: "Analisando infraestrutura...", color: "text-neon-purple" },
  { icon: Shield, text: "Verificando segurança...", color: "text-neon-amber" },
  { icon: FileText, text: "Gerando relatório...", color: "text-primary" },
];

interface InvestigationLoaderProps {
  onComplete: () => void;
}

export function InvestigationLoader({ onComplete }: InvestigationLoaderProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage < stages.length - 1) {
      const timer = setTimeout(() => setStage((s) => s + 1), 1200);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  const current = stages[stage];
  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center gap-8 py-20">
      <div className="relative">
        <div className="w-24 h-24 rounded-full glass flex items-center justify-center neon-glow-cyan">
          <Icon className={`w-10 h-10 ${current.color} animate-pulse-neon`} />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      </div>
      <div className="text-center space-y-2">
        <p className={`text-lg font-semibold ${current.color} neon-text-cyan`}>{current.text}</p>
        <div className="flex gap-1 justify-center">
          {stages.map((_, i) => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= stage ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
