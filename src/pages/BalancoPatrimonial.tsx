import { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, Calendar, Download, FileText, Mail, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { balanceSheetData, balanceSheetPeriods, formatPeriodLabel, calculateIndicators, type BalanceSheetLine } from "@/mock/balanceSheetData";

function formatCurrency(value: number) {
  const absValue = Math.abs(value);
  return absValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

interface BalanceLineProps {
  line: BalanceSheetLine;
  periods: string[];
  showVertical: boolean;
  showHorizontal: boolean;
  totalAsset: Record<string, number>;
  onDrillDown: (line: BalanceSheetLine) => void;
}

function BalanceLine({ line, periods, showVertical, showHorizontal, totalAsset, onDrillDown }: BalanceLineProps) {
  const isNegative = Object.values(line.values).some(v => v < 0);
  
  return (
    <div
      className={`grid gap-2 py-2 px-3 rounded-lg transition-colors ${
        line.isTotal 
          ? "bg-primary/10 font-bold border-t-2 border-primary/30 mt-2" 
          : line.isGroup 
            ? "bg-muted/30 font-semibold border-t border-border mt-3" 
            : "hover:bg-muted/20 cursor-pointer"
      }`}
      style={{ 
        gridTemplateColumns: `${200 + (line.indent || 0) * 0}px repeat(${periods.length}, 1fr)${showVertical ? ' 80px' : ''}${showHorizontal ? ' 80px' : ''}`,
        paddingLeft: `${12 + (line.indent || 0) * 20}px`
      }}
      onClick={() => !line.isTotal && !line.isGroup && onDrillDown(line)}
    >
      <div className={`text-sm truncate ${line.isDeduction ? "text-destructive" : ""}`}>
        {line.label}
      </div>
      {periods.map((period, i) => (
        <div key={period} className={`text-right font-data text-sm ${line.isDeduction || line.values[period] < 0 ? "text-destructive" : ""}`}>
          {line.values[period] < 0 ? `(${formatCurrency(line.values[period])})` : formatCurrency(line.values[period])}
        </div>
      ))}
      {showVertical && (
        <div className="text-right text-xs text-muted-foreground font-data">
          {!line.isTotal && totalAsset[periods[periods.length - 1]] 
            ? formatPercent((line.values[periods[periods.length - 1]] / totalAsset[periods[periods.length - 1]]) * 100) 
            : "—"
          }
        </div>
      )}
      {showHorizontal && periods.length > 1 && (
        <div className="text-right text-xs font-data flex items-center justify-end gap-1">
          {(() => {
            const prev = line.values[periods[periods.length - 2]];
            const curr = line.values[periods[periods.length - 1]];
            if (!prev || prev === 0) return "—";
            const change = ((curr - prev) / Math.abs(prev)) * 100;
            const isUp = change >= 0;
            return (
              <span className={isUp ? "text-emerald-400" : "text-destructive"}>
                {isUp ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                {formatPercent(Math.abs(change))}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function BalancoPatrimonial() {
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(["2024-12", "2025-03", "2025-06"]);
  const [showVertical, setShowVertical] = useState(true);
  const [showHorizontal, setShowHorizontal] = useState(true);
  const [drillDownLine, setDrillDownLine] = useState<BalanceSheetLine | null>(null);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);

  const currentPeriod = selectedPeriods[selectedPeriods.length - 1];
  const indicators = useMemo(() => calculateIndicators(currentPeriod), [currentPeriod]);

  const totalAsset = useMemo(() => {
    const line = balanceSheetData.assets.find(l => l.id === "total-ativo");
    return line?.values || {};
  }, []);

  const totalPassivoPL = useMemo(() => {
    const line = balanceSheetData.equity.find(l => l.id === "total-passivo-pl");
    return line?.values || {};
  }, []);

  const isBalanced = totalAsset[currentPeriod] === totalPassivoPL[currentPeriod];
  const diff = Math.abs((totalAsset[currentPeriod] || 0) - (totalPassivoPL[currentPeriod] || 0));

  const handleExportPDF = () => toast.success("Balanço exportado para PDF no padrão CFC");
  const handleExportExcel = () => toast.success("Balanço exportado para Excel com fórmulas");
  const handleSendEmail = () => {
    toast.success("E-mail enviado para o contador");
    setSendEmailOpen(false);
  };

  const handleDrillDown = (line: BalanceSheetLine) => setDrillDownLine(line);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Balanço Patrimonial</h1>
          <p className="text-sm text-muted-foreground font-data mt-1">
            Demonstração da posição financeira da empresa
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <FileText className="w-4 h-4" /> PDF (CFC)
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" /> Excel
          </Button>
          <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="w-4 h-4" /> Enviar para Contador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Balanço Patrimonial</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  <p className="font-semibold">Destinatário:</p>
                  <p className="text-muted-foreground">contador@escritoriocontabil.com.br</p>
                  <p className="font-semibold mt-3">Assunto:</p>
                  <p className="text-muted-foreground">Balanço Patrimonial - {formatPeriodLabel(currentPeriod)} - TechBR Ltda</p>
                  <p className="font-semibold mt-3">Anexos:</p>
                  <p className="text-muted-foreground">balanco_patrimonial_{currentPeriod}.pdf</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSendEmailOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSendEmail}>Enviar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance badge */}
      <Card className={isBalanced ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}>
        <CardContent className="py-3 flex items-center gap-3">
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold">
                ✅ Balanço equilibrado — Total Ativo = Total Passivo + PL: {formatCurrency(totalAsset[currentPeriod] || 0)}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                ❌ Balanço desequilibrado — Diferença de {formatCurrency(diff)}
              </span>
            </>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Períodos:</Label>
              <div className="flex gap-2">
                {balanceSheetPeriods.map(p => (
                  <Badge
                    key={p}
                    variant={selectedPeriods.includes(p) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedPeriods.includes(p)) {
                        if (selectedPeriods.length > 1) setSelectedPeriods(selectedPeriods.filter(x => x !== p));
                      } else {
                        setSelectedPeriods([...selectedPeriods, p].sort());
                      }
                    }}
                  >
                    {formatPeriodLabel(p)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showVertical} onCheckedChange={setShowVertical} id="vertical" />
              <Label htmlFor="vertical" className="text-sm">Análise Vertical (%)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={showHorizontal} onCheckedChange={setShowHorizontal} id="horizontal" />
              <Label htmlFor="horizontal" className="text-sm">Análise Horizontal (Δ%)</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet - Two columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ATIVO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              ATIVO
            </CardTitle>
            <div className="grid gap-2 text-xs text-muted-foreground font-semibold mt-2 border-b border-border pb-2"
              style={{ 
                gridTemplateColumns: `200px repeat(${selectedPeriods.length}, 1fr)${showVertical ? ' 80px' : ''}${showHorizontal ? ' 80px' : ''}` 
              }}
            >
              <div>Conta</div>
              {selectedPeriods.map(p => <div key={p} className="text-right">{formatPeriodLabel(p)}</div>)}
              {showVertical && <div className="text-right">AV%</div>}
              {showHorizontal && <div className="text-right">AH%</div>}
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-0">
            {balanceSheetData.assets.map(line => (
              <BalanceLine
                key={line.id}
                line={line}
                periods={selectedPeriods}
                showVertical={showVertical}
                showHorizontal={showHorizontal}
                totalAsset={totalAsset}
                onDrillDown={handleDrillDown}
              />
            ))}
          </CardContent>
        </Card>

        {/* PASSIVO + PL */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              PASSIVO + PATRIMÔNIO LÍQUIDO
            </CardTitle>
            <div className="grid gap-2 text-xs text-muted-foreground font-semibold mt-2 border-b border-border pb-2"
              style={{ 
                gridTemplateColumns: `200px repeat(${selectedPeriods.length}, 1fr)${showVertical ? ' 80px' : ''}${showHorizontal ? ' 80px' : ''}` 
              }}
            >
              <div>Conta</div>
              {selectedPeriods.map(p => <div key={p} className="text-right">{formatPeriodLabel(p)}</div>)}
              {showVertical && <div className="text-right">AV%</div>}
              {showHorizontal && <div className="text-right">AH%</div>}
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-0">
            {balanceSheetData.liabilities.map(line => (
              <BalanceLine
                key={line.id}
                line={line}
                periods={selectedPeriods}
                showVertical={showVertical}
                showHorizontal={showHorizontal}
                totalAsset={totalAsset}
                onDrillDown={handleDrillDown}
              />
            ))}
            {balanceSheetData.equity.map(line => (
              <BalanceLine
                key={line.id}
                line={line}
                periods={selectedPeriods}
                showVertical={showVertical}
                showHorizontal={showHorizontal}
                totalAsset={totalAsset}
                onDrillDown={handleDrillDown}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Indicadores Calculados Automaticamente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Índice de Endividamento", value: indicators.indiceEndividamento, info: "Passivo Total / (Passivo + PL)" },
              { label: "Participação Capital de Terceiros", value: indicators.participacaoCapitalTerceiros, info: "Passivo Total / PL" },
              { label: "Imobilização do PL", value: indicators.imobilizacaoPL, info: "Imobilizado Líquido / PL" },
              { label: "Grau de Imobilização", value: indicators.grauImobilizacao, info: "Ativo Não Circulante / Ativo Total" },
            ].map((ind) => (
              <div key={ind.label} className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs text-muted-foreground">{ind.label}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{ind.info}</TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold font-data text-primary">{formatPercent(ind.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drill-down dialog */}
      <Dialog open={!!drillDownLine} onOpenChange={() => setDrillDownLine(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhamento: {drillDownLine?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lançamentos que compõem o saldo de <strong>{drillDownLine?.label}</strong> em {formatPeriodLabel(currentPeriod)}:
            </p>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-lg font-bold font-data text-primary">
                Saldo: {formatCurrency(drillDownLine?.values[currentPeriod] || 0)}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>📊 Integração com Diário Contábil ativa — clique em qualquer lançamento para ver detalhes completos.</p>
              <p className="mt-2 italic">(Funcionalidade de drill-down conectada ao módulo de lançamentos contábeis)</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
