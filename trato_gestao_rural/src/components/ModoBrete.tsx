import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Check, XCircle, Weight, Radio, Download, AlertTriangle,
  Syringe, Baby, ShoppingCart, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDevices, useEIDRead, useWeightRead } from "@/contexts/DeviceContext";
import { mockAnimals, calcAnimalCategory, categoryLabel, age } from "@/data/rebanho-mock";
import { mockWeighings, mockTreatments } from "@/data/animal-detail-mock";
import { classifyGmd, gmdClassColors, gmdClassLabels } from "@/data/gmd-utils";
import { startSimulation, stopSimulation } from "@/data/devices-mock";

/* ── Types ── */
interface BreteRecord {
  earTag: string;
  animalId: string | null;
  animalName: string;
  breed: string;
  category: string;
  weight: number;
  previousWeight: number | null;
  previousDate: string | null;
  variation: number | null;
  gmd: number | null;
  gmdDays: number | null;
  alerts: BreteAlert[];
  timestamp: Date;
  confirmed: boolean;
}

interface BreteAlert {
  type: "carencia" | "vacina_vencida" | "parto_proximo" | "venda";
  color: string;
  icon: React.ReactNode;
  message: string;
}

type BretePhase = "waiting" | "identified" | "weighed";

const ARROBA_KG = 15;

/* ── Audio beep ── */
function playBeep(frequency = 880, duration = 150) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Web Audio not available
  }
}

function playConfirm() {
  playBeep(660, 100);
  setTimeout(() => playBeep(880, 100), 120);
  setTimeout(() => playBeep(1100, 150), 250);
}

function playReject() {
  playBeep(330, 200);
  setTimeout(() => playBeep(220, 300), 220);
}

/* ── Helpers ── */
function findAnimalByTag(tag: string) {
  // Handle both "BR-001" and "BR001" formats
  const normalized = tag.replace(/-/g, "");
  return mockAnimals.find(
    (a) => a.ear_tag === tag || a.ear_tag === normalized || a.ear_tag.replace(/-/g, "") === normalized
  );
}

function getLastWeighing(animalId: string) {
  return mockWeighings
    .filter((w) => w.animal_id === animalId)
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function getAlerts(animalId: string): BreteAlert[] {
  const alerts: BreteAlert[] = [];
  const now = new Date();

  // Check carência (withdrawal period)
  const treatments = mockTreatments
    .filter((t) => t.animal_id === animalId)
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const t of treatments) {
    if (t.withdrawal_days > 0) {
      const treatDate = new Date(t.date);
      const endDate = new Date(treatDate.getTime() + t.withdrawal_days * 86400000);
      if (endDate > now) {
        alerts.push({
          type: "carencia",
          color: "bg-red-600 text-white",
          icon: <AlertTriangle className="h-5 w-5" />,
          message: `CARÊNCIA ATÉ ${endDate.toLocaleDateString("pt-BR")} — NÃO EMBARCAR (${t.medication})`,
        });
        break;
      }
    }
  }

  // Check expired vaccines
  const vaccines = treatments.filter((t) => t.type === "vacina");
  for (const v of vaccines) {
    const vDate = new Date(v.date);
    const daysSince = Math.round((now.getTime() - vDate.getTime()) / 86400000);
    if (daysSince > 180) {
      alerts.push({
        type: "vacina_vencida",
        color: "bg-yellow-500 text-black",
        icon: <Syringe className="h-5 w-5" />,
        message: `${v.medication} aplicada há ${daysSince} dias — verificar revacinação`,
      });
      break;
    }
  }

  // Check pregnancy/upcoming birth
  const animal = mockAnimals.find((a) => a.id === animalId);
  if (animal?.sex === "F" && animal.first_calving_date) {
    // Simplified: check if cow might be pregnant
    const lastCalving = new Date(animal.first_calving_date);
    const daysSinceCalving = Math.round((now.getTime() - lastCalving.getTime()) / 86400000);
    if (daysSinceCalving > 250 && daysSinceCalving < 300) {
      const daysLeft = 283 - daysSinceCalving;
      if (daysLeft > 0 && daysLeft < 40) {
        alerts.push({
          type: "parto_proximo",
          color: "bg-orange-500 text-white",
          icon: <Baby className="h-5 w-5" />,
          message: `Parto previsto em ~${daysLeft} dias`,
        });
      }
    }
  }

  return alerts;
}

/* ── Component ── */
interface ModoBretePanelProps {
  onClose: () => void;
}

export default function ModoBrete({ onClose }: ModoBretePanelProps) {
  const { hasActiveConnection } = useDevices();

  const [phase, setPhase] = useState<BretePhase>("waiting");
  const [currentAnimal, setCurrentAnimal] = useState<{
    earTag: string;
    animal: ReturnType<typeof findAnimalByTag>;
    lastW: ReturnType<typeof getLastWeighing>;
    alerts: BreteAlert[];
    category: string;
  } | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [records, setRecords] = useState<BreteRecord[]>([]);
  const [sessionStart] = useState(new Date());
  const [showSaved, setShowSaved] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentAnimalRef = useRef(currentAnimal);
  currentAnimalRef.current = currentAnimal;

  // Start simulation if no real devices
  useEffect(() => {
    if (!hasActiveConnection) {
      startSimulation();
      setUseSimulation(true);
    }
    return () => {
      if (useSimulation) stopSimulation();
    };
  }, []);

  // Listen for EID reads
  useEIDRead(
    useCallback((ev) => {
      if (phaseRef.current === "weighed" || showSaved) return; // Don't interrupt saved message

      const animal = findAnimalByTag(ev.eid);
      const lastW = animal ? getLastWeighing(animal.id) : null;
      const alerts = animal ? getAlerts(animal.id) : [];
      const category = animal ? categoryLabel[calcAnimalCategory(animal)] : "Desconhecido";

      setCurrentAnimal({ earTag: ev.eid, animal, lastW, alerts, category });
      setCurrentWeight(null);
      setPhase("identified");
      playBeep(660, 100);
    }, [showSaved])
  );

  // Listen for weight reads
  useWeightRead(
    useCallback((ev) => {
      if (phaseRef.current !== "identified" || !currentAnimalRef.current) return;
      setCurrentWeight(ev.kg);
      setPhase("weighed");
      playBeep(880, 100);
    }, [])
  );

  const handleConfirm = () => {
    if (!currentAnimal || currentWeight === null) return;

    const animal = currentAnimal.animal;
    const lastW = currentAnimal.lastW;
    let variation: number | null = null;
    let gmd: number | null = null;
    let gmdDays: number | null = null;

    if (lastW) {
      variation = currentWeight - lastW.weight_kg;
      const days = Math.round((Date.now() - new Date(lastW.date).getTime()) / 86400000);
      if (days > 0) {
        gmd = Number((variation / days).toFixed(3));
        gmdDays = days;
      }
    }

    const record: BreteRecord = {
      earTag: currentAnimal.earTag,
      animalId: animal?.id || null,
      animalName: animal?.name || "Desconhecido",
      breed: animal?.breed || "",
      category: currentAnimal.category,
      weight: currentWeight,
      previousWeight: lastW?.weight_kg || null,
      previousDate: lastW?.date || null,
      variation,
      gmd,
      gmdDays,
      alerts: currentAnimal.alerts,
      timestamp: new Date(),
      confirmed: true,
    };

    setRecords((prev) => [record, ...prev]);
    playConfirm();
    setShowSaved(true);

    setTimeout(() => {
      setShowSaved(false);
      setPhase("waiting");
      setCurrentAnimal(null);
      setCurrentWeight(null);
    }, 2000);
  };

  const handleReject = () => {
    playReject();
    setPhase("waiting");
    setCurrentAnimal(null);
    setCurrentWeight(null);
  };

  // Session stats
  const totalAnimals = records.length;
  const avgWeight =
    totalAnimals > 0 ? +(records.reduce((s, r) => s + r.weight, 0) / totalAnimals).toFixed(1) : 0;
  const withGmd = records.filter((r) => r.gmd !== null);
  const avgGmd =
    withGmd.length > 0 ? +(withGmd.reduce((s, r) => s + (r.gmd || 0), 0) / withGmd.length).toFixed(3) : null;

  // Background color by phase
  const bgClass =
    showSaved
      ? "bg-emerald-600"
      : phase === "weighed"
      ? "bg-emerald-700"
      : phase === "identified"
      ? "bg-blue-700"
      : "bg-muted";

  const arroba = currentWeight ? (currentWeight / ARROBA_KG).toFixed(1) : null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-500 ${bgClass}`}>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30">
        <div className="flex items-center gap-3">
          <Weight className="h-5 w-5 text-white" />
          <span className="text-white font-bold text-lg">MODO BRETE</span>
          {useSimulation && (
            <Badge variant="outline" className="text-[10px] text-yellow-300 border-yellow-500">
              SIMULAÇÃO
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-auto">
        {showSaved ? (
          /* ── Saved confirmation ── */
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-8xl">✅</div>
            <p className="text-white text-4xl font-bold">SALVO</p>
            <p className="text-white/80 text-xl">Próximo animal...</p>
          </div>
        ) : phase === "waiting" ? (
          /* ── Waiting phase ── */
          <div className="text-center space-y-6">
            <Radio className="h-24 w-24 text-muted-foreground/50 mx-auto animate-pulse" />
            <p className="text-3xl font-bold text-muted-foreground">AGUARDANDO ANIMAL...</p>
            <p className="text-muted-foreground text-sm">Passe o animal pelo brete com o leitor RFID ativo</p>
          </div>
        ) : (
          /* ── Identified / Weighed ── */
          <div className="w-full max-w-2xl space-y-6">
            {/* Animal info */}
            <div className="text-center space-y-2">
              <p className="text-white/70 text-sm tracking-widest uppercase">ANIMAL IDENTIFICADO</p>
              <p className="text-white text-5xl font-mono font-bold">{currentAnimal?.earTag}</p>
              {currentAnimal?.animal ? (
                <div className="space-y-1">
                  <p className="text-white text-2xl font-semibold">{currentAnimal.animal.name}</p>
                  <p className="text-white/80 text-lg">
                    {currentAnimal.category} • {currentAnimal.animal.breed} • {currentAnimal.animal.sex === "M" ? "♂" : "♀"} • {age(currentAnimal.animal.birth_date)}
                  </p>
                </div>
              ) : (
                <p className="text-yellow-300 text-lg">Animal não cadastrado</p>
              )}
            </div>

            {/* Last weighing info */}
            {currentAnimal?.lastW && (
              <div className="bg-white/10 rounded-xl px-6 py-3 text-center">
                <p className="text-white/60 text-xs uppercase">Última pesagem</p>
                <p className="text-white text-xl font-bold">
                  {currentAnimal.lastW.weight_kg} kg em{" "}
                  {new Date(currentAnimal.lastW.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}

            {/* Alerts */}
            {currentAnimal && currentAnimal.alerts.length > 0 && (
              <div className="space-y-2">
                {currentAnimal.alerts.map((alert, i) => (
                  <div key={i} className={`${alert.color} rounded-xl px-5 py-3 flex items-center gap-3 animate-pulse`}>
                    {alert.icon}
                    <span className="font-bold text-sm">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weight display */}
            {phase === "weighed" && currentWeight !== null ? (
              <div className="text-center space-y-3">
                <p className="text-white/60 text-xs uppercase tracking-widest">PESO ESTABILIZADO</p>
                <p className="text-white text-8xl font-bold font-mono leading-none">
                  {currentWeight.toFixed(1)}
                  <span className="text-4xl ml-2">kg</span>
                </p>
                <p className="text-white/80 text-2xl font-mono">{arroba} @</p>

                {currentAnimal?.lastW && (
                  <div className="mt-4">
                    {(() => {
                      const variation = currentWeight - currentAnimal.lastW.weight_kg;
                      const days = Math.round(
                        (Date.now() - new Date(currentAnimal.lastW.date).getTime()) / 86400000
                      );
                      const gmd = days > 0 ? variation / days : 0;
                      const gmdClass = classifyGmd(gmd);
                      const isGood = gmd >= 0.5;
                      return (
                        <p className={`text-xl font-bold ${isGood ? "text-green-300" : "text-red-300"}`}>
                          {variation >= 0 ? "+" : ""}{variation.toFixed(1)} kg desde{" "}
                          {new Date(currentAnimal.lastW.date).toLocaleDateString("pt-BR")} — GMD:{" "}
                          {gmd.toFixed(2)} kg/dia ({gmdClassLabels[gmdClass]})
                        </p>
                      );
                    })()}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6 pt-6">
                  <Button
                    onClick={handleConfirm}
                    className="h-20 px-12 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-2xl"
                  >
                    <Check className="h-8 w-8 mr-3" /> CONFIRMAR
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    className="h-20 px-12 text-2xl font-bold rounded-2xl shadow-2xl"
                  >
                    <XCircle className="h-8 w-8 mr-3" /> REJEITAR
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Weight className="h-16 w-16 text-white/40 mx-auto animate-bounce" />
                <p className="text-white/60 text-xl mt-4 animate-pulse">Aguardando peso estabilizar...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Session footer ── */}
      <div className="bg-black/40 px-6 py-3 flex items-center justify-between text-white text-sm">
        <div className="flex items-center gap-6">
          <span>
            <span className="font-bold">{totalAnimals}</span> pesados
          </span>
          {totalAnimals > 0 && (
            <>
              <span>
                Peso médio: <span className="font-bold">{avgWeight} kg</span>
              </span>
              {avgGmd !== null && (
                <span>
                  GMD médio: <span className="font-bold">{avgGmd} kg/dia</span>
                </span>
              )}
            </>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Sessão iniciada {sessionStart.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 gap-1"
          onClick={() => {
            if (records.length === 0) return;
            // Generate export text
            const lines = [
              `Relatório Modo Brete — ${new Date().toLocaleDateString("pt-BR")}`,
              `Sessão: ${sessionStart.toLocaleTimeString("pt-BR")} - ${new Date().toLocaleTimeString("pt-BR")}`,
              `Total: ${totalAnimals} animais | Peso médio: ${avgWeight} kg | GMD médio: ${avgGmd ?? "N/A"} kg/dia`,
              "",
              "Brinco;Nome;Raça;Peso(kg);@;Peso Anterior;Variação;GMD;Hora",
              ...records.map(
                (r) =>
                  `${r.earTag};${r.animalName};${r.breed};${r.weight};${(r.weight / ARROBA_KG).toFixed(1)};${r.previousWeight ?? ""};${r.variation?.toFixed(1) ?? ""};${r.gmd?.toFixed(3) ?? ""};${r.timestamp.toLocaleTimeString("pt-BR")}`
              ),
            ];
            const blob = new Blob([lines.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `brete-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" /> Exportar sessão
        </Button>
      </div>

      {/* ── Records sidebar (shows last 5) ── */}
      {records.length > 0 && (
        <div className="absolute right-0 top-14 bottom-14 w-72 bg-black/50 overflow-y-auto p-3 space-y-2">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Últimas pesagens</p>
          {records.slice(0, 10).map((r, i) => (
            <div
              key={i}
              className="bg-white/10 rounded-lg px-3 py-2 text-white text-xs space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{r.earTag}</span>
                <span className="font-bold text-lg">{r.weight} kg</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>{r.animalName}</span>
                {r.gmd !== null && (
                  <span className={r.gmd >= 0.5 ? "text-green-300" : "text-red-300"}>
                    GMD: {r.gmd.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-white/40">{r.timestamp.toLocaleTimeString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
