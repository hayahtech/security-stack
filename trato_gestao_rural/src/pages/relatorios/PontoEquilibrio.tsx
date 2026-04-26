import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceDot, ReferenceArea } from "recharts";
import { CheckCircle, XCircle, Target, AlertTriangle } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function PontoEquilibrio() {
  const [precoArroba, setPrecoArroba] = useState(310);
  const [animaisMes, setAnimaisMes] = useState(15);
  const [custoFixo, setCustoFixo] = useState(18000);
  const custoVariavelUnit = 160;

  const pesoMedioVenda = 540;
  const arrobasPorAnimal = pesoMedioVenda / 15 * 0.52;
  const arrobasMes = animaisMes * arrobasPorAnimal;

  const precoEquilibrio = custoFixo / arrobasMes + custoVariavelUnit;
  const qtdEquilibrio = custoFixo / (precoArroba - custoVariavelUnit);
  const animaisEquilibrio = Math.ceil(qtdEquilibrio / arrobasPorAnimal);

  const arrobasVendidasMes = 210;
  const progressoPct = Math.min((arrobasVendidasMes / qtdEquilibrio) * 100, 100);

  const receitaEstimada = arrobasMes * precoArroba;
  const custoEstimado = custoFixo + custoVariavelUnit * arrobasMes;
  const resultadoEstimado = receitaEstimada - custoEstimado;

  // Gráfico do ponto de equilíbrio
  const pontoX = Math.round(qtdEquilibrio);
  const chartData = Array.from({ length: 20 }, (_, i) => {
    const qty = Math.round(pontoX * 0.2 * (i + 1));
    return {
      qtd: qty,
      receita: qty * precoArroba,
      custo: custoFixo + custoVariavelUnit * qty,
    };
  });

  const chartConfig = {
    receita: { label: "Receita Total", color: "hsl(199 89% 48%)" },
    custo: { label: "Custo Total", color: "hsl(0 84% 60%)" },
  };

  const comLucro = precoArroba > precoEquilibrio;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select defaultValue="ano">
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="ano">Ano</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="pecuaria">
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pecuaria">Pecuária</SelectItem>
            <SelectItem value="leite">Leite</SelectItem>
            <SelectItem value="piscicultura">Piscicultura</SelectItem>
            <SelectItem value="agricultura">Agricultura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={comLucro ? "border-primary/30" : "border-destructive/30"}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              {comLucro ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
              <span className="text-sm font-medium text-foreground">Preço Mínimo da @</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(precoEquilibrio)}</p>
            <p className="text-sm text-muted-foreground mt-1">Preço atual: {fmt(precoArroba)}</p>
            <Badge variant={comLucro ? "default" : "destructive"} className="mt-2">
              {comLucro ? "✅ Operando com lucro" : "❌ Operando no prejuízo"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Arrobas Mínimas/Mês</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{qtdEquilibrio.toFixed(0)} @</p>
            <p className="text-sm text-muted-foreground mt-1">Vendidas este mês: {arrobasVendidasMes} @</p>
            <div className="mt-2">
              <Progress value={progressoPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{arrobasVendidasMes} de {qtdEquilibrio.toFixed(0)} @ vendidas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Animais Mínimos/Mês</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{animaisEquilibrio} animais</p>
            <p className="text-sm text-muted-foreground mt-1">Baseado no peso médio de {pesoMedioVenda}kg</p>
            <p className="text-sm text-muted-foreground">e GMD médio do rebanho</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Gráfico do Ponto de Equilíbrio</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="qtd" tick={{ fontSize: 11 }} tickFormatter={v => `${v}@`} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* Áreas de lucro/prejuízo */}
              <ReferenceArea x1={chartData[0]?.qtd} x2={pontoX} fill="hsl(0 84% 60%)" fillOpacity={0.05} />
              <ReferenceArea x1={pontoX} x2={chartData[chartData.length - 1]?.qtd} fill="hsl(142 71% 45%)" fillOpacity={0.05} />
              <Line type="monotone" dataKey="receita" stroke="hsl(199 89% 48%)" strokeWidth={2} dot={false} name="Receita Total" />
              <Line type="monotone" dataKey="custo" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} name="Custo Total" />
              <ReferenceDot x={pontoX} y={pontoX * precoArroba} r={6} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Ponto de equilíbrio: <strong>{pontoX} arrobas</strong> ({fmt(pontoX * precoArroba)})
          </p>
        </CardContent>
      </Card>

      {/* Simulador */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Simulador Interativo</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Preço da @ (R$): {fmt(precoArroba)}</Label>
                <Slider value={[precoArroba]} onValueChange={v => setPrecoArroba(v[0])} min={150} max={500} step={5} className="mt-2" />
              </div>
              <div>
                <Label className="text-sm">Animais vendidos/mês: {animaisMes}</Label>
                <Slider value={[animaisMes]} onValueChange={v => setAnimaisMes(v[0])} min={1} max={50} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-sm">Custo fixo mensal (R$)</Label>
                <Input type="number" value={custoFixo} onChange={e => setCustoFixo(Number(e.target.value))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Card className={resultadoEstimado >= 0 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Resultado Estimado Mensal</p>
                  <p className={`text-3xl font-bold ${resultadoEstimado >= 0 ? "text-primary" : "text-destructive"}`}>
                    {fmt(resultadoEstimado)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Receita: {fmt(receitaEstimada)} | Custo: {fmt(custoEstimado)}
                  </p>
                  <Badge variant={resultadoEstimado >= 0 ? "default" : "destructive"} className="mt-3">
                    {resultadoEstimado >= 0 ? "✅ Lucro" : "❌ Prejuízo"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
