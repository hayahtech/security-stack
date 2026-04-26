import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getDbErrorMessage } from "@/lib/utils";
import { Calculator, Settings, FileText, History } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import QuoteDialog from "@/components/QuoteDialog";
import SavedQuotesDialog from "@/components/SavedQuotesDialog";
import { MotionDiv, staggerContainer, fadeUp, scaleIn } from "@/lib/motion";

const complexityLevels = [
  { value: 0.8, label: "Baixa" },
  { value: 1.0, label: "Média" },
  { value: 1.5, label: "Alta" },
  { value: 2.0, label: "Muito Alta" },
];

const fmtInput = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseInput = (v: string) => { const cleaned = v.replace(/\./g, "").replace(",", "."); const num = parseFloat(cleaned); return isNaN(num) ? 0 : num; };

const CalculatorPage = () => {
  const { user } = useAuth();
  const [hourlyRate, setHourlyRate] = useState(100);
  const [hours, setHours] = useState(10);
  const [complexityIndex, setComplexityIndex] = useState(1);
  const [extraCosts, setExtraCosts] = useState(0);
  const [extraCostsDescription, setExtraCostsDescription] = useState("");
  const [marginPercent, setMarginPercent] = useState(20);
  const [hourlyRateStr, setHourlyRateStr] = useState(fmtInput(100));
  const [extraCostsStr, setExtraCostsStr] = useState(fmtInput(0));
  const [params, setParams] = useState({ hourly_rate: 100, min_margin: 20, default_complexity: 1.0 });
  const [showParams, setShowParams] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("pricing_params").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setParams({ hourly_rate: Number(data.hourly_rate), min_margin: Number(data.min_margin), default_complexity: Number(data.default_complexity) });
        setHourlyRate(Number(data.hourly_rate)); setHourlyRateStr(fmtInput(Number(data.hourly_rate)));
        setMarginPercent(Number(data.min_margin));
        const idx = complexityLevels.findIndex(l => l.value === Number(data.default_complexity));
        if (idx >= 0) setComplexityIndex(idx);
      }
    });
  }, [user]);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [savedQuotesOpen, setSavedQuotesOpen] = useState(false);
  const complexity = complexityLevels[complexityIndex];
  const basePrice = hourlyRate * hours * complexity.value;
  const margin = basePrice * (marginPercent / 100);
  const suggestedPrice = basePrice + margin + extraCosts;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => { setHourlyRateStr(e.target.value); setHourlyRate(parseInput(e.target.value)); };
  const handleHourlyRateBlur = () => setHourlyRateStr(fmtInput(hourlyRate));
  const handleHourlyRateFocus = (e: React.FocusEvent<HTMLInputElement>) => { if (hourlyRate === 0) setHourlyRateStr(""); else setHourlyRateStr(hourlyRate.toString()); setTimeout(() => e.target.select(), 0); };
  const handleExtraCostsChange = (e: React.ChangeEvent<HTMLInputElement>) => { setExtraCostsStr(e.target.value); setExtraCosts(parseInput(e.target.value)); };
  const handleExtraCostsBlur = () => setExtraCostsStr(fmtInput(extraCosts));
  const handleExtraCostsFocus = (e: React.FocusEvent<HTMLInputElement>) => { if (extraCosts === 0) setExtraCostsStr(""); else setExtraCostsStr(extraCosts.toString()); setTimeout(() => e.target.select(), 0); };

  const saveParams = async () => {
    if (!user) return;
    const payload = { user_id: user.id, hourly_rate: params.hourly_rate, min_margin: params.min_margin, default_complexity: params.default_complexity };
    const { error } = await supabase.from("pricing_params").upsert(payload, { onConflict: "user_id" });
    if (error) { toast({ title: "Erro", description: getDbErrorMessage(error), variant: "destructive" }); } else {
      toast({ title: "Parâmetros salvos!" }); setHourlyRate(params.hourly_rate); setHourlyRateStr(fmtInput(params.hourly_rate)); setMarginPercent(params.min_margin);
      const idx = complexityLevels.findIndex(l => l.value === params.default_complexity); if (idx >= 0) setComplexityIndex(idx);
    }
  };

  return (
    <MotionDiv className="space-y-8" initial="hidden" animate="show" variants={staggerContainer}>
      <MotionDiv variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-extrabold text-foreground tracking-tight">Calculadora de Precificação</h1>
          <p className="text-sm font-light text-muted-foreground">Estime o valor ideal do seu projeto</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSavedQuotesOpen(true)} className="gap-2 font-medium"><History className="h-4 w-4" /> Orçamentos</Button>
          <Button variant="outline" onClick={() => setShowParams(!showParams)} className="gap-2 font-medium"><Settings className="h-4 w-4" /> Parâmetros</Button>
        </div>
      </MotionDiv>

      <div className="grid gap-8 lg:grid-cols-2">
        <MotionDiv variants={fadeUp}>
          <Card className="border-border">
            <CardHeader><CardTitle className="flex items-center gap-2 font-semibold"><Calculator className="h-5 w-5 text-primary" /> Calculadora</CardTitle></CardHeader>
            <CardContent className="space-y-7">
              <div className="space-y-2"><Label className="font-normal">Valor/hora (R$)</Label><Input type="text" value={hourlyRateStr} onChange={handleHourlyRateChange} onBlur={handleHourlyRateBlur} onFocus={handleHourlyRateFocus} /></div>
              <div className="space-y-2"><Label className="font-medium">Horas estimadas</Label><Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} /></div>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label className="font-medium">Complexidade</Label><span className="text-sm font-medium text-primary">{complexity.label} (x{complexity.value})</span></div>
                <Slider value={[complexityIndex]} onValueChange={(v) => setComplexityIndex(v[0])} min={0} max={complexityLevels.length - 1} step={1} />
                <div className="flex justify-between text-xs font-normal text-muted-foreground">{complexityLevels.map((l) => <span key={l.label}>{l.label}</span>)}</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label className="font-medium">Margem de lucro</Label><span className="text-sm font-medium text-primary">{marginPercent}%</span></div>
                <Slider value={[marginPercent]} onValueChange={(v) => setMarginPercent(v[0])} min={0} max={100} step={1} />
                <div className="flex justify-between text-xs font-normal text-muted-foreground"><span>0%</span><span>50%</span><span>100%</span></div>
              </div>
              <div className="space-y-2"><Label className="font-normal">Custos adicionais (R$)</Label><Input type="text" value={extraCostsStr} onChange={handleExtraCostsChange} onBlur={handleExtraCostsBlur} onFocus={handleExtraCostsFocus} /></div>
              <div className="space-y-2"><Label className="font-normal">Descrição dos custos adicionais</Label><Textarea placeholder="Ex: Licenças, hospedagem, domínio, serviços terceirizados..." value={extraCostsDescription} onChange={(e) => setExtraCostsDescription(e.target.value)} className="min-h-[60px]" /></div>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={scaleIn} className="space-y-8">
          <Card className="border-border glow-cyan transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardContent className="p-10 text-center overflow-hidden">
              <p className="text-sm font-normal text-muted-foreground mb-3">Preço Sugerido</p>
              <p className="text-5xl font-extrabold text-primary truncate tracking-tight">R$ {fmt(suggestedPrice)}</p>
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-left max-w-xs mx-auto">
                <p className="font-normal text-muted-foreground">Base</p><p className="font-medium text-foreground text-right">R$ {fmt(basePrice)}</p>
                <p className="font-normal text-muted-foreground">Complexidade</p><p className="font-medium text-foreground text-right">{complexity.label} (x{complexity.value})</p>
                <p className="font-normal text-muted-foreground">Margem ({marginPercent}%)</p><p className="font-medium text-foreground text-right">R$ {fmt(margin)}</p>
                {extraCosts > 0 && (<><p className="font-normal text-muted-foreground">Custos extras</p><p className="font-medium text-foreground text-right">R$ {fmt(extraCosts)}</p></>)}
              </div>
              {extraCostsDescription && extraCosts > 0 && <p className="mt-3 text-xs font-normal text-muted-foreground italic">{extraCostsDescription}</p>}
              <Button onClick={() => setQuoteOpen(true)} className="mt-8 gap-2 w-full font-medium py-3 hover:shadow-lg transition-all"><FileText className="h-4 w-4" /> Gerar Orçamento</Button>
            </CardContent>
          </Card>

          <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} data={{ hourlyRate, hours, complexityLabel: complexity.label, complexityValue: complexity.value, basePrice, marginPercent, marginValue: margin, extraCosts, extraCostsDescription, suggestedPrice }} />
          <SavedQuotesDialog open={savedQuotesOpen} onOpenChange={setSavedQuotesOpen} />

          {showParams && (
            <MotionDiv variants={fadeUp} initial="hidden" animate="show">
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg font-semibold">Parâmetros Padrão</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2"><Label className="font-normal">Valor/hora padrão (R$)</Label><Input type="number" step="0.01" value={params.hourly_rate} onChange={(e) => setParams({ ...params, hourly_rate: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label className="font-normal">Margem mínima (%)</Label><Input type="number" step="1" min="0" max="100" value={params.min_margin} onChange={(e) => setParams({ ...params, min_margin: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label className="font-normal">Complexidade padrão</Label><Input type="number" step="0.1" value={params.default_complexity} onChange={(e) => setParams({ ...params, default_complexity: Number(e.target.value) })} /></div>
                  <Button onClick={saveParams} className="font-medium">Salvar Parâmetros</Button>
                </CardContent>
              </Card>
            </MotionDiv>
          )}
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default CalculatorPage;
