import React, { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AnimalQrProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  animal: {
    id: string;
    ear_tag: string;
    name: string;
    breed: string;
    birth_date: string;
  };
}

export function AnimalQrDialog({ open, onOpenChange, animal }: AnimalQrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (open && animal.ear_tag) {
      QRCode.toDataURL(animal.ear_tag, { width: 200, margin: 2, errorCorrectionLevel: "M" })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    }
  }, [open, animal.ear_tag]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-${animal.ear_tag}.png`;
    a.click();
  }, [qrDataUrl, animal.ear_tag]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Etiqueta ${animal.ear_tag}</title>
      <style>
        @page { size: 62mm 29mm; margin: 0; }
        body { margin: 0; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; }
        .label { width: 62mm; height: 29mm; display: flex; align-items: center; padding: 2mm; box-sizing: border-box; }
        .qr { width: 22mm; height: 22mm; flex-shrink: 0; }
        .info { margin-left: 3mm; font-size: 7pt; line-height: 1.4; }
        .tag { font-weight: bold; font-size: 10pt; font-family: monospace; }
      </style></head>
      <body>
        <div class="label">
          <img class="qr" src="${qrDataUrl}" />
          <div class="info">
            <div class="tag">${animal.ear_tag}</div>
            <div>${animal.name}</div>
            <div>${animal.breed}</div>
            <div>${new Date(animal.birth_date + "T12:00").toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [qrDataUrl, animal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><QrCode className="h-5 w-5 text-primary" /> QR Code do Animal</DialogTitle>
          <DialogDescription>Etiqueta de identificação para {animal.ear_tag}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />}
          <div className="text-center">
            <p className="font-mono font-bold text-lg text-foreground">{animal.ear_tag}</p>
            <p className="text-sm text-muted-foreground">{animal.name} • {animal.breed}</p>
            <p className="text-xs text-muted-foreground">{new Date(animal.birth_date + "T12:00").toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-1.5"><Download className="h-4 w-4" /> Download</Button>
          <Button onClick={handlePrint} className="gap-1.5"><Printer className="h-4 w-4" /> Imprimir Etiqueta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Generate batch print labels for multiple animals */
export function printBatchLabels(animals: { ear_tag: string; name: string; breed: string; birth_date: string }[]) {
  const promises = animals.map(a =>
    QRCode.toDataURL(a.ear_tag, { width: 150, margin: 1, errorCorrectionLevel: "M" })
      .then(url => ({ ...a, qr: url }))
  );

  Promise.all(promises).then(items => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const labels = items.map(a => `
      <div class="label">
        <img class="qr" src="${a.qr}" />
        <div class="info">
          <div class="tag">${a.ear_tag}</div>
          <div>${a.name}</div>
          <div>${a.breed}</div>
          <div>${new Date(a.birth_date + "T12:00").toLocaleDateString("pt-BR")}</div>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <html><head><title>Etiquetas de Animais</title>
      <style>
        @page { margin: 5mm; }
        body { margin: 0; font-family: Arial, sans-serif; }
        .grid { display: grid; grid-template-columns: repeat(3, 62mm); gap: 3mm; }
        .label { width: 62mm; height: 29mm; display: flex; align-items: center; padding: 2mm; box-sizing: border-box; border: 0.5px solid #ccc; }
        .qr { width: 22mm; height: 22mm; flex-shrink: 0; }
        .info { margin-left: 3mm; font-size: 7pt; line-height: 1.4; }
        .tag { font-weight: bold; font-size: 10pt; font-family: monospace; }
      </style></head>
      <body><div class="grid">${labels}</div></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  });
}
