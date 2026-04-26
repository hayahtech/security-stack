import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_MS   = 2  * 60 * 1000;  // avisa 2 minutos antes

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
];

interface UseSessionTimeoutOptions {
  onTimeout: () => void;
  onWarning?: () => void;
  enabled?: boolean;
}

/**
 * Encerra a sessão após INACTIVITY_MS de inatividade total.
 * Dispara onWarning WARNING_MS antes do timeout para alertar o usuário.
 * Reinicia o timer em qualquer evento de interação do usuário.
 */
export function useSessionTimeout({ onTimeout, onWarning, enabled = true }: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef  = useRef(onTimeout);
  const onWarningRef  = useRef(onWarning);

  // Mantém refs atualizadas sem re-registrar listeners
  useEffect(() => { onTimeoutRef.current  = onTimeout;  }, [onTimeout]);
  useEffect(() => { onWarningRef.current  = onWarning;  }, [onWarning]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    if (warningRef.current)  clearTimeout(warningRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimers();

    warningRef.current = setTimeout(() => {
      onWarningRef.current?.();
    }, INACTIVITY_MS - WARNING_MS);

    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, INACTIVITY_MS);
  }, [enabled, clearTimers]);

  useEffect(() => {
    if (!enabled) return;

    resetTimer();

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [enabled, resetTimer, clearTimers]);
}
