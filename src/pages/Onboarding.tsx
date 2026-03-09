import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { segments, companySize, roles, concerns, segmentConfig } from "@/mock/onboardingData";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const toggleConcern = (id: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const canProceed = () => {
    if (step === 1) return !!selectedSegment;
    if (step === 2) return !!selectedSize;
    if (step === 3) return !!selectedRole;
    if (step === 4) return selectedConcerns.length > 0;
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else setShowResult(true);
  };

  const config = segmentConfig[selectedSegment] || segmentConfig.outro;
  const segmentLabel = segments.find((s) => s.id === selectedSegment)?.label || "";
  const sizeLabel = companySize.find((s) => s.id === selectedSize)?.label || "";

  if (showResult) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-border/50 bg-card/90 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Perfeito! Tudo configurado.</h2>
              <p className="text-muted-foreground font-data">
                FinanceOS configurado para <span className="text-primary font-semibold">{segmentLabel}</span> de{" "}
                <span className="text-primary font-semibold">{sizeLabel}</span> com foco em{" "}
                <span className="text-primary font-semibold">{config.focusLabel}</span>
              </p>
            </div>

            <div className="space-y-3">
              {[
                `✅ Plano de contas padrão ${segmentLabel} importado (${config.accounts} contas)`,
                `✅ KPIs do dashboard priorizados: ${config.kpis.join(", ")}`,
                `✅ Sidebar reorganizada: módulos mais usados por ${segmentLabel} no topo`,
                `✅ Dados de exemplo do setor carregados`,
                `✅ Tour guiado personalizado criado`,
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-data text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center font-data">{config.tips}</p>

            <Button className="w-full gap-2" onClick={() => navigate("/")}>
              Começar a usar o FinanceOS <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-border/50 bg-card/90 overflow-hidden">
        <div className="h-2 bg-muted">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-data">Passo {step} de {totalSteps}</p>
            <Badge variant="outline" className="text-xs font-data">{Math.round(progress)}%</Badge>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="font-display text-xl font-bold text-foreground">Vamos configurar o FinanceOS para a sua empresa</h2>
                <p className="text-muted-foreground text-sm font-data">Qual o segmento principal do seu negócio?</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {segments.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSegment(s.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all duration-200 hover:border-primary/50",
                      selectedSegment === s.id ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/50"
                    )}
                  >
                    <span className="text-2xl block mb-1">{s.icon}</span>
                    <span className="text-sm font-data text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="font-display text-xl font-bold text-foreground">Qual o porte atual da empresa?</h2>
                <p className="text-muted-foreground text-sm font-data">Isso ajuda a calibrar os indicadores e alertas</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {companySize.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSize(s.id)}
                    className={cn(
                      "p-5 rounded-xl border-2 text-center transition-all duration-200 hover:border-primary/50",
                      selectedSize === s.id ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/50"
                    )}
                  >
                    <span className="text-base font-data font-semibold text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="font-display text-xl font-bold text-foreground">Qual sua função?</h2>
                <p className="text-muted-foreground text-sm font-data">Personalizamos a experiência para o seu perfil</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all duration-200 hover:border-primary/50",
                      selectedRole === r.id ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/50"
                    )}
                  >
                    <span className="text-sm font-data font-semibold text-foreground">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="font-display text-xl font-bold text-foreground">O que mais te preocupa hoje?</h2>
                <p className="text-muted-foreground text-sm font-data">Selecione até 3 prioridades</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {concerns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleConcern(c.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-primary/50 flex items-center gap-3",
                      selectedConcerns.includes(c.id) ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card/50"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      selectedConcerns.includes(c.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {selectedConcerns.includes(c.id) && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm font-data text-foreground">{c.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center font-data">{selectedConcerns.length}/3 selecionadas</p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-1">
              {step === 4 ? "Finalizar" : "Próximo"} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
