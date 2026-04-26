import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import type { ChecklistItem, FinalStatus } from '@/types/checklist';
import { cn } from '@/lib/utils';
import { SignatureCanvas } from './SignatureCanvas';

interface Props {
  items: ChecklistItem[];
  onFinalize: () => void;
  finalStatus: FinalStatus;
  auditConfirmed: boolean;
  onConfirmToggle: () => void;
  userName: string;
  onUserNameChange: (name: string) => void;
  signatureData: string | null;
  onSignatureChange: (data: string | null) => void;
  disabled?: boolean;
  // Approval flow props
  isSupervisor?: boolean;
  workflowLabel?: string;
  finalizeLabel?: string;
  canFinalize?: boolean;
}

export function ValidationSidebar({
  items, onFinalize, finalStatus, auditConfirmed, onConfirmToggle,
  userName, onUserNameChange, signatureData, onSignatureChange,
  disabled = false, isSupervisor = false, workflowLabel, finalizeLabel, canFinalize,
}: Props) {
  const total = items.length;
  const completed = items.filter(i => i.status !== 'PENDING').length;
  const okCount = items.filter(i => i.status === 'OK').length;
  const failedCount = items.filter(i => i.status === 'NOT_OK').length;
  const naCount = items.filter(i => i.status === 'NA').length;
  const pendingCount = items.filter(i => i.status === 'PENDING').length;

  const criticalItems = items.filter(i => i.isCritical);
  const failedCritical = criticalItems.filter(i => i.status === 'NOT_OK');
  const pendingCritical = criticalItems.filter(i => i.status === 'PENDING');

  const hasSignature = signatureData != null && signatureData !== 'pending' && signatureData.length > 0;
  const defaultCanApprove = failedCritical.length === 0 && pendingCritical.length === 0 && auditConfirmed && userName.trim().length > 0 && hasSignature;
  const isBlocked = failedCritical.length > 0;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const effectiveCanFinalize = canFinalize !== undefined ? canFinalize : defaultCanApprove;

  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-elevated)] p-5 space-y-5">
      <h3 className="font-display font-bold text-base text-card-foreground">Resumo da Validação</h3>

      {workflowLabel && (
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-center">
          <p className="text-xs font-bold text-primary">{workflowLabel}</p>
        </div>
      )}

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progresso</span>
          <span>{completed}/{total} itens</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-2">
        <StatBadge icon={<CheckCircle2 className="w-4 h-4" />} label="OK" count={okCount} className="text-success" />
        <StatBadge icon={<XCircle className="w-4 h-4" />} label="Não OK" count={failedCount} className="text-destructive" />
        <StatBadge icon={<Clock className="w-4 h-4" />} label="Pendente" count={pendingCount} className="text-warning" />
        <StatBadge icon={<AlertTriangle className="w-4 h-4" />} label="N/A" count={naCount} className="text-neutral" />
      </div>

      {/* Critical failures */}
      {failedCritical.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1.5">
          <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> Itens obrigatórios reprovados
          </p>
          {failedCritical.map(item => (
            <p key={item.id} className="text-xs text-destructive/80 pl-5">• {item.label}</p>
          ))}
        </div>
      )}

      {pendingCritical.length > 0 && (
        <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 space-y-1.5">
          <p className="text-xs font-bold text-warning flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Itens obrigatórios pendentes
          </p>
          {pendingCritical.map(item => (
            <p key={item.id} className="text-xs text-warning/80 pl-5">• {item.label}</p>
          ))}
        </div>
      )}

      {/* Audit */}
      {!isSupervisor && (
        <div className="space-y-3 pt-2 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auditoria</h4>
          <input
            type="text"
            placeholder="Nome do responsável"
            value={userName}
            onChange={(e) => onUserNameChange(e.target.value)}
            maxLength={100}
            disabled={disabled}
            className="w-full rounded-md border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />

          {/* Signature canvas */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Assinatura do responsável</p>
            <SignatureCanvas onSignatureChange={onSignatureChange} disabled={disabled} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={auditConfirmed}
              onChange={onConfirmToggle}
              disabled={disabled}
              className="rounded border-input text-primary focus:ring-ring w-4 h-4"
            />
            <span className="text-xs text-card-foreground">Confirmo que todas as informações são verdadeiras</span>
          </label>
        </div>
      )}

      {/* Final status */}
      {finalStatus !== 'pending' && (
        <div className={cn(
          'rounded-lg p-3 text-center font-display font-bold text-sm',
          finalStatus === 'approved' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
        )}>
          {finalStatus === 'approved' ? '✅ APROVADO' : '❌ REJEITADO'}
        </div>
      )}

      {/* Finalize button */}
      <button
        onClick={onFinalize}
        disabled={!effectiveCanFinalize && !isBlocked}
        className={cn(
          'w-full rounded-lg py-3 text-sm font-bold font-display transition-fast',
          isBlocked
            ? 'bg-destructive/15 text-destructive border border-destructive/30 cursor-not-allowed'
            : effectiveCanFinalize
              ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-md'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {isBlocked ? '⛔ Processo Bloqueado' : finalizeLabel || (effectiveCanFinalize ? 'Finalizar Checklist' : 'Preencha todos os campos')}
      </button>
    </div>
  );
}

function StatBadge({ icon, label, count, className }: { icon: React.ReactNode; label: string; count: number; className: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg bg-muted/50 p-2', className)}>
      {icon}
      <div>
        <p className="text-lg font-bold leading-none">{count}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
