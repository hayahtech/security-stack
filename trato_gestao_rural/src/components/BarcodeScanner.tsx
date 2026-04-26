import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, Scan, X, Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string, format?: string) => void;
  title?: string;
  description?: string;
  continuous?: boolean; // Keep scanning after each read
  allowManual?: boolean;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

export function BarcodeScanner({
  open,
  onOpenChange,
  onScan,
  title = "Escanear Código",
  description = "Aponte a câmera para o código de barras ou QR Code",
  continuous = false,
  allowManual = true,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("barcode-scanner-" + Math.random().toString(36).slice(2));
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef(0);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {
      // ignore
    }
    scannerRef.current = null;
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    const elementId = containerRef.current;

    // Ensure DOM element exists
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText, result) => {
          const now = Date.now();
          // Debounce: ignore same code within 2s
          if (decodedText === lastScannedRef.current && now - lastScanTimeRef.current < 2000) return;
          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;

          const formatName = result?.result?.format?.formatName || "unknown";
          onScan(decodedText, formatName);

          if (!continuous) {
            stopScanner();
            onOpenChange(false);
          }
        },
        () => {
          // ignore scan failures
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setCameraError("Permita o acesso à câmera nas configurações do navegador");
      } else if (msg.includes("NotFoundError")) {
        setCameraError("Nenhuma câmera encontrada neste dispositivo");
      } else {
        setCameraError("Erro ao acessar a câmera: " + msg);
      }
    }
  }, [onScan, continuous, stopScanner, onOpenChange]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is mounted
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
      setShowManual(false);
      setManualCode("");
      setCameraError(null);
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) { toast.error("Digite o código"); return; }
    onScan(code, "MANUAL");
    if (!continuous) {
      onOpenChange(false);
    }
    setManualCode("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopScanner(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera view */}
          {!showManual && (
            <div className="relative">
              <div
                id={containerRef.current}
                className="w-full min-h-[280px] rounded-lg overflow-hidden bg-muted"
              />
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted rounded-lg p-4">
                  <CameraOff className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-center text-muted-foreground">{cameraError}</p>
                  <Button variant="outline" size="sm" onClick={startScanner}>
                    <Camera className="h-4 w-4 mr-1" /> Tentar novamente
                  </Button>
                </div>
              )}
              {continuous && isScanning && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Manual input fallback */}
          {showManual && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Código de barras / QR Code</Label>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Digite o código manualmente..."
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  autoFocus
                />
              </div>
              <Button onClick={handleManualSubmit} className="w-full">Confirmar</Button>
            </div>
          )}

          {/* Toggle manual / camera */}
          {allowManual && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!showManual) stopScanner();
                  else startScanner();
                  setShowManual(!showManual);
                }}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                {showManual ? (
                  <><Camera className="h-3.5 w-3.5" /> Usar câmera</>
                ) : (
                  <><Keyboard className="h-3.5 w-3.5" /> Digitar manualmente</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Tiny trigger button to place next to fields ── */
export function ScanButton({
  onClick,
  className = "",
  size = "icon",
}: {
  onClick: () => void;
  className?: string;
  size?: "icon" | "sm";
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={onClick}
      className={`shrink-0 ${className}`}
      title="Escanear código de barras"
    >
      <Scan className="h-4 w-4" />
    </Button>
  );
}
