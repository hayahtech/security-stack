import { useState, useMemo } from "react";
import {
  MapPin, Save, FileText, Building2, Handshake, Leaf, Plus, Trash2,
  Upload, AlertTriangle, CheckCircle2, ExternalLink, LocateFixed, Info,
  Edit2, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  mockPropriedade, mockDocumentos, mockBenfeitorias, mockArrendamentos,
  mockItrHistorico, mockOutorga,
  BIOMA_LABELS, BIOMA_RL_PERCENT, CATEGORIA_ICONS, TIPOS_BENFEITORIA, SECAO_DOCS,
  type PropriedadeDados, type Documento, type Benfeitoria, type Arrendamento,
  type ItrExercicio, type OutorgaAgua, type Bioma, type ConservacaoEstado,
} from "@/data/propriedades-mock";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ══════════════════════════════════════════════════════
   ABA 1 — DADOS CADASTRAIS
   ══════════════════════════════════════════════════════ */
function DadosCadastrais({ prop, setProp }: { prop: PropriedadeDados; setProp: (p: PropriedadeDados) => void }) {
  const grauUtil = prop.areaTotal > 0 ? ((prop.areaProdutiva / prop.areaTotal) * 100) : 0;
  const modulosFiscais = prop.moduloFiscal > 0 ? prop.areaTotal / prop.moduloFiscal : 0;
  const classificacao = modulosFiscais <= 1 ? "Minifúndio" : modulosFiscais <= 4 ? "Pequena" : modulosFiscais <= 15 ? "Média" : "Grande";

  function detectLocation() {
    if (!navigator.geolocation) { toast.error("Geolocalização não suportada"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProp({ ...prop, latitude: Number(pos.coords.latitude.toFixed(6)), longitude: Number(pos.coords.longitude.toFixed(6)) });
        toast.success("Localização detectada");
      },
      () => toast.error("Não foi possível obter a localização")
    );
  }

  function searchNominatim() {
    if (!prop.municipio || !prop.estado) { toast.error("Informe município e estado"); return; }
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(prop.municipio + ", " + prop.estado + ", Brasil")}&format=json&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length > 0) {
          setProp({ ...prop, latitude: Number(Number(data[0].lat).toFixed(6)), longitude: Number(Number(data[0].lon).toFixed(6)) });
          toast.success(`Coordenadas encontradas para ${prop.municipio}`);
        } else toast.error("Município não encontrado");
      })
      .catch(() => toast.error("Erro na busca"));
  }

  const upd = (field: string, value: any) => setProp({ ...prop, [field]: value });

  return (
    <div className="space-y-6">
      {/* Dados gerais */}
      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Nome da fazenda</Label>
              <Input value={prop.nome} onChange={(e) => upd("nome", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={prop.tipo} onValueChange={(v) => upd("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rural">Rural</SelectItem>
                  <SelectItem value="urbana">Urbana</SelectItem>
                  <SelectItem value="mista">Mista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Forma de posse</Label>
              <Select value={prop.formaPosse} onValueChange={(v) => upd("formaPosse", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="propria">Própria</SelectItem>
                  <SelectItem value="arrendada">Arrendada</SelectItem>
                  <SelectItem value="parceria">Parceria</SelectItem>
                  <SelectItem value="comodato">Comodato</SelectItem>
                  <SelectItem value="posse">Posse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Área total (ha)</Label>
              <Input type="number" value={prop.areaTotal} onChange={(e) => upd("areaTotal", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Área produtiva (ha)</Label>
              <Input type="number" value={prop.areaProdutiva} onChange={(e) => upd("areaProdutiva", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Área de preservação (ha)</Label>
              <Input type="number" value={prop.areaPreservacao} onChange={(e) => upd("areaPreservacao", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Município</Label>
              <Input value={prop.municipio} onChange={(e) => upd("municipio", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Input value={prop.estado} onChange={(e) => upd("estado", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input value={prop.cep} onChange={(e) => upd("cep", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input type="number" step="0.000001" value={prop.latitude} onChange={(e) => upd("latitude", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input type="number" step="0.000001" value={prop.longitude} onChange={(e) => upd("longitude", Number(e.target.value))} />
            </div>
            <Button variant="outline" onClick={detectLocation} className="gap-1"><LocateFixed className="h-4 w-4" /> Detectar localização</Button>
            <Button variant="outline" onClick={searchNominatim} className="gap-1"><MapPin className="h-4 w-4" /> Buscar por município</Button>
          </div>
          <div className="space-y-1.5 max-w-sm">
            <Label>Proprietário principal</Label>
            <Input value={prop.proprietario} onChange={(e) => upd("proprietario", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Registros oficiais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Registros Oficiais
          </CardTitle>
          <CardDescription>Documentos de identificação da propriedade (opcionais mas importantes)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "nirf", label: "NIRF", tip: "Número do Imóvel Rural na Receita Federal" },
              { key: "incra", label: "INCRA / SNCR", tip: "Número do imóvel no INCRA" },
              { key: "car", label: "CAR", tip: "Cadastro Ambiental Rural" },
              { key: "ccir", label: "CCIR", tip: "Certificado de Cadastro de Imóvel Rural" },
              { key: "ie", label: "Inscrição Estadual", tip: "IE do produtor" },
              { key: "cie", label: "CIE (SISBOV)", tip: "Código de Identificação do Estabelecimento" },
              { key: "cnpj", label: "CNPJ da Fazenda", tip: "Se pessoa jurídica" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  {f.label}
                  <Tooltip>
                    <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs">{f.tip}</p></TooltipContent>
                  </Tooltip>
                </Label>
                <Input value={(prop as any)[f.key]} onChange={(e) => upd(f.key, e.target.value)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados fiscais */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dados Fiscais</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Área tributável ITR (ha)</Label>
              <Input type="number" value={prop.areaTributavel} onChange={(e) => upd("areaTributavel", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Módulo fiscal (ha)
                <Tooltip>
                  <TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Definido pelo INCRA por município</p></TooltipContent>
                </Tooltip>
              </Label>
              <Input type="number" value={prop.moduloFiscal} onChange={(e) => upd("moduloFiscal", Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Grau de utilização</Label>
              <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                {grauUtil.toFixed(1)}%
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Classificação</Label>
              <div className="h-10 flex items-center">
                <Badge variant="secondary" className="text-xs">{classificacao} ({modulosFiscais.toFixed(1)} módulos)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ABA 2 — DOCUMENTAÇÃO
   ══════════════════════════════════════════════════════ */
function Documentacao({ docs, setDocs }: { docs: Documento[]; setDocs: (d: Documento[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<Documento>>({ secao: "dominio", tipo: "", nome: "", dataDocumento: new Date().toISOString().slice(0, 10), dataVencimento: null, arquivo: null, observacoes: "" });

  function addDoc() {
    if (!newDoc.nome?.trim()) { toast.error("Informe o nome do documento"); return; }
    setDocs([...docs, { ...newDoc, id: `d${Date.now()}` } as Documento]);
    setShowAdd(false);
    setNewDoc({ secao: "dominio", tipo: "", nome: "", dataDocumento: new Date().toISOString().slice(0, 10), dataVencimento: null, arquivo: null, observacoes: "" });
    toast.success("Documento adicionado");
  }

  function getVencimentoStatus(d: Documento) {
    if (!d.dataVencimento) return null;
    const dias = Math.round((new Date(d.dataVencimento).getTime() - Date.now()) / 86400000);
    if (dias < 0) return { label: "Vencido", color: "bg-destructive/15 text-destructive" };
    if (dias < 60) return { label: `Vence em ${dias}d`, color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
    if (dias < 90) return { label: `Vence em ${dias}d`, color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" };
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="gap-1"><Plus className="h-4 w-4" /> Adicionar Documento</Button>
      </div>

      {Object.entries(SECAO_DOCS).map(([secKey, sec]) => {
        const secDocs = docs.filter((d) => d.secao === secKey);
        if (secDocs.length === 0) return null;
        return (
          <Card key={secKey}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{sec.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Obs.</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secDocs.map((d) => {
                    const vs = getVencimentoStatus(d);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-sm">{d.nome}</TableCell>
                        <TableCell className="text-xs">{d.tipo}</TableCell>
                        <TableCell className="text-xs">{new Date(d.dataDocumento).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          {d.dataVencimento ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{new Date(d.dataVencimento).toLocaleDateString("pt-BR")}</span>
                              {vs && <Badge className={`text-[10px] ${vs.color}`}>{vs.label}</Badge>}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {d.arquivo ? <Badge variant="outline" className="text-[10px] gap-1"><FileText className="h-3 w-3" />{d.arquivo}</Badge> : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{d.observacoes || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDocs(docs.filter((x) => x.id !== d.id))}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Alertas */}
      {docs.filter((d) => {
        if (!d.dataVencimento) return false;
        const dias = Math.round((new Date(d.dataVencimento).getTime() - Date.now()) / 86400000);
        return dias < 90;
      }).length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4" /> Alertas de Vencimento</p>
            <div className="space-y-1">
              {docs.filter((d) => {
                if (!d.dataVencimento) return false;
                return Math.round((new Date(d.dataVencimento).getTime() - Date.now()) / 86400000) < 90;
              }).map((d) => {
                const dias = Math.round((new Date(d.dataVencimento!).getTime() - Date.now()) / 86400000);
                return (
                  <p key={d.id} className="text-xs text-muted-foreground">
                    {dias < 0 ? "⚠️" : "🔔"} <strong>{d.nome}</strong> — {dias < 0 ? `vencido há ${Math.abs(dias)} dias` : `vence em ${dias} dias`}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={newDoc.nome} onChange={(e) => setNewDoc({ ...newDoc, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Seção</Label>
                <Select value={newDoc.secao} onValueChange={(v) => setNewDoc({ ...newDoc, secao: v as any, tipo: SECAO_DOCS[v]?.tipos[0] || "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SECAO_DOCS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={newDoc.tipo} onValueChange={(v) => setNewDoc({ ...newDoc, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(SECAO_DOCS[newDoc.secao!]?.tipos || []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data do documento</Label>
                <Input type="date" value={newDoc.dataDocumento} onChange={(e) => setNewDoc({ ...newDoc, dataDocumento: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento (se aplicável)</Label>
                <Input type="date" value={newDoc.dataVencimento || ""} onChange={(e) => setNewDoc({ ...newDoc, dataVencimento: e.target.value || null })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={newDoc.observacoes} onChange={(e) => setNewDoc({ ...newDoc, observacoes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={addDoc}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ABA 3 — INFRAESTRUTURA
   ══════════════════════════════════════════════════════ */
function Infraestrutura({ benfs, setBenfs }: { benfs: Benfeitoria[]; setBenfs: (b: Benfeitoria[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newB, setNewB] = useState<Partial<Benfeitoria>>({ categoria: "pecuaria", tipo: "", nome: "", areaCapacidade: "", anoConstrucao: 2020, conservacao: "bom", valorEstimado: 0, observacoes: "", foto: null });

  const totalValor = benfs.reduce((s, b) => s + b.valorEstimado, 0);

  function addBenf() {
    if (!newB.nome?.trim()) { toast.error("Informe o nome"); return; }
    setBenfs([...benfs, { ...newB, id: `b${Date.now()}` } as Benfeitoria]);
    setShowAdd(false);
    toast.success("Benfeitoria adicionada");
  }

  const conservLabel: Record<ConservacaoEstado, { label: string; color: string }> = {
    otimo: { label: "Ótimo", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    bom: { label: "Bom", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
    regular: { label: "Regular", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
    ruim: { label: "Ruim", color: "bg-destructive/15 text-destructive" },
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{benfs.length}</p>
            <p className="text-xs text-muted-foreground">Benfeitorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{fmt(totalValor)}</p>
            <p className="text-xs text-muted-foreground">Valor estimado total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {benfs.filter((b) => b.areaCapacidade.includes("m²")).reduce((s, b) => s + (parseFloat(b.areaCapacidade) || 0), 0).toLocaleString("pt-BR")} m²
            </p>
            <p className="text-xs text-muted-foreground">Área construída</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="gap-1"><Plus className="h-4 w-4" /> Adicionar Benfeitoria</Button>
      </div>

      {/* Grouped by category */}
      {Object.entries(TIPOS_BENFEITORIA).map(([catKey, _]) => {
        const catBenfs = benfs.filter((b) => b.categoria === catKey);
        if (catBenfs.length === 0) return null;
        const icon = CATEGORIA_ICONS[catKey] || "📦";
        const catLabel = catKey.charAt(0).toUpperCase() + catKey.slice(1);
        return (
          <Card key={catKey}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{icon} {catLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Área/Cap.</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Conservação</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Obs.</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catBenfs.map((b) => {
                      const cs = conservLabel[b.conservacao];
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium text-sm">{b.nome}</TableCell>
                          <TableCell className="text-xs">{b.tipo}</TableCell>
                          <TableCell className="text-xs">{b.areaCapacidade}</TableCell>
                          <TableCell className="text-xs">{b.anoConstrucao || "—"}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${cs.color}`}>{cs.label}</Badge></TableCell>
                          <TableCell className="text-xs">{b.valorEstimado > 0 ? fmt(b.valorEstimado) : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{b.observacoes || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBenfs(benfs.filter((x) => x.id !== b.id))}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Benfeitoria</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={newB.nome} onChange={(e) => setNewB({ ...newB, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={newB.categoria} onValueChange={(v) => setNewB({ ...newB, categoria: v as any, tipo: TIPOS_BENFEITORIA[v]?.[0] || "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(TIPOS_BENFEITORIA).map((k) => <SelectItem key={k} value={k}>{CATEGORIA_ICONS[k]} {k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={newB.tipo} onValueChange={(v) => setNewB({ ...newB, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(TIPOS_BENFEITORIA[newB.categoria!] || []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Área/Capacidade</Label>
                <Input value={newB.areaCapacidade} onChange={(e) => setNewB({ ...newB, areaCapacidade: e.target.value })} placeholder="Ex: 200 m²" />
              </div>
              <div className="space-y-1.5">
                <Label>Ano construção</Label>
                <Input type="number" value={newB.anoConstrucao} onChange={(e) => setNewB({ ...newB, anoConstrucao: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Conservação</Label>
                <Select value={newB.conservacao} onValueChange={(v) => setNewB({ ...newB, conservacao: v as ConservacaoEstado })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="otimo">Ótimo</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor estimado (R$)</Label>
                <Input type="number" value={newB.valorEstimado} onChange={(e) => setNewB({ ...newB, valorEstimado: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={newB.observacoes} onChange={(e) => setNewB({ ...newB, observacoes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={addBenf}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ABA 4 — ARRENDAMENTOS
   ══════════════════════════════════════════════════════ */
function Arrendamentos({ items, setItems }: { items: Arrendamento[]; setItems: (a: Arrendamento[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newA, setNewA] = useState<Partial<Arrendamento>>({ tipo: "recebido", parceiro: "", areaHa: 0, descricaoArea: "", valorTipo: "reais_ha_ano", valor: 0, dataInicio: "", dataVencimento: "", formaPagamento: "dinheiro", contrato: null });

  const recebidos = items.filter((a) => a.tipo === "recebido");
  const cedidos = items.filter((a) => a.tipo === "cedido");
  const totalRecArea = recebidos.reduce((s, a) => s + a.areaHa, 0);
  const totalCedArea = cedidos.reduce((s, a) => s + a.areaHa, 0);
  const totalRecCusto = recebidos.reduce((s, a) => s + (a.valorTipo === "reais_ha_ano" ? a.valor * a.areaHa : 0), 0);
  const totalCedReceita = cedidos.reduce((s, a) => s + (a.valorTipo === "reais_ha_ano" ? a.valor * a.areaHa : 0), 0);

  function addArrendamento() {
    if (!newA.parceiro?.trim()) { toast.error("Informe o parceiro"); return; }
    setItems([...items, { ...newA, id: `ar${Date.now()}` } as Arrendamento]);
    setShowAdd(false);
    toast.success("Arrendamento adicionado");
  }

  const valorTipoLabel: Record<string, string> = { reais_ha_ano: "R$/ha/ano", sacas_ha: "Sacas/ha", percentual: "% produção" };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalRecArea.toLocaleString("pt-BR")} ha</p>
            <p className="text-xs text-muted-foreground">Área arrendada recebida</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-destructive">{fmt(totalRecCusto)}/ano</p>
            <p className="text-xs text-muted-foreground">Custo anual (recebidos)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalCedArea.toLocaleString("pt-BR")} ha</p>
            <p className="text-xs text-muted-foreground">Área arrendada cedida</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{fmt(totalCedReceita)}/ano</p>
            <p className="text-xs text-muted-foreground">Receita anual (cedidos)</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} className="gap-1"><Plus className="h-4 w-4" /> Adicionar Arrendamento</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Área (ha)</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pgto.</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum arrendamento cadastrado</TableCell></TableRow>
                ) : items.map((a) => {
                  const diasVenc = Math.round((new Date(a.dataVencimento).getTime() - Date.now()) / 86400000);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Badge className={a.tipo === "recebido" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"}>
                          {a.tipo === "recebido" ? "Recebido" : "Cedido"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{a.parceiro}</TableCell>
                      <TableCell className="text-sm">{a.areaHa}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{a.descricaoArea}</TableCell>
                      <TableCell className="text-sm">{a.valor} {valorTipoLabel[a.valorTipo]}</TableCell>
                      <TableCell className="text-xs">{new Date(a.dataInicio).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{new Date(a.dataVencimento).toLocaleDateString("pt-BR")}</span>
                          {diasVenc < 90 && <Badge className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300">{diasVenc}d</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{a.formaPagamento}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setItems(items.filter((x) => x.id !== a.id))}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Arrendamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={newA.tipo} onValueChange={(v) => setNewA({ ...newA, tipo: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recebido">Arrendamento recebido</SelectItem>
                    <SelectItem value="cedido">Arrendamento cedido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{newA.tipo === "recebido" ? "Arrendante" : "Arrendatário"}</Label>
                <Input value={newA.parceiro} onChange={(e) => setNewA({ ...newA, parceiro: e.target.value })} placeholder="Nome do parceiro" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Área (ha)</Label>
                <Input type="number" value={newA.areaHa} onChange={(e) => setNewA({ ...newA, areaHa: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição da área</Label>
                <Input value={newA.descricaoArea} onChange={(e) => setNewA({ ...newA, descricaoArea: e.target.value })} placeholder="Ex: Pastos 5, 6 e 7" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de valor</Label>
                <Select value={newA.valorTipo} onValueChange={(v) => setNewA({ ...newA, valorTipo: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reais_ha_ano">R$/ha/ano</SelectItem>
                    <SelectItem value="sacas_ha">Sacas/ha</SelectItem>
                    <SelectItem value="percentual">% produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input type="number" value={newA.valor} onChange={(e) => setNewA({ ...newA, valor: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Pagamento</Label>
                <Select value={newA.formaPagamento} onValueChange={(v) => setNewA({ ...newA, formaPagamento: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="produto">Produto (sacas)</SelectItem>
                    <SelectItem value="percentual">% produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data de início</Label>
                <Input type="date" value={newA.dataInicio} onChange={(e) => setNewA({ ...newA, dataInicio: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de vencimento</Label>
                <Input type="date" value={newA.dataVencimento} onChange={(e) => setNewA({ ...newA, dataVencimento: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button onClick={addArrendamento}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ABA 5 — AMBIENTAL
   ══════════════════════════════════════════════════════ */
function Ambiental({
  prop, outorga, setOutorga, itrHist, setItrHist,
}: {
  prop: PropriedadeDados;
  outorga: OutorgaAgua;
  setOutorga: (o: OutorgaAgua) => void;
  itrHist: ItrExercicio[];
  setItrHist: (h: ItrExercicio[]) => void;
}) {
  const [showAddItr, setShowAddItr] = useState(false);
  const [newItr, setNewItr] = useState<Partial<ItrExercicio>>({ ano: new Date().getFullYear(), areaTotal: prop.areaTotal, areaTributavel: prop.areaTributavel, grauUtilizacao: 0, vtnHa: 0, itrLancado: 0, itrPago: 0, status: "pendente" });

  const rlPercent = BIOMA_RL_PERCENT[prop.bioma];
  const rlExigida = prop.areaTotal * (rlPercent / 100);
  // Estimate RL averbada from benfeitorias
  const rlAverbada = prop.areaPreservacao;
  const rlDiff = rlAverbada - rlExigida;
  const rlStatus = rlAverbada <= 0 ? "sem" : rlDiff >= 0 ? "conforme" : "deficit";

  function addItr() {
    setItrHist([{ ...newItr, id: `itr${Date.now()}`, grauUtilizacao: newItr.areaTributavel && newItr.areaTotal ? (newItr.areaTributavel / newItr.areaTotal * 100) : 0 } as ItrExercicio, ...itrHist]);
    setShowAddItr(false);
    toast.success("Exercício ITR adicionado");
  }

  return (
    <div className="space-y-6">
      {/* Reserva Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-600" /> Reserva Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Área total</p>
              <p className="text-lg font-bold">{prop.areaTotal} ha</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bioma: {BIOMA_LABELS[prop.bioma]}</p>
              <p className="text-lg font-bold">{rlPercent}% exigido</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">RL exigida</p>
              <p className="text-lg font-bold">{rlExigida.toFixed(1)} ha</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">RL averbada (preservação)</p>
              <p className="text-lg font-bold">{rlAverbada} ha</p>
            </div>
          </div>
          <div>
            {rlStatus === "conforme" && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-sm gap-1">
                <CheckCircle2 className="h-4 w-4" /> Conforme — superávit de {rlDiff.toFixed(1)} ha
              </Badge>
            )}
            {rlStatus === "deficit" && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-sm gap-1">
                <AlertTriangle className="h-4 w-4" /> Déficit de {Math.abs(rlDiff).toFixed(1)} ha
              </Badge>
            )}
            {rlStatus === "sem" && (
              <Badge className="bg-destructive/15 text-destructive text-sm gap-1">
                <AlertTriangle className="h-4 w-4" /> Sem averbação
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CAR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CAR — Cadastro Ambiental Rural</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Número do protocolo</p>
              <p className="text-sm font-mono">{prop.car || "Não informado"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Ativo</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1">
            <a href="https://www.car.gov.br" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Consultar no SICAR
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Outorga */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">💧 Outorga de Água</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <Label>Possui outorga?</Label>
            <Switch checked={outorga.possui} onCheckedChange={(v) => setOutorga({ ...outorga, possui: v })} />
          </div>
          {outorga.possui && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Órgão emissor</Label>
                <Input value={outorga.orgao} onChange={(e) => setOutorga({ ...outorga, orgao: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Número da outorga</Label>
                <Input value={outorga.numero} onChange={(e) => setOutorga({ ...outorga, numero: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input type="date" value={outorga.validade} onChange={(e) => setOutorga({ ...outorga, validade: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Vazão autorizada (m³/h)</Label>
                <Input type="number" value={outorga.vazao} onChange={(e) => setOutorga({ ...outorga, vazao: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ITR */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">ITR — Imposto Territorial Rural</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddItr(true)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar exercício</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ano</TableHead>
                  <TableHead>Área total</TableHead>
                  <TableHead>Área tributável</TableHead>
                  <TableHead>GU %</TableHead>
                  <TableHead>VTN (R$/ha)</TableHead>
                  <TableHead>ITR lançado</TableHead>
                  <TableHead>ITR pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itrHist.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.ano}</TableCell>
                    <TableCell className="text-sm">{i.areaTotal} ha</TableCell>
                    <TableCell className="text-sm">{i.areaTributavel} ha</TableCell>
                    <TableCell className="text-sm">{i.grauUtilizacao.toFixed(1)}%</TableCell>
                    <TableCell className="text-sm">{fmt(i.vtnHa)}</TableCell>
                    <TableCell className="text-sm">{fmt(i.itrLancado)}</TableCell>
                    <TableCell className="text-sm">{fmt(i.itrPago)}</TableCell>
                    <TableCell>
                      <Badge className={i.status === "pago" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : i.status === "parcelado" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-destructive/15 text-destructive"}>
                        {i.status === "pago" ? "Pago" : i.status === "parcelado" ? "Parcelado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setItrHist(itrHist.filter((x) => x.id !== i.id))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add ITR dialog */}
      <Dialog open={showAddItr} onOpenChange={setShowAddItr}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Adicionar Exercício ITR</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ano</Label>
                <Input type="number" value={newItr.ano} onChange={(e) => setNewItr({ ...newItr, ano: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={newItr.status} onValueChange={(v) => setNewItr({ ...newItr, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Área total (ha)</Label>
                <Input type="number" value={newItr.areaTotal} onChange={(e) => setNewItr({ ...newItr, areaTotal: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Área tributável (ha)</Label>
                <Input type="number" value={newItr.areaTributavel} onChange={(e) => setNewItr({ ...newItr, areaTributavel: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>VTN (R$/ha)</Label>
                <Input type="number" value={newItr.vtnHa} onChange={(e) => setNewItr({ ...newItr, vtnHa: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>ITR lançado</Label>
                <Input type="number" value={newItr.itrLancado} onChange={(e) => setNewItr({ ...newItr, itrLancado: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>ITR pago</Label>
                <Input type="number" value={newItr.itrPago} onChange={(e) => setNewItr({ ...newItr, itrPago: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItr(false)}>Cancelar</Button>
            <Button onClick={addItr}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════ */
export default function Propriedades() {
  const [prop, setProp] = useState<PropriedadeDados>({ ...mockPropriedade });
  const [docs, setDocs] = useState([...mockDocumentos]);
  const [benfs, setBenfs] = useState([...mockBenfeitorias]);
  const [arrend, setArrend] = useState([...mockArrendamentos]);
  const [outorga, setOutorga] = useState<OutorgaAgua>({ ...mockOutorga });
  const [itrHist, setItrHist] = useState([...mockItrHistorico]);

  function handleSave() { toast.success("Propriedade salva com sucesso"); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> {prop.nome || "Propriedade"}
          </h1>
          <p className="text-sm text-muted-foreground">{prop.municipio}, {prop.estado} — {prop.areaTotal} ha</p>
        </div>
        <Button onClick={handleSave} className="gap-1"><Save className="h-4 w-4" /> Salvar</Button>
      </div>

      <Tabs defaultValue="cadastro">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="cadastro" className="gap-1"><FileText className="h-3.5 w-3.5" />Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="documentacao" className="gap-1"><Upload className="h-3.5 w-3.5" />Documentação</TabsTrigger>
          <TabsTrigger value="infraestrutura" className="gap-1"><Building2 className="h-3.5 w-3.5" />Infraestrutura</TabsTrigger>
          <TabsTrigger value="arrendamentos" className="gap-1"><Handshake className="h-3.5 w-3.5" />Arrendamentos</TabsTrigger>
          <TabsTrigger value="ambiental" className="gap-1"><Leaf className="h-3.5 w-3.5" />Ambiental</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="mt-4">
          <DadosCadastrais prop={prop} setProp={setProp} />
        </TabsContent>
        <TabsContent value="documentacao" className="mt-4">
          <Documentacao docs={docs} setDocs={setDocs} />
        </TabsContent>
        <TabsContent value="infraestrutura" className="mt-4">
          <Infraestrutura benfs={benfs} setBenfs={setBenfs} />
        </TabsContent>
        <TabsContent value="arrendamentos" className="mt-4">
          <Arrendamentos items={arrend} setItems={setArrend} />
        </TabsContent>
        <TabsContent value="ambiental" className="mt-4">
          <Ambiental prop={prop} outorga={outorga} setOutorga={setOutorga} itrHist={itrHist} setItrHist={setItrHist} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
