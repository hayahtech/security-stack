import { Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function HideValuesToggle() {
  const { hideValues, toggleHideValues } = useAppStore();

  return (
    <button
      onClick={toggleHideValues}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
      title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
    >
      {hideValues ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
    </button>
  );
}

export function useMaskedCurrency(formatter: (v: number) => string) {
  const { hideValues } = useAppStore();
  return (value: number) => hideValues ? '•••••' : formatter(value);
}
