import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  onSignatureChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function SignatureCanvas({ onSignatureChange, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const isDrawing = useRef(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const getPos = useCallback((e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
    }
  }, []);

  const startDraw = useCallback((x: number, y: number) => {
    if (disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    isDrawing.current = true;
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--foreground')
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()})`
      : '#000';
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [disabled, getCtx]);

  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing.current || disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasContent) {
      setHasContent(true);
      onSignatureChange('pending');
    }
  }, [disabled, getCtx, hasContent, onSignatureChange]);

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasContent) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  }, [hasContent, onSignatureChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      const pos = getPos(e, canvas);
      startDraw(pos.x, pos.y);
    };
    const onMouseMove = (e: MouseEvent) => {
      const pos = getPos(e, canvas);
      draw(pos.x, pos.y);
    };
    const onMouseUp = () => endDraw();

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e.touches[0], canvas);
      startDraw(pos.x, pos.y);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e.touches[0], canvas);
      draw(pos.x, pos.y);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      endDraw();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [getPos, startDraw, draw, endDraw]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasContent(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className={cn(
            'w-full rounded-lg border-2 border-dashed bg-muted/30 touch-none',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair',
            hasContent ? 'border-primary/40' : 'border-border'
          )}
          style={{ height: 160 }}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-muted-foreground">Assine aqui</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={disabled || !hasContent}
        className="text-xs text-muted-foreground hover:text-foreground transition-fast disabled:opacity-40"
      >
        Limpar assinatura
      </button>
    </div>
  );
}
