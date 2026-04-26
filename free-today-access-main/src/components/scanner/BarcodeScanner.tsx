import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import type { VideoInputDevice } from '@zxing/library';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Camera, SwitchCamera, Keyboard } from 'lucide-react';

const BEEP_FREQUENCY = 1800;
const BEEP_DURATION = 150;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = BEEP_FREQUENCY;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + BEEP_DURATION / 1000);
  } catch { /* audio not available */ }
}

function vibrate() {
  try { navigator.vibrate?.(100); } catch { /* not supported */ }
}

interface BarcodeScannerProps {
  onResult: (code: string) => void;
  mode?: 'barcode' | 'qrcode' | 'all';
  continuous?: boolean;
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODE_FORMATS: Record<string, BarcodeFormat[]> = {
  barcode: [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
  qrcode: [BarcodeFormat.QR_CODE],
  all: [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.DATA_MATRIX, BarcodeFormat.PDF_417],
};

export function BarcodeScanner({ onResult, mode = 'all', continuous = false, placeholder = 'Digite o código manualmente', open, onOpenChange }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || manualMode) return;
    setCameraError(false);

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, MODE_FORMATS[mode] || MODE_FORMATS.all);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      const devices = await reader.listVideoInputDevices();
      let deviceId: string | undefined;

      if (devices.length > 1) {
        const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
        deviceId = facingMode === 'environment'
          ? (backCam?.deviceId || devices[devices.length - 1].deviceId)
          : devices[0].deviceId;
      }

      reader.decodeFromVideoDevice(deviceId || null, videoRef.current, (result, error) => {
        if (result) {
          const code = result.getText();
          if (code === lastScanned && !continuous) return;

          playBeep();
          vibrate();
          setLastScanned(code);
          onResult(code);

          if (!continuous) {
            onOpenChange(false);
          }
        }
      });

      // Timeout: 30s without reading
      timeoutRef.current = window.setTimeout(() => {
        if (!lastScanned) {
          setManualMode(true);
        }
      }, 30000);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
      setManualMode(true);
    }
  }, [mode, facingMode, continuous, manualMode, onResult, onOpenChange, lastScanned]);

  useEffect(() => {
    if (open) {
      setManualMode(false);
      setLastScanned(null);
      setCameraError(false);
      // Small delay for DOM to render video element
      const t = setTimeout(() => startScanning(), 300);
      return () => clearTimeout(t);
    } else {
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [open, startScanning]);

  // Re-start when switching cameras
  useEffect(() => {
    if (open && !manualMode) {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      const t = setTimeout(() => startScanning(), 300);
      return () => clearTimeout(t);
    }
  }, [facingMode]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onResult(manualCode.trim());
      setManualCode('');
      if (!continuous) onOpenChange(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-full h-full m-0 rounded-none' : 'max-w-lg'} p-0 gap-0 overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-background border-b">
          <h3 className="text-sm font-semibold">
            {mode === 'qrcode' ? 'Escanear QR Code' : mode === 'barcode' ? 'Escanear Código de Barras' : 'Escanear Código'}
          </h3>
          <div className="flex items-center gap-1">
            {!manualMode && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setManualMode(true)} title="Digitar manualmente">
                  <Keyboard className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={switchCamera} title="Trocar câmera">
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              </>
            )}
            {manualMode && !cameraError && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setManualMode(false)} title="Usar câmera">
                <Camera className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Camera view */}
        {!manualMode && (
          <div className="relative bg-black">
            <video ref={videoRef} className={`w-full ${isMobile ? 'h-[60vh]' : 'h-[350px]'} object-cover`} playsInline muted autoPlay />
            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`${mode === 'qrcode' ? 'w-56 h-56' : 'w-72 h-28'} border-2 border-primary rounded-lg relative`}>
                {/* Animated corners */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg animate-pulse" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg animate-pulse" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg animate-pulse" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg animate-pulse" />
              </div>
            </div>
            {/* Scan line animation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`${mode === 'qrcode' ? 'w-56' : 'w-72'} h-0.5 bg-primary/60 animate-bounce`} />
            </div>
          </div>
        )}

        {/* Manual input */}
        {manualMode && (
          <div className="p-6 space-y-4">
            {cameraError && (
              <p className="text-sm text-muted-foreground text-center">
                Câmera indisponível. Digite o código manualmente.
              </p>
            )}
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={placeholder}
                className="font-mono"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>OK</Button>
            </div>
          </div>
        )}

        {/* Last scanned (continuous mode) */}
        {continuous && lastScanned && (
          <div className="p-3 border-t bg-green-50 dark:bg-green-950/20 text-center">
            <p className="text-xs text-muted-foreground">Último lido:</p>
            <p className="text-sm font-mono font-bold text-green-700 dark:text-green-400">{lastScanned}</p>
          </div>
        )}

        {/* Footer hint */}
        {!manualMode && (
          <div className="p-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Aponte a câmera para o {mode === 'qrcode' ? 'QR Code' : 'código de barras'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
