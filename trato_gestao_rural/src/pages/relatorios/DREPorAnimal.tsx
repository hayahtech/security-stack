import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnimalDRE {
  eartag: string;
  nome: string;
  raca: string;
  sexo: string;
  origem: string;
  dataEntrada: string;
  dataSaida: string;
  diasSistema: number;
  pesoEntrada: number;
  pesoSaida: number;
  ganhoKg: number;
  ganhoArroba: number;
  gmd: number;
  receita: number;
  custoAquisicao: number;
  custoAlimentacao: number;
  custoSanidade: number;
  custoManejo: number;
  custoTotal: number;
  resultado: number;
  roi: number;
  custoArroba: number;
  receitaArroba: number;
  margemArroba: number;
}

const animaisVendidos: AnimalDRE[] = [
  {
    eartag: "BOV-001", nome: "Netuno", raca: "Nelore", sexo: "M", origem: "Nascido",
    dataEntrada: "2023-03-10", dataSaida: "2025-01-15", diasSistema: 677,
    pesoEntrada: 180, pesoSaida: 540, ganhoKg: 360, ganhoArroba: 24, gmd: 0.532,
    receita: 7440, custoAquisicao: 0, custoAlimentacao: 2880, custoSanidade: 350, custoManejo: 420,
    custoTotal: 3650, resultado: 3790, roi: 103.8, custoArroba: 152.08, receitaArroba: 310, margemArroba: 157.92,
  },
  {
    eartag: "BOV-005", nome: "Estrela", raca: "Angus", sexo: "F", origem: "Comprado",
    dataEntrada: "2023-06-20", dataSaida: "2024-12-10", diasSistema: 539,
    pesoEntrada: 220, pesoSaida: 480, ganhoKg: 260, ganhoArroba: 17.3, gmd: 0.482,
    receita: 5363, custoAquisicao: 1800, custoAlimentacao: 2150, custoSanidade: 280, custoManejo: 380,
    custoTotal: 4610, resultado: 753, roi: 16.3, custoArroba: 266.47, receitaArroba: 310, margemArroba: 43.53,
  },
  {
    eartag: "BOV-012", nome: "Trovão", raca: "Nelore", sexo: "M", origem: "Comprado",
    dataEntrada: "2023-01-05", dataSaida: "2024-11-20", diasSistema: 685,
    pesoEntrada: 250, pesoSaida: 580, ganhoKg: 330, ganhoArroba: 22, gmd: 0.482,
    receita: 6820, custoAquisicao: 2200, custoAlimentacao: 2750, custoSanidade: 320, custoManejo: 400,
    custoTotal: 5670, resultado: 1150, roi: 20.3, custoArroba: 257.73, receitaArroba: 310, margemArroba: 52.27,
  },
  {
    eartag: "BOV-018", nome: "Mimosa", raca: "Girolando", sexo: "F", origem: "Nascido",
    dataEntrada: "2023-04-15", dataSaida: "2025-02-01", diasSistema: 657,
    pesoEntrada: 160, pesoSaida: 420, ganhoKg: 260, ganhoArroba: 17.3, gmd: 0.396,
    receita: 5363, custoAquisicao: 0, custoAlimentacao: 2400, custoSanidade: 450, custoManejo: 350,
    custoTotal: 3200, resultado: 2163, roi: 67.6, custoArroba: 184.97, receitaArroba: 310, margemArroba: 125.03,
  },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DREPorAnimal() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AnimalDRE | null>(null);
  const [sortCol, setSortCol] = useState<keyof AnimalDRE>("resultado");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = animaisVendidos.filter(a =>
    a.eartag.toLowerCase().includes(search.toLowerCase()) ||
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] as number;
    const vb = b[sortCol] as number;
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const toggleSort = (col: keyof AnimalDRE) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const media = {
    dias: Math.round(sorted.reduce((s, a) => s + a.diasSistema, 0) / sorted.length),
    gmd: sorted.reduce((s, a) => s + a.gmd, 0) / sorted.length,
    custo: sorted.reduce((s, a) => s + a.custoTotal, 0) / sorted.length,
    receita: sorted.reduce((s, a) => s + a.receita, 0) / sorted.length,
    resultado: sorted.reduce((s, a) => s + a.resultado, 0) / sorted.length,
    roi: sorted.reduce((s, a) => s + a.roi, 0) / sorted.length,
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por eartag ou nome..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {selected && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">DRE — {selected.eartag} ({selected.nome})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Raça:</span> {selected.raca}</div>
              <div><span className="text-muted-foreground">Sexo:</span> {selected.sexo === "M" ? "Macho" : "Fêmea"}</div>
              <div><span className="text-muted-foreground">Origem:</span> {selected.origem}</div>
              <div><span className="text-muted-foreground">Dias no sistema:</span> {selected.diasSistema}</div>
              <div><span className="text-muted-foreground">Entrada:</span> {selected.dataEntrada}</div>
              <div><span className="text-muted-foreground">Saída:</span> {selected.dataSaida}</div>
              <div><span className="text-muted-foreground">Peso entrada:</span> {selected.pesoEntrada} kg</div>
              <div><span className="text-muted-foreground">Peso saída:</span> {selected.pesoSaida} kg</div>
            </div>
            <Separator />
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">(+) Receita de Venda</span><span className="text-foreground">{fmt(selected.receita)}</span></div>
              {selected.custoAquisicao > 0 && <div className="flex justify-between"><span className="text-muted-foreground">(-) Custo de Aquisição</span><span className="text-destructive">{fmt(selected.custoAquisicao)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">(-) Alimentação proporcional</span><span className="text-destructive">{fmt(selected.custoAlimentacao)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">(-) Sanidade (vacinas/tratamentos)</span><span className="text-destructive">{fmt(selected.custoSanidade)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">(-) Manejos e pesagens</span><span className="text-destructive">{fmt(selected.custoManejo)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>(=) Resultado Bruto</span>
                <span className={selected.resultado >= 0 ? "text-primary" : "text-destructive"}>
                  {fmt(selected.resultado)}
                </span>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Ganho Total", value: `${selected.ganhoKg} kg (${selected.ganhoArroba.toFixed(1)}@)` },
                { label: "GMD Médio", value: `${selected.gmd.toFixed(3)} kg/dia` },
                { label: "Custo por @", value: fmt(selected.custoArroba) },
                { label: "Receita por @", value: fmt(selected.receitaArroba) },
                { label: "Margem por @", value: fmt(selected.margemArroba) },
                { label: "ROI do Animal", value: `${selected.roi.toFixed(1)}%` },
              ].map(item => (
                <Card key={item.label}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-bold text-foreground">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparativo de Lote */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo de Lote — Animais Vendidos/Abatidos</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Eartag</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("diasSistema")}>
                  <span className="flex items-center gap-1">Dias <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("gmd")}>
                  <span className="flex items-center gap-1">GMD <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("custoTotal")}>
                  <span className="flex items-center gap-1 justify-end">Custo <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("receita")}>
                  <span className="flex items-center gap-1 justify-end">Receita <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("resultado")}>
                  <span className="flex items-center gap-1 justify-end">Resultado <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("roi")}>
                  <span className="flex items-center gap-1 justify-end">ROI% <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(a => (
                <TableRow key={a.eartag} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(a)}>
                  <TableCell className="font-medium">{a.eartag}<br /><span className="text-xs text-muted-foreground">{a.nome}</span></TableCell>
                  <TableCell>{a.diasSistema}</TableCell>
                  <TableCell>{a.gmd.toFixed(3)}</TableCell>
                  <TableCell className="text-right">{fmt(a.custoTotal)}</TableCell>
                  <TableCell className="text-right">{fmt(a.receita)}</TableCell>
                  <TableCell className="text-right">
                    <span className={a.resultado >= 0 ? "text-primary" : "text-destructive"}>{fmt(a.resultado)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={a.roi >= 50 ? "default" : a.roi >= 0 ? "secondary" : "destructive"}>
                      {a.roi.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-medium border-t-2">
                <TableCell>MÉDIA DO LOTE</TableCell>
                <TableCell>{media.dias}</TableCell>
                <TableCell>{media.gmd.toFixed(3)}</TableCell>
                <TableCell className="text-right">{fmt(media.custo)}</TableCell>
                <TableCell className="text-right">{fmt(media.receita)}</TableCell>
                <TableCell className="text-right">{fmt(media.resultado)}</TableCell>
                <TableCell className="text-right">{media.roi.toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
