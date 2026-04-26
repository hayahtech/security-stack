import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Weight, ArrowLeft, Upload, Check, ChevronRight, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { mockAnimals, paddocks, age } from "@/data/rebanho-mock";
import { mockWeighings } from "@/data/animal-detail-mock";

type WeighRow = {
  animal_id: string;
  ear_tag: string;
  name: string;
  last_weight: number;
  last_date: string;
  new_weight: string;
  variation: number | null;
};

export default function PesagemLote() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);

  // Step 1
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paddock, setPaddock] = useState("");
  const [method, setMethod] = useState("balança");
  const [responsible, setResponsible] = useState("");

  // Step 2
  const [rows, setRows] = useState<WeighRow[]>([]);

  const animalsInPaddock = useMemo(
    () => mockAnimals.filter((a) => a.paddock === paddock && a.current_status === "ativo"),
    [paddock],
  );

  const initRows = () => {
    setRows(
      animalsInPaddock.map((a) => {
        const ws = mockWeighings
          .filter((w) => w.animal_id === a.id)
          .sort((x, y) => y.date.localeCompare(x.date));
        const last = ws[0];
        return {
          animal_id: a.id,
          ear_tag: a.ear_tag,
          name: a.name,
          last_weight: last?.weight_kg ?? a.current_weight,
          last_date: last?.date ?? "—",
          new_weight: "",
          variation: null,
        };
      }),
    );
  };

  const goToStep2 = () => {
    if (!paddock) { toast({ title: "Selecione um pasto", variant: "destructive" }); return; }
    if (!responsible.trim()) { toast({ title: "Informe o responsável", variant: "destructive" }); return; }
    initRows();
    setStep(2);
  };

  const updateWeight = (idx: number, val: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const num = parseFloat(val);
      return {
        ...r,
        new_weight: val,
        variation: !isNaN(num) && num > 0 ? num - r.last_weight : null,
      };
    }));
  };

  const filledRows = rows.filter((r) => r.new_weight && !isNaN(parseFloat(r.new_weight)));

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n").slice(1); // skip header
      setRows((prev) => {
        const updated = [...prev];
        lines.forEach((line) => {
          const [earTag, weightStr] = line.split(/[,;\t]/).map((s) => s.trim());
          const idx = updated.findIndex((r) => r.ear_tag.toLowerCase() === earTag.toLowerCase());
          if (idx >= 0 && weightStr) {
            const num = parseFloat(weightStr);
            if (!isNaN(num)) {
              updated[idx] = {
                ...updated[idx],
                new_weight: weightStr,
                variation: num - updated[idx].last_weight,
              };
            }
          }
        });
        return updated;
      });
      toast({ title: "CSV importado", description: `${lines.length} linhas processadas` });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    toast({
      title: "Pesagens salvas!",
      description: `${filledRows.length} pesagens registradas com sucesso.`,
    });
    navigate("/rebanho/pesagens");
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/rebanho/pesagens")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Weight className="h-6 w-6 text-primary" />
          Pesagem em Lote
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <Badge
              variant={step >= s ? "default" : "outline"}
              className={step >= s ? "bg-primary text-primary-foreground" : ""}
            >
              {s}
            </Badge>
            <span className={step >= s ? "font-medium text-foreground" : "text-muted-foreground"}>
              {s === 1 ? "Configuração" : s === 2 ? "Pesagem" : "Revisão"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Configuração da Pesagem</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Pasto / Paddock</Label>
                <Select value={paddock} onValueChange={setPaddock}>
                  <SelectTrigger><SelectValue placeholder="Selecionar pasto" /></SelectTrigger>
                  <SelectContent>
                    {paddocks.map((p) => {
                      const count = mockAnimals.filter((a) => a.paddock === p && a.current_status === "ativo").length;
                      return (
                        <SelectItem key={p} value={p}>
                          {p} ({count} animais)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Método</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balança">Balança</SelectItem>
                    <SelectItem value="fita">Fita Torácica</SelectItem>
                    <SelectItem value="visual">Estimativa Visual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Responsável</Label>
                <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nome do pesador" />
              </div>
            </div>
            {paddock && (
              <p className="text-sm text-muted-foreground">
                {animalsInPaddock.length} animais ativos no pasto selecionado
              </p>
            )}
            <div className="flex justify-end">
              <Button onClick={goToStep2} disabled={!paddock}>
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Pasto: <strong className="text-foreground">{paddock}</strong> • {rows.length} animais • {filledRows.length} pesados
              </p>
            </div>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1">
                <Upload className="h-3.5 w-3.5" /> Importar CSV
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eartag</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Último Peso</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right w-32">Peso Atual (kg)</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.animal_id}>
                      <TableCell className="font-mono font-semibold text-primary">{r.ear_tag}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right font-mono">{r.last_weight} kg</TableCell>
                      <TableCell className="text-muted-foreground">{r.last_date}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={r.new_weight}
                          onChange={(e) => updateWeight(i, e.target.value)}
                          className="w-28 text-right font-mono ml-auto"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.variation !== null && (
                          <span className={r.variation > 0 ? "text-emerald-600 dark:text-emerald-400" : r.variation < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                            {r.variation > 0 ? "+" : ""}{r.variation.toFixed(1)} kg
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <Button onClick={() => setStep(3)} disabled={filledRows.length === 0}>
              Revisar ({filledRows.length}) <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Revisão da Pesagem em Lote</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{date}</p></div>
                <div><p className="text-xs text-muted-foreground">Pasto</p><p className="font-medium">{paddock}</p></div>
                <div><p className="text-xs text-muted-foreground">Método</p><p className="font-medium capitalize">{method}</p></div>
                <div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-medium">{responsible}</p></div>
              </div>
              <Separator />
              <p className="text-sm font-semibold">{filledRows.length} pesagens a registrar</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eartag</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Peso Anterior</TableHead>
                    <TableHead className="text-right">Novo Peso</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filledRows.map((r) => (
                    <TableRow key={r.animal_id}>
                      <TableCell className="font-mono text-primary">{r.ear_tag}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right font-mono">{r.last_weight} kg</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{r.new_weight} kg</TableCell>
                      <TableCell className="text-right font-mono">
                        {r.variation !== null && (
                          <span className={r.variation > 0 ? "text-emerald-600 dark:text-emerald-400" : r.variation < 0 ? "text-red-600 dark:text-red-400" : ""}>
                            {r.variation > 0 ? "+" : ""}{r.variation.toFixed(1)} kg
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
            <Button onClick={handleConfirm} className="gap-2">
              <Check className="h-4 w-4" /> Confirmar {filledRows.length} Pesagens
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
