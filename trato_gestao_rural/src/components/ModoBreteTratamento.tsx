import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Check, SkipForward, Syringe, AlertTriangle, Clock, Download,
  Radio, Package, Weight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useDevices, useEIDRead, useWeightRead } from "@/contexts/DeviceContext";
import { mockAnimals, calcAnimalCategory, categoryLabel, age } from "@/data/rebanho-mock";
import { mockTreatments } from "@/data/animal-detail-mock";
import { startSimulation, stopSimulation } from "@/data/devices-mock";
import type { Medication } from "@/pages/rebanho/Tratamentos";

/* ── Types ── */
interface BreteSessionConfig {
  treatType: string;
  medicationIds: string[];
  dosePerKg: number | null; // ml per kg body weight (null = fixed dose)
  fixedDose: string;
  appliedBy: string;
  date: string;
  route: string;
}

interface TreatRecord {
  earTag: string;
  animalId: string | null;
  animalName: string;
  category: string;
  weight: number | null;
  medications: string[];
  dose: string;
  skipped: boolean;
  alreadyTreated: boolean;
  alerts: string[];
  timestamp: Date;
}

type BretePhase = "waiting" | "identified" | "done";

/* ── Audio ── */
function playBeep(freq = 880, dur = 150) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + dur / 1000);
  } catch {}
}

function playConfirm() {
  playBeep(660, 100);
  setTimeout(() => playBeep(880, 100), 120);
  setTimeout(() => playBeep(1100, 150), 250);
}

/* ── Helpers ── */
function findAnimalByTag(tag: string) {
  const norm = tag.replace(/-/g, "");
  return mockAnimals.find(
    (a) => a.ear_tag === tag || a.ear_tag === norm || a.ear_tag.replace(/-/g, "") === norm
  );
}

const treatmentTypes = [
  "Vacinação", "Vermifugação", "Antibiótico", "Anti-inflamatório",
  "Vitamina/Suplemento", "Carrapaticida", "Ectoparasita", "Outro",
];

const applicationRoutes = [
  { value: "IM", label: "Intramuscular (IM)" },
  { value: "SC", label: "Subcutânea (SC)" },
  { value: "IV", label: "Intravenosa (IV)" },
  { value: "Oral", label: "Oral" },
  { value: "Pour-on", label: "Pour-on" },
];

const workers = ["João", "Carlos", "Maria", "Pedro", "Ana", "Dr. Silva"];

/* ── Dose rate presets (ml/kg) for common meds ── */
const doseRatePresets: Record<string, number> = {
  "Ivermectina 1%": 1 / 50,     // 1ml per 50kg
  "Dectomax": 1 / 50,
  "Oxitetraciclina LA": 1 / 10, // 1ml per 10kg
  "Flunixin Meglumine": 1 / 45,
};

/* ── Component ── */
interface Props {
  medications: Medication[];
  onClose: () => void;
}

export default function ModoBreteTratamento({ medications, onClose }: Props) {
  const { hasActiveConnection, scales } = useDevices();
  const hasScale = scales.some((s) => s.status === "connected" || s.active);

  // Setup modal
  const [showSetup, setShowSetup] = useState(true);
  const [config, setConfig] = useState<BreteSessionConfig>({
    treatType: "Vacinação",
    medicationIds: [],
    dosePerKg: null,
    fixedDose: "",
    appliedBy: "",
    date: new Date().toISOString().slice(0, 10),
    route: "IM",
  });

  // Session state
  const [phase, setPhase] = useState<BretePhase>("waiting");
  const [currentAnimal, setCurrentAnimal] = useState<{
    earTag: string;
    animal: ReturnType<typeof findAnimalByTag>;
    category: string;
    lastTreatment: string | null;
    alreadyTreated: boolean;
    calculatedDose: string;
    alerts: string[];
  } | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [records, setRecords] = useState<TreatRecord[]>([]);
  const [sessionStart] = useState(new Date());
  const [showSaved, setShowSaved] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [totalMedicamentMl, setTotalMedicamentMl] = useState(500); // initial stock ml

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Auto-detect dose rate when medication is selected
  useEffect(() => {
    if (config.medicationIds.length === 1) {
      const med = medications.find((m) => m.id === config.medicationIds[0]);
      if (med && doseRatePresets[med.name]) {
        setConfig((c) => ({ ...c, dosePerKg: doseRatePresets[med.name] }));
      }
    }
  }, [config.medicationIds, medications]);

  const selectedMedNames = config.medicationIds
    .map((id) => medications.find((m) => m.id === id)?.name || "")
    .filter(Boolean);

  function calcDose(weightKg: number | null): string {
    if (config.dosePerKg && weightKg && weightKg > 0) {
      return `${(weightKg * config.dosePerKg).toFixed(1)} ml`;
    }
    if (config.fixedDose) return config.fixedDose;
    // Default from medication
    if (config.medicationIds.length > 0) {
      const med = medications.find((m) => m.id === config.medicationIds[0]);
      if (med) return med.concentration;
    }
    return "Dose padrão";
  }

  // Start simulation if no real devices
  useEffect(() => {
    if (!showSetup && !hasActiveConnection) {
      startSimulation();
      setUseSimulation(true);
    }
    return () => {
      if (useSimulation) stopSimulation();
    };
  }, [showSetup]);

  // EID Read
  useEIDRead(
    useCallback(
      (ev) => {
        if (showSetup || phaseRef.current !== "waiting" || showSaved) return;

        const animal = findAnimalByTag(ev.eid);
        const category = animal ? categoryLabel[calcAnimalCategory(animal)] : "Desconhecido";

        // Check if already treated today with same medications
        const today = new Date().toISOString().slice(0, 10);
        const todayTreatments = mockTreatments.filter(
          (t) => t.animal_id === animal?.id && t.date === today
        );
        const alreadyTreated = todayTreatments.some((t) =>
          selectedMedNames.includes(t.medication)
        );

        // Last treatment of this type
        const lastOfType = animal
          ? mockTreatments
              .filter((t) => t.animal_id === animal.id && selectedMedNames.includes(t.medication))
              .sort((a, b) => b.date.localeCompare(a.date))[0]
          : null;

        const alerts: string[] = [];
        if (alreadyTreated) alerts.push("⚠️ JÁ TRATADO HOJE com este medicamento");

        // Check withdrawal period
        const latestTreatment = animal
          ? mockTreatments
              .filter((t) => t.animal_id === animal.id && t.withdrawal_days > 0)
              .sort((a, b) => b.date.localeCompare(a.date))[0]
          : null;
        if (latestTreatment) {
          const endDate = new Date(
            new Date(latestTreatment.date).getTime() + latestTreatment.withdrawal_days * 86400000
          );
          if (endDate > new Date()) {
            alerts.push(
              `🔴 EM CARÊNCIA até ${endDate.toLocaleDateString("pt-BR")} (${latestTreatment.medication})`
            );
          }
        }

        const dose = calcDose(animal?.current_weight || null);

        setCurrentAnimal({
          earTag: ev.eid,
          animal,
          category,
          lastTreatment: lastOfType
            ? `${lastOfType.medication} em ${new Date(lastOfType.date).toLocaleDateString("pt-BR")}`
            : null,
          alreadyTreated,
          calculatedDose: dose,
          alerts,
        });
        setPhase("identified");
        playBeep(660, 100);
      },
      [showSetup, showSaved, selectedMedNames, config, medications]
    )
  );

  // Weight Read (updates dose if received while animal is identified)
  useWeightRead(
    useCallback(
      (ev) => {
        if (phaseRef.current !== "identified") return;
        setCurrentWeight(ev.kg);
        // Recalculate dose with actual weight
        if (config.dosePerKg) {
          setCurrentAnimal((prev) =>
            prev
              ? { ...prev, calculatedDose: `${(ev.kg * config.dosePerKg!).toFixed(1)} ml` }
              : prev
          );
        }
      },
      [config.dosePerKg]
    )
  );

  function handleApplied() {
    if (!currentAnimal) return;

    const doseVal = parseFloat(currentAnimal.calculatedDose) || 0;

    const record: TreatRecord = {
      earTag: currentAnimal.earTag,
      animalId: currentAnimal.animal?.id || null,
      animalName: currentAnimal.animal?.name || "Desconhecido",
      category: currentAnimal.category,
      weight: currentWeight || currentAnimal.animal?.current_weight || null,
      medications: selectedMedNames,
      dose: currentAnimal.calculatedDose,
      skipped: false,
      alreadyTreated: currentAnimal.alreadyTreated,
      alerts: currentAnimal.alerts,
      timestamp: new Date(),
    };

    setRecords((prev) => [record, ...prev]);
    setTotalMedicamentMl((prev) => prev - doseVal);
    playConfirm();
    setShowSaved(true);

    setTimeout(() => {
      setShowSaved(false);
      setPhase("waiting");
      setCurrentAnimal(null);
      setCurrentWeight(null);
    }, 2000);
  }

  function handleSkip() {
    if (!currentAnimal) return;

    const record: TreatRecord = {
      earTag: currentAnimal.earTag,
      animalId: currentAnimal.animal?.id || null,
      animalName: currentAnimal.animal?.name || "Desconhecido",
      category: currentAnimal.category,
      weight: null,
      medications: selectedMedNames,
      dose: "—",
      skipped: true,
      alreadyTreated: currentAnimal.alreadyTreated,
      alerts: currentAnimal.alerts,
      timestamp: new Date(),
    };

    setRecords((prev) => [record, ...prev]);
    playBeep(440, 100);
    setPhase("waiting");
    setCurrentAnimal(null);
    setCurrentWeight(null);
  }

  // Stats
  const treated = records.filter((r) => !r.skipped).length;
  const skipped = records.filter((r) => r.skipped).length;
  const avgDose =
    treated > 0
      ? (
          records
            .filter((r) => !r.skipped)
            .reduce((s, r) => s + (parseFloat(r.dose) || 0), 0) / treated
        ).toFixed(1)
      : "0";
  const estimatedRemaining =
    totalMedicamentMl > 0 && parseFloat(avgDose) > 0
      ? Math.floor(totalMedicamentMl / parseFloat(avgDose))
      : null;

  const bgClass = showSaved
    ? "bg-emerald-600"
    : phase === "identified"
    ? "bg-blue-700"
    : "bg-muted";

  // ── Setup Modal ──
  if (showSetup) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" /> Configurar Sessão de Tratamento
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de tratamento</Label>
              <Select
                value={config.treatType}
                onValueChange={(v) => setConfig({ ...config, treatType: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {treatmentTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Medicamento(s) a aplicar</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {medications.filter((m) => m.active).map((med) => (
                  <label key={med.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={config.medicationIds.includes(med.id)}
                      onCheckedChange={() => {
                        const ids = config.medicationIds.includes(med.id)
                          ? config.medicationIds.filter((x) => x !== med.id)
                          : [...config.medicationIds, med.id];
                        setConfig({ ...config, medicationIds: ids });
                      }}
                    />
                    <span>{med.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {med.concentration}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dose por animal</Label>
                <Input
                  placeholder={hasScale ? "Auto pelo peso" : "Ex: 5ml"}
                  value={config.fixedDose}
                  onChange={(e) => setConfig({ ...config, fixedDose: e.target.value })}
                />
                {hasScale && config.dosePerKg && (
                  <p className="text-xs text-muted-foreground">
                    Auto: {(config.dosePerKg * 1000).toFixed(0)} ml/1000kg
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Via de aplicação</Label>
                <Select
                  value={config.route}
                  onValueChange={(v) => setConfig({ ...config, route: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {applicationRoutes.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Aplicado por</Label>
                <Select
                  value={config.appliedBy}
                  onValueChange={(v) => setConfig({ ...config, appliedBy: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estoque do medicamento (ml)</Label>
                <Input
                  type="number"
                  value={totalMedicamentMl}
                  onChange={(e) => setTotalMedicamentMl(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => {
                if (config.medicationIds.length === 0) {
                  return;
                }
                setShowSetup(false);
              }}
              disabled={config.medicationIds.length === 0 || !config.appliedBy}
            >
              Iniciar Modo Brete
            </Button>
          </DialogFooter>
        </div>
      </div>
    );
  }

  // ── Full-screen Brete Panel ──
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-500 ${bgClass}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30">
        <div className="flex items-center gap-3">
          <Syringe className="h-5 w-5 text-white" />
          <span className="text-white font-bold text-lg">MODO BRETE — TRATAMENTO</span>
          <Badge variant="outline" className="text-[10px] text-white/80 border-white/40">
            {config.treatType}
          </Badge>
          {useSimulation && (
            <Badge variant="outline" className="text-[10px] text-yellow-300 border-yellow-500">
              SIMULAÇÃO
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm">
            {selectedMedNames.join(" + ")} • {config.route} • {config.appliedBy}
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-auto">
        {showSaved ? (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-8xl">✅</div>
            <p className="text-white text-4xl font-bold">TRATAMENTO APLICADO</p>
            <p className="text-white/80 text-xl">Próximo animal...</p>
          </div>
        ) : phase === "waiting" ? (
          <div className="text-center space-y-6">
            <Radio className="h-24 w-24 text-muted-foreground/50 mx-auto animate-pulse" />
            <p className="text-3xl font-bold text-muted-foreground">AGUARDANDO ANIMAL...</p>
            <p className="text-muted-foreground text-sm">Passe o animal pelo brete com o leitor RFID</p>
          </div>
        ) : currentAnimal ? (
          <div className="w-full max-w-2xl space-y-6">
            {/* Animal info */}
            <div className="text-center space-y-2">
              <p className="text-white/70 text-sm tracking-widest uppercase">ANIMAL IDENTIFICADO</p>
              <p className="text-white text-5xl font-mono font-bold">{currentAnimal.earTag}</p>
              {currentAnimal.animal ? (
                <div className="space-y-1">
                  <p className="text-white text-2xl font-semibold">{currentAnimal.animal.name}</p>
                  <p className="text-white/80 text-lg">
                    {currentAnimal.category} • {currentAnimal.animal.breed} •{" "}
                    {currentAnimal.animal.sex === "M" ? "♂" : "♀"} •{" "}
                    {age(currentAnimal.animal.birth_date)}
                  </p>
                  <p className="text-white/60 text-base">
                    Peso: {currentWeight || currentAnimal.animal.current_weight} kg
                  </p>
                </div>
              ) : (
                <p className="text-yellow-300 text-lg">Animal não cadastrado</p>
              )}
            </div>

            {/* Last treatment of this type */}
            {currentAnimal.lastTreatment && (
              <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
                <p className="text-white/60 text-xs uppercase">Último tratamento deste tipo</p>
                <p className="text-white text-lg">{currentAnimal.lastTreatment}</p>
              </div>
            )}

            {/* Alerts */}
            {currentAnimal.alerts.length > 0 && (
              <div className="space-y-2">
                {currentAnimal.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-5 py-3 flex items-center gap-3 font-bold text-sm animate-pulse ${
                      alert.includes("CARÊNCIA")
                        ? "bg-red-600 text-white"
                        : "bg-yellow-500 text-black"
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    {alert}
                  </div>
                ))}
              </div>
            )}

            {/* Dose instruction */}
            <div className="bg-white/20 rounded-2xl px-8 py-6 text-center">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-2">APLICAR</p>
              <p className="text-white text-5xl font-bold font-mono">
                {currentAnimal.calculatedDose}
              </p>
              <p className="text-white/80 text-lg mt-2">
                de {selectedMedNames.join(" + ")} ({config.route})
              </p>
              {config.dosePerKg && currentWeight && (
                <p className="text-white/50 text-sm mt-1">
                  Calculado: {(config.dosePerKg * 1000).toFixed(0)} ml/1000kg ×{" "}
                  {currentWeight} kg
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <Button
                onClick={handleApplied}
                className="h-20 px-12 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-2xl"
              >
                <Check className="h-8 w-8 mr-3" /> APLICADO
              </Button>
              <Button
                onClick={handleSkip}
                variant="secondary"
                className="h-20 px-12 text-2xl font-bold rounded-2xl shadow-2xl"
              >
                <SkipForward className="h-8 w-8 mr-3" /> PULAR
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Session footer */}
      <div className="bg-black/40 px-6 py-3 flex items-center justify-between text-white text-sm">
        <div className="flex items-center gap-6">
          <span>
            Tratados: <span className="font-bold">{treated}</span>
          </span>
          <span>
            Pulados: <span className="font-bold">{skipped}</span>
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            Restante: ~{totalMedicamentMl.toFixed(0)} ml
            {estimatedRemaining !== null && (
              <span className="text-white/60"> (≈{estimatedRemaining} animais)</span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Sessão{" "}
            {sessionStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 gap-1"
          onClick={() => {
            if (records.length === 0) return;
            const lines = [
              `Relatório Tratamento Brete — ${new Date().toLocaleDateString("pt-BR")}`,
              `Tipo: ${config.treatType} | Medicamentos: ${selectedMedNames.join(", ")}`,
              `Aplicado por: ${config.appliedBy} | Via: ${config.route}`,
              `Sessão: ${sessionStart.toLocaleTimeString("pt-BR")} - ${new Date().toLocaleTimeString("pt-BR")}`,
              `Tratados: ${treated} | Pulados: ${skipped}`,
              "",
              "Brinco;Nome;Categoria;Peso(kg);Dose;Status;Hora",
              ...records.map(
                (r) =>
                  `${r.earTag};${r.animalName};${r.category};${r.weight ?? ""};${r.dose};${r.skipped ? "Pulado" : "Aplicado"};${r.timestamp.toLocaleTimeString("pt-BR")}`
              ),
            ];
            const blob = new Blob([lines.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tratamento-brete-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      {/* Records sidebar */}
      {records.length > 0 && (
        <div className="absolute right-0 top-14 bottom-14 w-72 bg-black/50 overflow-y-auto p-3 space-y-2">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Últimos tratamentos</p>
          {records.slice(0, 15).map((r, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-xs space-y-0.5 ${
                r.skipped ? "bg-white/5 text-white/50" : "bg-white/10 text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{r.earTag}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    r.skipped ? "border-white/30 text-white/50" : "border-green-400 text-green-300"
                  }`}
                >
                  {r.skipped ? "Pulado" : r.dose}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>{r.animalName}</span>
                <span>{r.timestamp.toLocaleTimeString("pt-BR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
