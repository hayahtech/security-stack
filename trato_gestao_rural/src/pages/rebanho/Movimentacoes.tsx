import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, ArrowLeft, Check, ChevronRight, Eye, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { mockAnimals, paddocks, speciesLabels, statusLabels, statusColors } from "@/data/rebanho-mock";

// Mock movement history
interface MovementRecord {
  id: string;
  date: string;
  from: string;
  to: string;
  count: number;
  responsible: string;
  notes: string;
  animal_ids: string[];
}

const mockMovements: MovementRecord[] = [
  { id: "mv-1", date: "2025-02-15", from: "Pasto Norte", to: "Pasto Leste", count: 3, responsible: "Carlos", notes: "Rotação de pasto", animal_ids: ["an-1", "an-6", "an-9"] },
  { id: "mv-2", date: "2025-01-20", from: "Curral 1", to: "Pasto Sul", count: 1, responsible: "João", notes: "", animal_ids: ["an-2"] },
  { id: "mv-3", date: "2024-12-10", from: "Pasto Sul", to: "Pasto Grande", count: 2, responsible: "Carlos", notes: "Confinamento encerrado", animal_ids: ["an-9", "an-7"] },
];

export default function Movimentacoes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("nova");

  // Form state
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // History detail
  const [detailMov, setDetailMov] = useState<MovementRecord | null>(null);

  const animalsInOrigin = useMemo(
    () => mockAnimals.filter((a) => a.paddock === origin && a.current_status === "ativo"),
    [origin],
  );

  const availableDestinations = useMemo(
    () => paddocks.filter((p) => p !== origin),
    [origin],
  );

  const toggleAnimal = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === animalsInOrigin.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(animalsInOrigin.map((a) => a.id)));
    }
  };

  const handleConfirm = () => {
    if (!origin || !destination) { toast({ title: "Selecione origem e destino", variant: "destructive" }); return; }
    if (selected.size === 0) { toast({ title: "Selecione ao menos um animal", variant: "destructive" }); return; }
    if (!responsible.trim()) { toast({ title: "Informe o responsável", variant: "destructive" }); return; }
    toast({
      title: "Movimentação registrada!",
      description: `${selected.size} animais movidos de ${origin} para ${destination}.`,
    });
    setOrigin(""); setDestination(""); setSelected(new Set()); setNotes(""); setResponsible("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Movimentações de Pasto
        </h1>
        <p className="text-sm text-muted-foreground">
          Registre movimentações de animais entre pastos e visualize o histórico
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nova">Nova Movimentação</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* ── NOVA MOVIMENTAÇÃO ── */}
        <TabsContent value="nova" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Dados da Movimentação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Pasto de Origem</Label>
                  <Select value={origin} onValueChange={(v) => { setOrigin(v); setSelected(new Set()); setDestination(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {paddocks.map((p) => {
                        const count = mockAnimals.filter((a) => a.paddock === p && a.current_status === "ativo").length;
                        return <SelectItem key={p} value={p}>{p} ({count})</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Pasto de Destino</Label>
                  <Select value={destination} onValueChange={setDestination} disabled={!origin}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {availableDestinations.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Responsável</Label>
                  <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nome" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Motivo da movimentação..." className="min-h-[60px]" />
              </div>
            </CardContent>
          </Card>

          {/* Animal Selection */}
          {origin && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Selecionar Animais</CardTitle>
                  <Badge variant="secondary">
                    {selected.size} de {animalsInOrigin.length} selecionados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={animalsInOrigin.length > 0 && selected.size === animalsInOrigin.length}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Eartag</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Espécie</TableHead>
                      <TableHead>Raça</TableHead>
                      <TableHead className="text-right">Peso (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animalsInOrigin.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum animal ativo neste pasto
                        </TableCell>
                      </TableRow>
                    ) : (
                      animalsInOrigin.map((a) => (
                        <TableRow
                          key={a.id}
                          className={selected.has(a.id) ? "bg-primary/5" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selected.has(a.id)}
                              onCheckedChange={() => toggleAnimal(a.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-primary">{a.ear_tag}</TableCell>
                          <TableCell>{a.name}</TableCell>
                          <TableCell>{speciesLabels[a.species]}</TableCell>
                          <TableCell>{a.breed}</TableCell>
                          <TableCell className="text-right font-mono">{a.current_weight}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Confirm */}
          {origin && selected.size > 0 && destination && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Mover <strong className="text-foreground">{selected.size}</strong> animais de{" "}
                <strong className="text-foreground">{origin}</strong> para{" "}
                <strong className="text-foreground">{destination}</strong>
              </p>
              <Button onClick={handleConfirm} className="gap-2">
                <Check className="h-4 w-4" /> Confirmar Movimentação
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── HISTÓRICO ── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>De</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead className="text-right">Nº Animais</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.date}</TableCell>
                      <TableCell>{m.from}</TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-medium">{m.to}</TableCell>
                      <TableCell className="text-right font-mono">{m.count}</TableCell>
                      <TableCell>{m.responsible}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{m.notes || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setDetailMov(m)} className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailMov} onOpenChange={() => setDetailMov(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
          </DialogHeader>
          {detailMov && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{detailMov.date}</p></div>
                <div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-medium">{detailMov.responsible}</p></div>
                <div><p className="text-xs text-muted-foreground">Origem</p><p className="font-medium">{detailMov.from}</p></div>
                <div><p className="text-xs text-muted-foreground">Destino</p><p className="font-medium">{detailMov.to}</p></div>
              </div>
              {detailMov.notes && (
                <div><p className="text-xs text-muted-foreground">Notas</p><p className="text-sm">{detailMov.notes}</p></div>
              )}
              <Separator />
              <p className="text-sm font-semibold">{detailMov.count} Animais</p>
              <div className="space-y-2">
                {detailMov.animal_ids.map((aid) => {
                  const a = mockAnimals.find((x) => x.id === aid);
                  if (!a) return null;
                  return (
                    <div key={aid} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{a.ear_tag}</span>
                        <span>{a.name}</span>
                      </div>
                      <Badge variant="outline" className={statusColors[a.current_status]}>
                        {statusLabels[a.current_status]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
