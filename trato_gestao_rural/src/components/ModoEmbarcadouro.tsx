import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  X, Truck, Download, CheckCircle2, AlertTriangle, Radio,
  Package, ClipboardCheck, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDevices, useEIDRead } from "@/contexts/DeviceContext";
import { mockAnimals, categoryLabel, calcAnimalCategory } from "@/data/rebanho-mock";
import { type Gta, STATUS_CONFIG, FINALIDADE_LABELS } from "@/data/gta-mock";
import { startSimulation, stopSimulation } from "@/data/devices-mock";

/* ── Audio ── */
function playBeep(frequency = 880, duration = 150) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = 0.15;
    osc.start(); osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
}
function playConfirm() { playBeep(1200, 100); setTimeout(() => playBeep(1500, 150), 120); }
function playAlert() { playBeep(400, 300); setTimeout(() => playBeep(300, 400), 350); }

/* ── Types ── */
interface ScannedAnimal {
  eid: string;
  animalId: string | null;
  animalName: string;
  earTag: string;
  category: string;
  inGta: boolean;
  timestamp: Date;
}

interface Props {
  gtas: Gta[];
  onClose: () => void;
  onFinalize: (gtaId: string, scanned: ScannedAnimal[]) => void;
}

export default function ModoEmbarcadouro({ gtas, onClose, onFinalize }: Props) {
  const { readers, hasActiveConnection } = useDevices();
  const [phase, setPhase] = useState<"setup" | "scanning" | "finished">("setup");
  const [selectedGtaId, setSelectedGtaId] = useState<string>("");
  const [scannedAnimals, setScannedAnimals] = useState<ScannedAnimal[]>([]);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [lastScanned, setLastScanned] = useState<ScannedAnimal | null>(null);
  const simRef = useRef(false);
  const scannedEidsRef = useRef<Set<string>>(new Set());

  const activeGtas = gtas.filter((g) => g.status === "ativo" || g.status === "vencendo");
  const selectedGta = gtas.find((g) => g.id === selectedGtaId) || null;

  // GTA animal list (ear_tags)
  const gtaAnimalTags = selectedGta?.animaisVinculados || [];
  const gtaDeclaredQty = selectedGta?.quantidade || 0;

  const confirmedCount = scannedAnimals.filter((a) => a.inGta).length;
  const unknownCount = scannedAnimals.filter((a) => !a.inGta).length;
  const progressPct = gtaDeclaredQty > 0 ? Math.min(100, (confirmedCount / gtaDeclaredQty) * 100) : 0;

  // Start simulation if no real device
  useEffect(() => {
    if (phase === "scanning" && !hasActiveConnection && !simRef.current) {
      startSimulation(); simRef.current = true;
    }
    return () => { if (simRef.current) { stopSimulation(); simRef.current = false; } };
  }, [phase, hasActiveConnection]);

  // EID listener
  useEIDRead(useCallback((ev) => {
    if (phase !== "scanning" || !selectedGta) return;
    const eid = ev.eid;
    // Skip duplicates
    if (scannedEidsRef.current.has(eid)) {
      playBeep(600, 80);
      return;
    }
    scannedEidsRef.current.add(eid);

    const animal = mockAnimals.find((a) => a.ear_tag === eid);
    const inGta = gtaAnimalTags.includes(eid);

    const entry: ScannedAnimal = {
      eid,
      animalId: animal?.id || null,
      animalName: animal?.name || "Desconhecido",
      earTag: eid,
      category: animal ? categoryLabel[calcAnimalCategory(animal)] : "—",
      inGta,
      timestamp: new Date(),
    };

    setScannedAnimals((prev) => [entry, ...prev]);
    setLastScanned(entry);

    if (inGta) {
      playConfirm();
    } else {
      playAlert();
    }
  }, [phase, selectedGta, gtaAnimalTags]));

  function handleStart() {
    if (!selectedGtaId) return;
    setPhase("scanning");
    setSessionStart(new Date());
    setScannedAnimals([]);
    scannedEidsRef.current.clear();
  }

  function handleFinalize() {
    setPhase("finished");
    if (simRef.current) { stopSimulation(); simRef.current = false; }
  }

  function handleConfirmFinalize() {
    if (selectedGta) {
      onFinalize(selectedGta.id, scannedAnimals);
    }
    onClose();
  }

  function handleExportCSV() {
    if (scannedAnimals.length === 0) return;
    const header = "Brinco;Nome;Categoria;No GTA;Horário\n";
    const rows = scannedAnimals.map((a) =>
      `${a.earTag};${a.animalName};${a.category};${a.inGta ? "Sim" : "NÃO"};${a.timestamp.toLocaleTimeString("pt-BR")}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `embarque_${selectedGta?.numero || "sessao"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /* ═══ SETUP PHASE ═══ */
  if (phase === "setup") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Modo Embarcadouro</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <Package className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-xl font-bold">Configurar Embarque</h3>
              <p className="text-sm text-muted-foreground">Selecione o GTA para conferência de embarque</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">GTA vinculado *</label>
              <Select value={selectedGtaId} onValueChange={setSelectedGtaId}>
                <SelectTrigger><SelectValue placeholder="Selecione um GTA ativo..." /></SelectTrigger>
                <SelectContent>
                  {activeGtas.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="font-mono">{g.numero}</span>
                      <span className="text-muted-foreground ml-2">
                        — {FINALIDADE_LABELS[g.finalidade]} — {g.quantidade} animais
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedGta && (
                <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">GTA nº {selectedGta.numero}</span>
                    <Badge className={STATUS_CONFIG[selectedGta.status].color}>
                      {STATUS_CONFIG[selectedGta.status].label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Origem:</strong> {selectedGta.origemPropriedade} — {selectedGta.origemMunicipio}/{selectedGta.origemUf}</p>
                    <p><strong>Destino:</strong> {selectedGta.destinoPropriedade} — {selectedGta.destinoMunicipio}/{selectedGta.destinoUf}</p>
                    <p><strong>Finalidade:</strong> {FINALIDADE_LABELS[selectedGta.finalidade]}</p>
                    <p><strong>Espécie:</strong> {selectedGta.especie} — <strong>Quantidade:</strong> {selectedGta.quantidade} animais</p>
                    <p><strong>Animais vinculados:</strong> {selectedGta.animaisVinculados.length > 0 ? selectedGta.animaisVinculados.join(", ") : "Nenhum (contagem livre)"}</p>
                    <p><strong>Veículo:</strong> {selectedGta.placaVeiculo || "—"} — <strong>Motorista:</strong> {selectedGta.motorista || "—"}</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full h-12 text-base gap-2"
              disabled={!selectedGtaId}
              onClick={handleStart}
            >
              <Radio className="h-5 w-5" /> Iniciar Embarque
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ FINISHED PHASE ═══ */
  if (phase === "finished") {
    const allConfirmed = gtaAnimalTags.length > 0 && confirmedCount >= gtaAnimalTags.length;
    const missingTags = gtaAnimalTags.filter((t) => !scannedEidsRef.current.has(t));

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Resumo do Embarque</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Result banner */}
            <div className={`rounded-xl p-6 text-center ${allConfirmed
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-amber-500/10 border border-amber-500/30"}`}
            >
              {allConfirmed ? (
                <>
                  <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600 mb-3" />
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {confirmedCount} de {gtaDeclaredQty} animais confirmados ✅
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Todos os animais do GTA foram identificados</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 mx-auto text-amber-600 mb-3" />
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {confirmedCount} de {gtaDeclaredQty} — {gtaDeclaredQty - confirmedCount} não identificado(s) ⚠️
                  </p>
                  {unknownCount > 0 && (
                    <p className="text-sm text-destructive mt-1">{unknownCount} animal(is) lido(s) NÃO constam no GTA</p>
                  )}
                </>
              )}
            </div>

            {/* Missing animals */}
            {missingTags.length > 0 && (
              <div className="rounded-lg border border-destructive/30 p-4 space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Animais não identificados no embarque:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingTags.map((tag) => {
                    const animal = mockAnimals.find((a) => a.ear_tag === tag);
                    return (
                      <Badge key={tag} variant="destructive" className="text-xs">
                        {tag} {animal ? `— ${animal.name}` : ""}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{scannedAnimals.length}</p>
                <p className="text-xs text-muted-foreground">Total lidos</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmados no GTA</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{unknownCount}</p>
                <p className="text-xs text-muted-foreground">Fora do GTA</p>
              </div>
            </div>

            {/* Scanned list */}
            <div className="rounded-lg border">
              <div className="px-4 py-2 border-b bg-muted/30">
                <p className="text-sm font-medium">Animais lidos ({scannedAnimals.length})</p>
              </div>
              <ScrollArea className="max-h-60">
                <div className="divide-y">
                  {scannedAnimals.map((a, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium">{a.earTag}</span>
                        <span className="text-muted-foreground">{a.animalName}</span>
                        <span className="text-xs text-muted-foreground">{a.category}</span>
                      </div>
                      {a.inGta ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs">✅ Confirmado</Badge>
                      ) : (
                        <Badge className="bg-destructive/15 text-destructive text-xs">⚠️ Não consta</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" /> Exportar Relatório
              </Button>
              <Button className="flex-1 gap-2" onClick={handleConfirmFinalize}>
                <ClipboardCheck className="h-4 w-4" /> Confirmar e Finalizar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ SCANNING PHASE ═══ */
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-bold">Embarcadouro — GTA {selectedGta?.numero}</h2>
            <p className="text-[10px] text-muted-foreground">
              {selectedGta?.origemPropriedade} → {selectedGta?.destinoPropriedade}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" className="gap-1" onClick={handleFinalize}>
            Finalizar Embarque
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { handleFinalize(); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 bg-muted/20 border-b space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Embarcados: {confirmedCount} / {gtaDeclaredQty}</span>
          <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} className="h-3" />
        {unknownCount > 0 && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {unknownCount} animal(is) fora do GTA
          </p>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Central panel */}
        <div className="flex-1 flex items-center justify-center p-4">
          {!lastScanned ? (
            <div className="text-center space-y-4 animate-pulse">
              <Radio className="h-20 w-20 mx-auto text-muted-foreground" />
              <p className="text-3xl font-bold text-muted-foreground">AGUARDANDO ANIMAL...</p>
              <p className="text-sm text-muted-foreground">Passe o animal pelo leitor do embarcadouro</p>
            </div>
          ) : (
            <div className={`w-full max-w-lg rounded-2xl p-6 text-center space-y-4 transition-all duration-300 ${
              lastScanned.inGta
                ? "bg-emerald-500/10 border-2 border-emerald-500/40"
                : "bg-destructive/10 border-2 border-destructive/40"
            }`}>
              {lastScanned.inGta ? (
                <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
              ) : (
                <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
              )}

              <div>
                <p className="text-4xl font-black font-mono">{lastScanned.earTag}</p>
                <p className="text-xl font-medium mt-1">{lastScanned.animalName}</p>
                <p className="text-sm text-muted-foreground">{lastScanned.category}</p>
              </div>

              {lastScanned.inGta ? (
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-lg px-4 py-1">
                  ✅ CONFIRMADO NO GTA
                </Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive text-lg px-4 py-1">
                  ⚠️ ANIMAL NÃO CONSTA NO GTA
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Side list */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-muted/20 flex flex-col">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Animais lidos ({scannedAnimals.length})
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {scannedAnimals.map((a, i) => (
                <div key={i} className={`px-3 py-2 flex items-center justify-between text-xs ${
                  i === 0 ? "bg-primary/5" : ""
                }`}>
                  <div>
                    <span className="font-mono font-bold text-sm">{a.earTag}</span>
                    <span className="ml-2 text-muted-foreground">{a.animalName}</span>
                  </div>
                  {a.inGta ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">✅</Badge>
                  ) : (
                    <Badge className="bg-destructive/15 text-destructive text-[10px]">⚠️</Badge>
                  )}
                </div>
              ))}
              {scannedAnimals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum animal lido ainda</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span>✅ Confirmados: <strong className="text-emerald-600">{confirmedCount}</strong></span>
          <span>⚠️ Fora do GTA: <strong className="text-destructive">{unknownCount}</strong></span>
          <span>📦 Total lidos: <strong>{scannedAnimals.length}</strong></span>
        </div>
        {sessionStart && (
          <span>Sessão iniciada {sessionStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        )}
      </div>
    </div>
  );
}
