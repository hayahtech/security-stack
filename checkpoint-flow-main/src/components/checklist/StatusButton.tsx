import { cn } from '@/lib/utils';
import type { ItemStatus } from '@/types/checklist';

interface StatusButtonProps {
  status: ItemStatus;
  currentStatus: ItemStatus;
  onClick: () => void;
  label: string;
}

const statusStyles: Record<ItemStatus, string> = {
  OK: 'bg-success text-success-foreground',
  NOT_OK: 'bg-destructive text-destructive-foreground',
  NA: 'bg-neutral text-primary-foreground',
  PENDING: '',
};

const inactiveStyles: Record<ItemStatus, string> = {
  OK: 'border-success/40 text-success hover:bg-success/10',
  NOT_OK: 'border-destructive/40 text-destructive hover:bg-destructive/10',
  NA: 'border-neutral/40 text-neutral hover:bg-neutral/10',
  PENDING: '',
};

export function StatusButton({ status, currentStatus, onClick, label }: StatusButtonProps) {
  const isActive = currentStatus === status;

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-md text-xs font-semibold border transition-fast select-none',
        isActive ? statusStyles[status] + ' border-transparent shadow-sm' : inactiveStyles[status]
      )}
    >
      {label}
    </button>
  );
}
