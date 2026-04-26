import React, { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Filter, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  calcAllGmd, gmdClassLabels, gmdClassColors, classifyGmd, breedGmdBenchmark,
  type GmdResult, type GmdClassification,
} from "@/data/gmd-utils";
import { paddocks } from "@/data/rebanho-mock";

export default function GmdReport() {
  const [fPaddock, setFPaddock] = useState("todos");
  const [fBreed, setFBreed] = useState("todas");

  const allResults = useMemo(() => calcAllGmd(), []);
  const allBreeds = useMemo(() => {
    const set = new Set(allResults.map((r) => r.breed));
    return Array.from(set).sort();
  }, [allResults]);

  const filtered = useMemo(() => {
    let list = allResults;
    if (fPaddock !== "todos") list = list.filter((r) => r.paddock === fPaddock);
    if (fBreed !== "todas") list = list.filter((r) => r.breed === fBreed);
    return list.sort((a, b) => b.gmd - a.gmd);
  }, [allResults, fPaddock, fBreed]);

  // Stats
  const avgGmd = filtered.length > 0
    ? Number((filtered.reduce((s, r) => s + r.gmd, 0) / filtered.length).toFixed(3))
    : 0;
  const bestAnimal = filtered.length > 0 ? filtered[0] : null;
  const worstAnimal = filtered.length > 0 ? filtered[filtered.length - 1] : null;

  // Histogram
  const histogram = useMemo(() => {
    const bins = [
      { range: "< 0.2", min: -Infinity, max: 0.2, count: 0 },
      { range: "0.2–0.4", min: 0.2, max: 0.4, count: 0 },
      { range: "0.4–0.6", min: 0.4, max: 0.6, count: 0 },
      { range: "0.6–0.8", min: 0.6, max: 0.8, count: 0 },
      { range: "0.8–1.0", min: 0.8, max: 1.0, count: 0 },
      { range: "≥ 1.0", min: 1.0, max: Infinity, count: 0 },
    ];
    filtered.forEach((r) => {
      const bin = bins.find((b) => r.gmd >= b.min && r.gmd < b.max);
      if (bin) bin.count++;
    });
    return bins;
  }, [filtered]);

  const histColors = ["hsl(0, 84%, 60%)", "hsl(25, 95%, 53%)", "hsl(45, 93%, 47%)", "hsl(142, 50%, 55%)", "hsl(142, 50%, 45%)", "hsl(142, 71%, 35%)"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Relatório de GMD
        </h1>
        <p className="text-sm text-muted-foreground">
          Ganho Médio Diário por animal — análise do lote
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground">Pasto</label>
              <Select value={fPaddock} onValueChange={setFPaddock}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[150px]">
              <label className="text-xs text-muted-foreground">Raça</label>
              <Select value={fBreed} onValueChange={setFBreed}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {allBreeds.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {filtered.length} animal{filtered.length !== 1 ? "is" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">GMD Médio do Lote</p>
            <p className="text-3xl font-bold font-mono text-primary">{avgGmd.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">kg/dia</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Maior GMD</p>
            {bestAnimal ? (
              <>
                <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {bestAnimal.gmd.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">{bestAnimal.earTag} — {bestAnimal.name}</p>
              </>
            ) : <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Menor GMD</p>
            {worstAnimal ? (
              <>
                <p className="text-2xl font-bold font-mono text-destructive">
                  {worstAnimal.gmd.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground">{worstAnimal.earTag} — {worstAnimal.name}</p>
              </>
            ) : <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>
      </div>

      {/* Histogram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de GMD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <RTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${v} animais`, "Quantidade"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogram.map((_, i) => (
                    <Cell key={i} fill={histColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Eartag</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Raça</TableHead>
                <TableHead className="text-right">Peso Inicial</TableHead>
                <TableHead className="text-right">Peso Final</TableHead>
                <TableHead className="text-right">Dias</TableHead>
                <TableHead className="text-right">GMD (kg/dia)</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>vs Raça</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    Nenhum animal com pesagens suficientes
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const benchmark = breedGmdBenchmark[r.breed];
                  const aboveBenchmark = benchmark ? r.gmd >= benchmark : null;
                  return (
                    <TableRow key={r.animalId}>
                      <TableCell className="font-mono font-semibold text-primary">{r.earTag}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.breed}</TableCell>
                      <TableCell className="text-right font-mono">{r.weightInitial} kg</TableCell>
                      <TableCell className="text-right font-mono">{r.weightFinal} kg</TableCell>
                      <TableCell className="text-right font-mono">{r.days}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{r.gmd.toFixed(3)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={gmdClassColors[r.classification]}>
                          {gmdClassLabels[r.classification]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {benchmark != null ? (
                          <span className={cn("flex items-center gap-1 text-xs font-medium",
                            aboveBenchmark ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                            {aboveBenchmark ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {((r.gmd - benchmark) / benchmark * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
