import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Search, Info, Radio, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  mockAnimals, paddocks, breeds, speciesLabels, originLabel, calcAnimalCategory,
  categoryLabel, categoryColor, eidTypeLabels,
  type Especie, type Sexo, type AnimalStatus, type OriginType, type Animal, type EidType,
} from "@/data/rebanho-mock";
import { useDevices, useEIDRead } from "@/contexts/DeviceContext";

export default function AdicionarAnimal() {
  const navigate = useNavigate();

  const [earTag, setEarTag] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Especie>("bovino");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<Sexo>("M");
  const [birthDate, setBirthDate] = useState<Date>();
  const [purchaseDate, setPurchaseDate] = useState<Date>();
  const [originType, setOriginType] = useState<OriginType>("nascido");
  const [originNotes, setOriginNotes] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");

  const [damId, setDamId] = useState("");
  const [damEarTag, setDamEarTag] = useState("");
  const [sireId, setSireId] = useState("");
  const [sireEarTag, setSireEarTag] = useState("");

  const [status, setStatus] = useState<AnimalStatus>("ativo");
  const [isBreeder, setIsBreeder] = useState(false);
  const [isCastrated, setIsCastrated] = useState(false);
  const [firstCalvingDate, setFirstCalvingDate] = useState<Date>();
  const [paddock, setPaddock] = useState("");

  const [notes, setNotes] = useState("");
  const [eid, setEid] = useState("");
  const [eidType, setEidType] = useState<EidType | "">("");
  const [waitingEid, setWaitingEid] = useState(false);

  const { readers } = useDevices();
  const hasReaders = readers.length > 0;
  const waitingRef = useRef(waitingEid);
  waitingRef.current = waitingEid;

  useEIDRead((ev) => {
    if (waitingRef.current) {
      setEid(ev.eid);
      setWaitingEid(false);
    }
  });

  const [damSearch, setDamSearch] = useState("");
  const [sireSearch, setSireSearch] = useState("");

  const females = useMemo(
    () => mockAnimals.filter((a) => a.sex === "F" && a.current_status === "ativo"), [],
  );
  const males = useMemo(
    () => mockAnimals.filter((a) => a.sex === "M" && a.current_status === "ativo"), [],
  );

  const filteredFemales = useMemo(() => {
    if (!damSearch) return females;
    const q = damSearch.toLowerCase();
    return females.filter((a) => a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [damSearch, females]);

  const filteredMales = useMemo(() => {
    if (!sireSearch) return males;
    const q = sireSearch.toLowerCase();
    return males.filter((a) => a.ear_tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [sireSearch, males]);

  // Calculate category preview
  const categoryPreview = useMemo(() => {
    if (!birthDate) return null;
    const preview: Animal = {
      id: "preview", ear_tag: earTag, eid: eid || null, eid_type: (eidType as EidType) || null, name, species, breed, sex,
      birth_date: birthDate.toISOString().slice(0, 10),
      purchase_date: purchaseDate ? purchaseDate.toISOString().slice(0, 10) : null,
      origin_type: originType, origin_notes: originNotes,
      dam_id: damId || null, dam_ear_tag: damEarTag,
      sire_id: sireId || null, sire_ear_tag: sireEarTag,
      current_status: status, is_breeder: isBreeder, is_castrated: isCastrated,
      first_calving_date: firstCalvingDate ? firstCalvingDate.toISOString().slice(0, 10) : null,
      paddock, current_weight: Number(currentWeight) || 0, notes,
    };
    return calcAnimalCategory(preview);
  }, [birthDate, species, sex, isBreeder, isCastrated, firstCalvingDate, currentWeight, earTag, name, breed, purchaseDate, originType, originNotes, damId, damEarTag, sireId, sireEarTag, status, paddock, notes]);

  const showPurchaseDate = originType === "comprado" || originType === "trocado";

  const handleSave = () => {
    if (!earTag.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe a Eartag do animal.", variant: "destructive" });
      return;
    }
    const duplicate = mockAnimals.find((a) => a.ear_tag === earTag.trim());
    if (duplicate) {
      toast({ title: "Eartag duplicada", description: `Já existe um animal com a eartag ${earTag}.`, variant: "destructive" });
      return;
    }
    toast({ title: "Animal cadastrado!", description: `${name || earTag} foi adicionado com sucesso.` });
    navigate("/rebanho/animais");
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-primary" />
          Cadastrar Animal
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados para adicionar um novo animal ao rebanho
        </p>
      </div>

      {/* Category Preview */}
      {categoryPreview && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Categoria calculada automaticamente</p>
              <Badge variant="outline" className={`mt-1 ${categoryColor[categoryPreview]}`}>
                {categoryLabel[categoryPreview]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IDENTIFICAÇÃO */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Eartag (CPF do Animal) *</Label>
              <Input value={earTag} onChange={(e) => setEarTag(e.target.value)} placeholder="Ex: BR011" />
            </div>
            <div className="space-y-1">
              <Label>Nome do Animal</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Estrela" />
            </div>
          </div>
          {/* EID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>EID — Brinco Eletrônico</Label>
              <div className="flex gap-2">
                <Input value={eid} onChange={(e) => setEid(e.target.value)} placeholder="Ex: 982000123456789" className="font-mono flex-1" />
                {hasReaders && (
                  <Button
                    type="button"
                    variant={waitingEid ? "destructive" : "outline"}
                    size="sm"
                    className="gap-1 shrink-0"
                    onClick={() => setWaitingEid(!waitingEid)}
                  >
                    {waitingEid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                    {waitingEid ? "Aguardando..." : "Ler do leitor"}
                  </Button>
                )}
              </div>
              {waitingEid && (
                <p className="text-xs text-primary animate-pulse">📡 Aproxime o brinco eletrônico do leitor...</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Tipo de brinco eletrônico</Label>
              <Select value={eidType} onValueChange={(v) => setEidType(v as EidType)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(eidTypeLabels)).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Espécie</Label>
              <Select value={species} onValueChange={(v) => { setSpecies(v as Especie); setBreed(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(speciesLabels) as Especie[]).map((k) => (
                    <SelectItem key={k} value={k}>{speciesLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Raça</Label>
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(breeds[species] || []).map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sexo</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as Sexo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="F">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Origin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Origem</Label>
              <Select value={originType} onValueChange={(v) => setOriginType(v as OriginType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(originLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Obs. Origem</Label>
              <Input value={originNotes} onChange={(e) => setOriginNotes(e.target.value)} placeholder="Leilão, fazenda..." />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>DN — Data de Nascimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={birthDate} onSelect={setBirthDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            {showPurchaseDate && (
              <div className="space-y-1">
                <Label>DC — Data de Compra</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !purchaseDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {purchaseDate ? format(purchaseDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Peso Atual (kg)</Label>
            <Input type="number" min={0} value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="Ex: 350" />
          </div>
        </CardContent>
      </Card>

      {/* GENEALOGIA */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Genealogia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Sire (Pai) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pai</Label>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Pai cadastrado no sistema</Label>
                <Select value={sireId} onValueChange={setSireId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar macho" /></SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Buscar..." value={sireSearch} onChange={(e) => setSireSearch(e.target.value)} className="pl-7 h-8 text-sm" />
                      </div>
                    </div>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {filteredMales.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.ear_tag} — {m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Brinco do pai (externo)</Label>
                <Input value={sireEarTag} onChange={(e) => setSireEarTag(e.target.value)} placeholder="Ex: BR-EXT-200" />
              </div>
            </div>

            {/* Dam (Mãe) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Mãe</Label>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mãe cadastrada no sistema</Label>
                <Select value={damId} onValueChange={setDamId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar fêmea" /></SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Buscar..." value={damSearch} onChange={(e) => setDamSearch(e.target.value)} className="pl-7 h-8 text-sm" />
                      </div>
                    </div>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {filteredFemales.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.ear_tag} — {f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Brinco da mãe (externo)</Label>
                <Input value={damEarTag} onChange={(e) => setDamEarTag(e.target.value)} placeholder="Ex: BR-EXT-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATUS E MANEJO */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Status e Manejo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Status Atual</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AnimalStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="morto">Morto</SelectItem>
                  <SelectItem value="abatido">Abatido</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Pasto / Paddock</Label>
              <Select value={paddock} onValueChange={setPaddock}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {paddocks.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {sex === "F" && (
              <div className="space-y-1">
                <Label>Data do Primeiro Parto</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !firstCalvingDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {firstCalvingDate ? format(firstCalvingDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={firstCalvingDate} onSelect={setFirstCalvingDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={isBreeder} onCheckedChange={setIsBreeder} id="breeder" />
              <Label htmlFor="breeder">É reprodutor?</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isCastrated} onCheckedChange={setIsCastrated} id="castrated" />
              <Label htmlFor="castrated">É castrado?</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NOTAS */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Notas</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações gerais sobre o animal..." className="min-h-[100px]" />
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate("/rebanho/animais")}>Cancelar</Button>
        <Button onClick={handleSave} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Salvar Animal
        </Button>
      </div>
    </div>
  );
}
