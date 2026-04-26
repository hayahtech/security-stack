import React, { useState } from "react";
import {
  Tractor, Plus, Check, MapPin, Beef, Leaf, Edit,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useFazenda, typeLabels, type Fazenda } from "@/contexts/FazendaContext";

const typeOptions: Fazenda["type"][] = ["corte", "leite", "misto", "suino", "avicola"];

export default function MinhasFazendas() {
  const { fazendas, activeFazenda, setActiveFazendaId } = useFazenda();
  const [showForm, setShowForm] = useState(false);

  // Form
  const [fName, setFName] = useState("");
  const [fCity, setFCity] = useState("");
  const [fState, setFState] = useState("");
  const [fArea, setFArea] = useState("");
  const [fType, setFType] = useState<Fazenda["type"]>("misto");
  const [fNotes, setFNotes] = useState("");

  const save = () => {
    if (!fName.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    toast({ title: "Fazenda cadastrada!", description: fName });
    setShowForm(false);
    setFName(""); setFCity(""); setFState(""); setFArea(""); setFNotes("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tractor className="h-6 w-6 text-primary" />
            Minhas Fazendas
          </h1>
          <p className="text-sm text-muted-foreground">
            {fazendas.length} fazenda{fazendas.length !== 1 ? "s" : ""} cadastrada{fazendas.length !== 1 ? "s" : ""}
            {activeFazenda && (
              <> • Ativa: <strong className="text-foreground">{activeFazenda.name}</strong></>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Nova Fazenda
        </Button>
      </div>

      {/* Farm Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {fazendas.map((faz) => {
          const isActive = activeFazenda?.id === faz.id;
          return (
            <Card
              key={faz.id}
              className={`transition-all ${isActive ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}>
                      <Tractor className={`h-5 w-5 ${isActive ? "" : "text-primary"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{faz.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {faz.city}/{faz.state}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <Badge className="bg-primary text-primary-foreground">Ativa</Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{faz.area_ha}</p>
                    <p className="text-xs text-muted-foreground">hectares</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{faz.pastures_count}</p>
                    <p className="text-xs text-muted-foreground">pastos</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{faz.animals_count}</p>
                    <p className="text-xs text-muted-foreground">animais</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline">{typeLabels[faz.type]}</Badge>
                  {!isActive ? (
                    <Button variant="outline" size="sm" onClick={() => setActiveFazendaId(faz.id)}>
                      Selecionar
                    </Button>
                  ) : (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Selecionada
                    </span>
                  )}
                </div>

                {faz.notes && (
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{faz.notes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Fazenda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Ex: Fazenda Esperança" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Município</Label>
                <Input value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="Uberaba" />
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Input value={fState} onChange={(e) => setFState(e.target.value)} placeholder="MG" maxLength={2} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Área Total (ha)</Label>
                <Input type="number" value={fArea} onChange={(e) => setFArea(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Tipo de Exploração</Label>
                <Select value={fType} onValueChange={(v) => setFType(v as Fazenda["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Observações..." className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={save} className="gap-1"><Check className="h-4 w-4" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
