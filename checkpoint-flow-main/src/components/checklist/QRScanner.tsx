import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onResult: (value: string) => void;
}

export function QRScanner({ open, onClose, onResult }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const scannerId = 'qr-reader-element';
    let scanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onResult(decodedText);
            stopScanner();
            onClose();
          },
          () => {} // ignore scan failures
        );
      } catch (err) {
        setError('Não foi possível acessar a câmera.');
      }
    };

    const stopScanner = async () => {
      try {
        if (scanner && scanner.isScanning) {
          await scanner.stop();
        }
      } catch {}
    };

    // Small delay to let the DOM element mount
    const timer = setTimeout(startScanner, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [open, onResult, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear QR Code</DialogTitle>
        </DialogHeader>
        <div id="qr-reader-element" className="w-full min-h-[300px] rounded-lg overflow-hidden bg-muted" />
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
