import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Scan, Weight, Syringe, Droplets, MapPin } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { mockAnimals } from "@/data/rebanho-mock";
import { toast } from "sonner";

export function RebanhoFloatingScanner() {
  const [scanOpen, setScanOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [scannedAnimal, setScannedAnimal] = useState<typeof mockAnimals[0] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isRebanhoRoute = location.pathname.startsWith("/rebanho");

  const handleScan = useCallback((code: string) => {
    const animal = mockAnimals.find(a => a.ear_tag === code);
    if (animal) {
      setScannedAnimal(animal);
      setActionsOpen(true);
    } else {
      toast.error(`Animal não encontrado com brinco: ${code}`);
    }
  }, []);

  const quickAction = (action: string) => {
    if (!scannedAnimal) return;
    setActionsOpen(false);
    switch (action) {
      case "ficha":
        navigate(`/rebanho/animais/${scannedAnimal.id}`);
        break;
      case "pesagem":
        toast.info(`Pesagem para ${scannedAnimal.ear_tag} — funcionalidade a implementar`);
        navigate(`/rebanho/pesagens`);
        break;
      case "tratamento":
        navigate(`/rebanho/tratamentos`);
        break;
      case "ordenha":
        navigate(`/rebanho/leite`);
        break;
      case "mover":
        navigate(`/rebanho/movimentacoes`);
        break;
    }
  };

  if (!isRebanhoRoute) return null;

  return (
    <>
      <Button
        onClick={() => setScanOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg gap-0"
        size="icon"
      >
        <Scan className="h-6 w-6" />
      </Button>

      <BarcodeScanner
        open={scanOpen}
        onOpenChange={setScanOpen}
        onScan={handleScan}
        title="Escanear Animal"
        description="Aponte para o QR Code do brinco do animal"
      />

      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {scannedAnimal?.ear_tag} — {scannedAnimal?.name}
            </DialogTitle>
            <DialogDescription>{scannedAnimal?.breed} • {scannedAnimal?.paddock}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            <Button variant="outline" onClick={() => quickAction("ficha")} className="h-16 flex-col gap-1 text-xs">
              <Scan className="h-5 w-5 text-primary" /> Ver Ficha
            </Button>
            <Button variant="outline" onClick={() => quickAction("pesagem")} className="h-16 flex-col gap-1 text-xs">
              <Weight className="h-5 w-5 text-blue-500" /> Pesagem
            </Button>
            <Button variant="outline" onClick={() => quickAction("tratamento")} className="h-16 flex-col gap-1 text-xs">
              <Syringe className="h-5 w-5 text-red-500" /> Tratamento
            </Button>
            <Button variant="outline" onClick={() => quickAction("ordenha")} className="h-16 flex-col gap-1 text-xs">
              <Droplets className="h-5 w-5 text-cyan-500" /> Ordenha
            </Button>
            <Button variant="outline" onClick={() => quickAction("mover")} className="col-span-2 h-12 gap-1.5 text-xs">
              <MapPin className="h-5 w-5 text-amber-500" /> Mover Pasto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
