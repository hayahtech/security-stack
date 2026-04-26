import { useState } from "react";
import { Beef, Syringe, Milk, MapPin, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type FieldAction = null | "pesar" | "vacina" | "ordenha" | "mover";

export default function ModoCampo() {
  const [action, setAction] = useState<FieldAction>(null);

  /* shared */
  const [earTag, setEarTag] = useState("");

  /* pesar */
  const [peso, setPeso] = useState("");

  /* vacina */
  const [vacina, setVacina] = useState("Ivermectina");
  const [dose, setDose] = useState("");

  /* ordenha */
  const [litros, setLitros] = useState("");
  const [turno, setTurno] = useState("Manhã");

  /* mover */
  const [pastoDestino, setPastoDestino] = useState("");

  function reset() {
    setAction(null);
    setEarTag("");
    setPeso("");
    setDose("");
    setLitros("");
    setPastoDestino("");
  }

  function handleSubmit() {
    if (!earTag.trim()) { toast.error("Informe o brinco do animal"); return; }
    switch (action) {
      case "pesar":
        if (!peso) { toast.error("Informe o peso"); return; }
        toast.success(`Pesagem registrada — ${earTag}: ${peso} kg`);
        break;
      case "vacina":
        toast.success(`Vacina registrada — ${earTag}: ${vacina}`);
        break;
      case "ordenha":
        if (!litros) { toast.error("Informe os litros"); return; }
        toast.success(`Ordenha registrada — ${earTag}: ${litros}L (${turno})`);
        break;
      case "mover":
        if (!pastoDestino) { toast.error("Informe o pasto de destino"); return; }
        toast.success(`Animal ${earTag} movido para ${pastoDestino}`);
        break;
    }
    setEarTag("");
    setPeso("");
    setDose("");
    setLitros("");
    setPastoDestino("");
  }

  const bigBtn = "h-28 sm:h-32 text-lg sm:text-xl font-bold gap-3 rounded-2xl";

  if (!action) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Modo Campo</h1>
          <p className="text-base text-muted-foreground">O que você deseja fazer?</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
          <Button
            variant="outline"
            className={`${bigBtn} flex-col border-2 border-primary/30 hover:border-primary hover:bg-primary/5`}
            onClick={() => setAction("pesar")}
          >
            <Beef className="h-10 w-10 text-primary" />
            <span>Pesar Animal</span>
          </Button>
          <Button
            variant="outline"
            className={`${bigBtn} flex-col border-2 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5`}
            onClick={() => setAction("vacina")}
          >
            <Syringe className="h-10 w-10 text-emerald-600" />
            <span>Registrar Vacina</span>
          </Button>
          <Button
            variant="outline"
            className={`${bigBtn} flex-col border-2 border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/5`}
            onClick={() => setAction("ordenha")}
          >
            <Milk className="h-10 w-10 text-blue-600" />
            <span>Registrar Ordenha</span>
          </Button>
          <Button
            variant="outline"
            className={`${bigBtn} flex-col border-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5`}
            onClick={() => setAction("mover")}
          >
            <MapPin className="h-10 w-10 text-amber-600" />
            <span>Mover Animais</span>
          </Button>
        </div>
      </div>
    );
  }

  const titles: Record<string, string> = {
    pesar: "🐄 Pesar Animal",
    vacina: "💉 Registrar Vacina",
    ordenha: "🥛 Registrar Ordenha",
    mover: "📍 Mover Animal",
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start p-4 space-y-4 max-w-lg mx-auto">
      <Button variant="ghost" onClick={reset} className="self-start gap-2 text-base h-12">
        <ArrowLeft className="h-5 w-5" /> Voltar
      </Button>

      <h2 className="text-2xl font-bold">{titles[action]}</h2>

      <Card className="w-full">
        <CardContent className="space-y-5 pt-6">
          {/* Brinco — always shown */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Brinco do Animal</Label>
            <Input
              value={earTag}
              onChange={(e) => setEarTag(e.target.value)}
              placeholder="Ex: BR001"
              className="h-14 text-lg text-center font-mono tracking-widest"
              autoFocus
            />
          </div>

          {action === "pesar" && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Peso (kg)</Label>
              <Input
                type="number" min={0}
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ex: 450"
                className="h-14 text-lg text-center"
              />
            </div>
          )}

          {action === "vacina" && (
            <>
              <div className="space-y-2">
                <Label className="text-base font-medium">Medicamento</Label>
                <Select value={vacina} onValueChange={setVacina}>
                  <SelectTrigger className="h-14 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Ivermectina", "Doramectina", "Vacina Aftosa", "Vacina Brucelose", "Vacina Raiva", "Oxitetraciclina"].map((m) => (
                      <SelectItem key={m} value={m} className="text-base py-2">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Dose (mL)</Label>
                <Input
                  type="number" min={0}
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="Ex: 5"
                  className="h-14 text-lg text-center"
                />
              </div>
            </>
          )}

          {action === "ordenha" && (
            <>
              <div className="space-y-2">
                <Label className="text-base font-medium">Turno</Label>
                <Select value={turno} onValueChange={setTurno}>
                  <SelectTrigger className="h-14 text-base"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã" className="text-base py-2">☀️ Manhã</SelectItem>
                    <SelectItem value="Tarde" className="text-base py-2">🌤️ Tarde</SelectItem>
                    <SelectItem value="Noite" className="text-base py-2">🌙 Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Litros</Label>
                <Input
                  type="number" min={0} step={0.1}
                  value={litros}
                  onChange={(e) => setLitros(e.target.value)}
                  placeholder="Ex: 12.5"
                  className="h-14 text-lg text-center"
                />
              </div>
            </>
          )}

          {action === "mover" && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Pasto de Destino</Label>
              <Select value={pastoDestino} onValueChange={setPastoDestino}>
                <SelectTrigger className="h-14 text-base"><SelectValue placeholder="Selecione o pasto" /></SelectTrigger>
                <SelectContent>
                  {["Pasto 1 — Brachiária", "Pasto 2 — Mombaça", "Pasto 3 — Tifton", "Pasto 4 — Marandu", "Curral", "Confinamento"].map((p) => (
                    <SelectItem key={p} value={p} className="text-base py-2">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full h-14 text-lg font-bold rounded-xl mt-2">
            ✅ Registrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
