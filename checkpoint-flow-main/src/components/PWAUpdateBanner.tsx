import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-lg px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-foreground">Nova versão disponível</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="text-xs font-bold text-primary hover:underline"
      >
        Atualizar
      </button>
    </div>
  );
}
