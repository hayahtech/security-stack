import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Beef, ArrowLeft, Edit, Weight, Stethoscope, MapPin, MoreHorizontal,
  Baby, TrendingUp, TrendingDown, Minus, Calendar, Droplets, DollarSign,
  Activity, ChevronRight, Syringe, Pill, Bug, Shield, ShieldAlert, ShieldCheck, QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  mockAnimals, speciesLabels, statusLabels, statusColors, age,
} from "@/data/rebanho-mock";
import {
  calcAnimalGmd, breedGmdBenchmark, gmdClassLabels, gmdClassColors,
} from "@/data/gmd-utils";
import {
  mockWeighings, mockTreatments, mockReproEvents, mockLocations,
  mockMilkYields, mockAnimalFinancials, getAnimalTimeline,
} from "@/data/animal-detail-mock";
import { getAnimalWithdrawals } from "@/data/withdrawal-utils";
import { getAnimalDevelopment, buildGrowthChartData, interpolateExpectedWeight } from "@/data/growth-curves";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { AnimalQrDialog } from "@/components/AnimalQrCode";

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const typeIcons: Record<string, React.ReactNode> = {
  pesagem: <Weight className="h-3.5 w-3.5 text-blue-500" />,
  tratamento: <Stethoscope className="h-3.5 w-3.5 text-red-500" />,
  reprodução: <Baby className="h-3.5 w-3.5 text-pink-500" />,
  movimentação: <MapPin className="h-3.5 w-3.5 text-amber-500" />,
  leite: <Droplets className="h-3.5 w-3.5 text-cyan-500" />,
};

const treatTypeLabels: Record<string, string> = {
  vacina: "Vacina", vermifugo: "Vermífugo", antibiotico: "Antibiótico",
  "anti-inflamatorio": "Anti-inflamatório", outro: "Outro",
};

const reproTypeLabels: Record<string, string> = {
  cobertura: "Cobertura", iatf: "IATF", diagnostico_prenhez: "Diagnóstico de Prenhez",
  parto: "Parto", aborto: "Aborto", desmame: "Desmame",
};

export default function AnimalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const animal = mockAnimals.find((a) => a.id === id);

  const [treatFilter, setTreatFilter] = useState("todos");
  const [showQr, setShowQr] = useState(false);

  const weighings = mockWeighings.filter((w) => w.animal_id === id).sort((a, b) => a.date.localeCompare(b.date));
  const treatments = mockTreatments.filter((t) => t.animal_id === id);
  const reproEvents = mockReproEvents.filter((r) => r.animal_id === id).sort((a, b) => b.date.localeCompare(a.date));
  const locations = mockLocations.filter((l) => l.animal_id === id).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  const milkYields = mockMilkYields.filter((m) => m.animal_id === id);
  const financials = mockAnimalFinancials.find((f) => f.animal_id === id);
  const timeline = getAnimalTimeline(id!).slice(0, 5);

  const lastWeight = weighings.length > 0 ? weighings[weighings.length - 1] : null;
  const prevWeight = weighings.length > 1 ? weighings[weighings.length - 2] : null;
  const weightDiff = lastWeight && prevWeight ? lastWeight.weight_kg - prevWeight.weight_kg : 0;

  const filteredTreatments = treatFilter === "todos"
    ? treatments
    : treatments.filter((t) => t.type === treatFilter);

  const currentLocation = locations.find((l) => !l.exit_date);

  // Milk daily aggregation
  const milkDaily = useMemo(() => {
    const map = new Map<string, number>();
    milkYields.forEach((m) => map.set(m.date, (map.get(m.date) || 0) + m.liters));
    return Array.from(map.entries()).map(([date, liters]) => ({ date, liters: +liters.toFixed(1) }));
  }, [milkYields]);

  if (!animal) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Animal não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/rebanho/animais")}>Voltar</Button>
      </div>
    );
  }

  const isFemale = animal.sex === "F";
  const isMale = animal.sex === "M";

  // Offspring for bulls
  const offspring = isMale
    ? mockAnimals.filter((a) => a.sire_id === animal.id)
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/rebanho/animais")} className="self-start gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Beef className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="text-lg px-3 py-1 font-mono font-bold bg-primary text-primary-foreground">
                  {animal.ear_tag}
                </Badge>
                <h1 className="text-xl font-bold text-foreground">{animal.name}</h1>
                <Badge variant="outline" className={statusColors[animal.current_status]}>
                  {statusLabels[animal.current_status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                <span>{speciesLabels[animal.species]}</span>
                <span>•</span>
                <span>{animal.breed}</span>
                <span>•</span>
                <span>{animal.sex === "M" ? "Macho" : "Fêmea"}</span>
                <span>•</span>
                <span>{age(animal.birth_date)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowQr(true)}><QrCode className="h-3.5 w-3.5" /> QR Code</Button>
            <Button variant="outline" size="sm" className="gap-1"><Edit className="h-3.5 w-3.5" /> Editar</Button>
            <Button variant="outline" size="sm" className="gap-1"><Weight className="h-3.5 w-3.5" /> Pesagem</Button>
            <Button variant="outline" size="sm" className="gap-1"><Stethoscope className="h-3.5 w-3.5" /> Tratamento</Button>
            <Button variant="outline" size="sm" className="gap-1"><MapPin className="h-3.5 w-3.5" /> Movimentar</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Registrar Evento Reprodutivo</DropdownMenuItem>
                <DropdownMenuItem>Registrar Ordenha</DropdownMenuItem>
                <DropdownMenuItem>Imprimir Ficha</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Dar Baixa</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="resumo">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="pesagens">Pesagens</TabsTrigger>
          <TabsTrigger value="saude">Saúde</TabsTrigger>
          {(isFemale || (isMale && animal.is_breeder)) && (
            <TabsTrigger value="reproducao">Reprodução</TabsTrigger>
          )}
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          {isFemale && <TabsTrigger value="leite">Leite</TabsTrigger>}
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        {/* ── ABA 1: RESUMO ── */}
        <TabsContent value="resumo" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Peso */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Peso Atual</p>
                <p className="text-2xl font-bold text-foreground">{animal.current_weight} kg</p>
                {lastWeight && prevWeight && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${weightDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : weightDiff < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {weightDiff > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : weightDiff < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                    {weightDiff > 0 ? "+" : ""}{weightDiff} kg vs última pesagem
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GMD */}
            {(() => {
              const gmdResult = calcAnimalGmd(animal.id);
              const benchmark = breedGmdBenchmark[animal.breed];
              if (!gmdResult) return (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">GMD Atual</p>
                    <p className="text-sm text-muted-foreground">Sem pesagens suficientes</p>
                  </CardContent>
                </Card>
              );
              const aboveBenchmark = benchmark ? gmdResult.gmd >= benchmark : null;
              return (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">GMD Atual</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-2xl font-bold font-mono text-foreground">{gmdResult.gmd.toFixed(3)}</p>
                      <span className="text-sm text-muted-foreground">kg/dia</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      últimos {gmdResult.days} dias
                    </p>
                    {benchmark != null && (
                      <div className={`flex items-center gap-1 text-xs mt-1 ${aboveBenchmark ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                        {aboveBenchmark ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {aboveBenchmark ? "Acima" : "Abaixo"} da média {animal.breed} ({benchmark.toFixed(2)})
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Development % card */}
            {(() => {
              const dev = getAnimalDevelopment(animal.id);
              if (!dev) return null;
              const color = dev.pct >= 95
                ? "text-emerald-600 dark:text-emerald-400"
                : dev.pct >= 80
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400";
              const bgColor = dev.pct >= 95
                ? "bg-emerald-500"
                : dev.pct >= 80
                ? "bg-amber-500"
                : "bg-red-500";
              return (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Desenvolvimento</p>
                    <p className={`text-2xl font-bold font-mono ${color}`}>{dev.pct}%</p>
                    <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${bgColor} transition-all`} style={{ width: `${Math.min(dev.pct, 120)}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      vs curva {animal.breed} ({dev.expected} kg esperado)
                    </p>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Pasto */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Pasto Atual</p>
                <p className="text-lg font-semibold text-foreground">{animal.paddock || "—"}</p>
                {currentLocation && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Desde {currentLocation.entry_date} ({currentLocation.days} dias)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Próximos Eventos */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Próximos Eventos</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span>Aftosa — Nov/2025</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bug className="h-3 w-3 text-amber-500" />
                    <span>Vermífugo — Ago/2025</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Último Evento Reprodutivo */}
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Último Evento Reprodutivo</p>
                {reproEvents.length > 0 ? (
                  <>
                    <p className="text-sm font-medium">{reproTypeLabels[reproEvents[0].event_type]}</p>
                    <p className="text-xs text-muted-foreground">{reproEvents[0].date} — {reproEvents[0].details}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum registro</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Últimos Eventos</CardTitle></CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((ev, i) => (
                    <div key={ev.id + i} className="flex items-start gap-3">
                      <div className="mt-0.5">{typeIcons[ev.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.description}</p>
                        <p className="text-xs text-muted-foreground">{ev.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 2: PESAGENS ── */}
        <TabsContent value="pesagens" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Evolução do Peso</h2>
            <Button size="sm" className="gap-1"><Weight className="h-3.5 w-3.5" /> Registrar Pesagem</Button>
          </div>

          {/* Growth curve chart */}
          {(() => {
            const chartData = buildGrowthChartData(id!);
            const dev = getAnimalDevelopment(id!);
            if (chartData.length === 0) return null;

            const aboveCurve = dev && dev.pct >= 95;

            return (
              <>
                {dev && (
                  <div className="flex items-center gap-2 text-sm">
                    {aboveCurve
                      ? <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300">Acima da curva ✅</Badge>
                      : <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300">Abaixo da curva ⚠️</Badge>
                    }
                    <span className="text-muted-foreground">Desenvolvimento: <span className="font-bold text-foreground">{dev.pct}%</span> da curva padrão</span>
                  </div>
                )}
                <Card>
                  <CardContent className="p-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                          <XAxis
                            dataKey="ageMonths"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            label={{ value: "Idade (meses)", position: "insideBottom", offset: -5, fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            label={{ value: "Peso (kg)", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                            formatter={(value: number, name: string) => {
                              if (value === null || value === undefined) return [null, null];
                              return [
                                `${value} kg`,
                                name === "real" ? "Peso Real" : "Peso Esperado",
                              ];
                            }}
                            labelFormatter={(label: number) => `${label} meses`}
                            content={({ active, payload, label }) => {
                              if (!active || !payload) return null;
                              const real = payload.find((p: { dataKey: string; value: number }) => p.dataKey === "real")?.value as number | undefined;
                              const expected = payload.find((p: { dataKey: string; value: number }) => p.dataKey === "expected")?.value as number | undefined;
                              const dateVal = payload[0]?.payload?.date;
                              const diff = real && expected ? Math.round(((real - expected) / expected) * 100) : null;
                              return (
                                <div className="bg-background border border-border rounded-lg p-2.5 shadow-md text-xs space-y-0.5">
                                  <p className="font-semibold">{label} meses</p>
                                  {dateVal && <p className="text-muted-foreground">Data: {dateVal}</p>}
                                  {real != null && <p className="text-emerald-600 dark:text-emerald-400">Peso Real: {real} kg</p>}
                                  {expected != null && <p className="text-blue-500">Esperado: {expected} kg</p>}
                                  {diff != null && (
                                    <p className={diff >= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                                      Diferença: {diff > 0 ? "+" : ""}{diff}%
                                    </p>
                                  )}
                                </div>
                              );
                            }}
                          />
                          <Legend
                            formatter={(value: string) => value === "expected" ? "Curva Esperada" : "Peso Real"}
                            wrapperStyle={{ fontSize: 12 }}
                          />
                          <Line
                            type="monotone" dataKey="expected" stroke="hsl(213, 78%, 55%)"
                            strokeWidth={2} strokeDasharray="8 4" dot={false}
                            connectNulls name="expected"
                          />
                          <Line
                            type="monotone" dataKey="real" stroke="hsl(var(--primary))"
                            strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                            connectNulls name="real"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead className="text-right">Peso (@)</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Pesador</TableHead>
                    <TableHead>Pasto</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weighings.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma pesagem registrada</TableCell></TableRow>
                  ) : (
                    [...weighings].reverse().map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>{w.date}</TableCell>
                        <TableCell className="text-right font-mono">{w.weight_kg}</TableCell>
                        <TableCell className="text-right font-mono">{w.weight_arroba.toFixed(1)}</TableCell>
                        <TableCell className="capitalize">{w.method}</TableCell>
                        <TableCell>{w.weighed_by}</TableCell>
                        <TableCell>{w.paddock}</TableCell>
                        <TableCell className="text-muted-foreground">{w.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 3: SAÚDE ── */}
        <TabsContent value="saude" className="space-y-4 mt-4">
          {/* Withdrawal Status Section */}
          {(() => {
            const withdrawals = getAnimalWithdrawals(id!);
            const activeWithdrawal = withdrawals.find((w) => w.inWithdrawal);
            return (
              <Card className={activeWithdrawal
                ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20"
                : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
              }>
                <CardContent className="p-4">
                  {activeWithdrawal ? (
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-orange-800 dark:text-orange-300">
                          ⚠️ Animal em Período de Carência
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Medicamento:</span> <span className="font-medium">{activeWithdrawal.medication}</span></p>
                          <p><span className="text-muted-foreground">Data de aplicação:</span> {activeWithdrawal.applicationDate}</p>
                          <p><span className="text-muted-foreground">Data de liberação:</span> <span className="font-semibold">{activeWithdrawal.releaseDate}</span></p>
                          <p><span className="text-muted-foreground">Dias restantes:</span> <span className="font-bold text-orange-700 dark:text-orange-400">{activeWithdrawal.remainingDays} dias</span></p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                        Animal liberado para abate/ordenha
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2 items-center">
              <h2 className="text-lg font-semibold text-foreground">Saúde</h2>
              <Select value={treatFilter} onValueChange={setTreatFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="vacina">Vacinas</SelectItem>
                  <SelectItem value="vermifugo">Vermífugos</SelectItem>
                  <SelectItem value="antibiotico">Antibióticos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="gap-1"><Stethoscope className="h-3.5 w-3.5" /> Registrar Tratamento</Button>
          </div>

          {/* Timeline */}
          <Card>
            <CardContent className="p-4">
              {filteredTreatments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum tratamento registrado</p>
              ) : (
                <div className="space-y-4">
                  {filteredTreatments.sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                    <div key={t.id} className="flex gap-3 items-start border-l-2 border-primary/30 pl-4">
                      <div className="mt-0.5">
                        {t.type === "vacina" ? <Shield className="h-4 w-4 text-blue-500" /> :
                          t.type === "vermifugo" ? <Bug className="h-4 w-4 text-amber-500" /> :
                          <Pill className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{t.medication}</span>
                          <Badge variant="outline" className="text-xs">{treatTypeLabels[t.type]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.date} • Dose: {t.dose} • Via: {t.route} • Aplicado por: {t.applied_by}
                          {t.withdrawal_days > 0 && ` • Carência: ${t.withdrawal_days} dias`}
                        </p>
                        {t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 4: REPRODUÇÃO ── */}
        {(isFemale || (isMale && animal.is_breeder)) && (
          <TabsContent value="reproducao" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">
                {isFemale ? "Histórico Reprodutivo" : "Filhos Registrados"}
              </h2>
              <Button size="sm" className="gap-1"><Baby className="h-3.5 w-3.5" /> Registrar Evento</Button>
            </div>

            {isFemale && (
              <Card>
                <CardContent className="p-4">
                  {reproEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                  ) : (
                    <div className="space-y-4">
                      {reproEvents.map((r) => (
                        <div key={r.id} className="flex gap-3 items-start border-l-2 border-pink-300 dark:border-pink-700 pl-4">
                          <Baby className="h-4 w-4 text-pink-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{reproTypeLabels[r.event_type]}</span>
                              {r.result && <Badge variant="outline" className="text-xs">{r.result}</Badge>}
                            </div>
                            <p className="text-sm text-foreground mt-0.5">{r.details}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.date}
                              {r.partner_ear_tag && ` • Parceiro: ${r.partner_ear_tag}`}
                            </p>
                            {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isMale && (
              <Card>
                <CardContent className="p-4">
                  {offspring.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum filho registrado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Eartag</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Sexo</TableHead>
                          <TableHead>Nascimento</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offspring.map((o) => (
                          <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/rebanho/animais/${o.id}`)}>
                            <TableCell className="font-mono font-semibold text-primary">{o.ear_tag}</TableCell>
                            <TableCell>{o.name}</TableCell>
                            <TableCell>{o.sex === "M" ? "Macho" : "Fêmea"}</TableCell>
                            <TableCell>{o.birth_date}</TableCell>
                            <TableCell><Badge variant="outline" className={statusColors[o.current_status]}>{statusLabels[o.current_status]}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* ── ABA 5: MOVIMENTAÇÕES ── */}
        <TabsContent value="movimentacoes" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
            <Button size="sm" className="gap-1"><MapPin className="h-3.5 w-3.5" /> Movimentar</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma movimentação</TableCell></TableRow>
                  ) : (
                    locations.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.paddock_from}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                        <TableCell className="font-medium">{l.paddock_to}</TableCell>
                        <TableCell>{l.entry_date}</TableCell>
                        <TableCell>{l.exit_date || <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Atual</Badge>}</TableCell>
                        <TableCell className="text-right font-mono">{l.days}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Paddock flow diagram */}
          {locations.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Histórico de Pastos</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {locations.slice().reverse().map((l, i, arr) => (
                    <React.Fragment key={l.id}>
                      <Badge variant="outline" className={!l.exit_date ? "border-primary bg-primary/10 text-primary" : ""}>
                        {l.paddock_to}
                        <span className="ml-1 text-xs text-muted-foreground">({l.days}d)</span>
                      </Badge>
                      {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ABA 6: LEITE ── */}
        {isFemale && (
          <TabsContent value="leite" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">Produção de Leite</h2>
              <Button size="sm" className="gap-1"><Droplets className="h-3.5 w-3.5" /> Registrar Ordenha</Button>
            </div>

            {milkDaily.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={milkDaily}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="liters" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Litros" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-right">Litros</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milkYields.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma ordenha registrada</TableCell></TableRow>
                    ) : (
                      [...milkYields].reverse().map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.date}</TableCell>
                          <TableCell className="capitalize">{m.shift}</TableCell>
                          <TableCell className="text-right font-mono">{m.liters.toFixed(1)}</TableCell>
                          <TableCell className="text-muted-foreground">{m.notes || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── ABA 7: FINANCEIRO ── */}
        <TabsContent value="financeiro" className="space-y-4 mt-4">
          <h2 className="text-lg font-semibold text-foreground">Financeiro</h2>

          {/* Sale details */}
          {financials?.sale && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Detalhes da Venda</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Comprador</p>
                    <p className="text-sm font-medium">{financials.sale.buyer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso Vendido</p>
                    <p className="text-sm font-mono">{financials.sale.sold_weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço / @</p>
                    <p className="text-sm font-mono">{fmt(financials.sale.price_per_arroba)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(financials.sale.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slaughter details */}
          {financials?.slaughter && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Detalhes do Abate</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="text-sm">{financials.slaughter.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso Vivo</p>
                    <p className="text-sm font-mono">{financials.slaughter.live_weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Peso Carcaça</p>
                    <p className="text-sm font-mono">{financials.slaughter.carcass_weight_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rendimento</p>
                    <p className="text-sm font-mono">{financials.slaughter.yield_pct}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Transações Vinculadas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!financials || financials.transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma transação vinculada</TableCell></TableRow>
                  ) : (
                    financials.transactions.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell className={`text-right font-mono ${tx.type === "receita" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {tx.type === "receita" ? "+" : "-"} {fmt(Math.abs(tx.amount))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AnimalQrDialog open={showQr} onOpenChange={setShowQr} animal={animal} />
    </div>
  );
}
