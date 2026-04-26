import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowDownToLine, ArrowUpFromLine, ClipboardList, Moon, Sun, Wifi, WifiOff, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChecklistItemCard } from './ChecklistItemCard';
import { ValidationSidebar } from './ValidationSidebar';
import { ContextToggle } from './ContextToggle';
import { CnpjInput } from './CnpjInput';
import type { EmpresaInfo } from './CnpjInput';
import { toast } from 'sonner';
import {
  type ChecklistItem, type ChecklistType, type ChecklistContext, type ItemStatus, type FinalStatus,
  type UserRole, type ApprovalFlow, type WorkflowStatus, type CriticalAlert, type GeoLocation,
  INBOUND_ITEMS, OUTBOUND_ITEMS, AUDIT_ITEMS, VEHICLE_ITEMS, FRAGILE_ITEMS, HAZMAT_ITEMS,
  MODULE_LABELS, initializeItems,
} from '@/types/checklist';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveDraft, loadDraft, clearDraft } from '@/lib/checklistDB';

function getBaseItems(type: ChecklistType) {
  if (type === 'inbound') return INBOUND_ITEMS;
  if (type === 'outbound') return OUTBOUND_ITEMS;
  return AUDIT_ITEMS;
}

interface DraftState {
  checklistType: ChecklistType;
  empresa: EmpresaInfo | null;
  context: ChecklistContext;
  items: ChecklistItem[];
  userName: string;
  auditConfirmed: boolean;
  vehiclePlate: string;
  role: UserRole;
  approvalFlow: ApprovalFlow;
  workflowStatus: WorkflowStatus;
  criticalAlerts: CriticalAlert[];
}

export function ChecklistPage() {
  const { profile: authProfile, signOut } = useAuth();
  const isInspectorActive = authProfile?.role === 'inspector' && authProfile?.status === 'active';
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [checklistType, setChecklistType] = useState<ChecklistType>('inbound');
  const [context, setContext] = useState<ChecklistContext>({ vehicle: false, fragile: false, hazmat: false });
  const [items, setItems] = useState<ChecklistItem[]>(() => initializeItems(INBOUND_ITEMS));
  const [finalStatus, setFinalStatus] = useState<FinalStatus>('pending');
  const [auditConfirmed, setAuditConfirmed] = useState(false);
  const [userName, setUserName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Approval flow state
  const role: UserRole = authProfile?.role === 'supervisor' ? 'supervisor' : 'inspector';
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlow>({
    inspectorName: '',
    inspectorConfirmed: false,
    supervisorName: '',
    supervisorStatus: 'pending',
    supervisorNotes: '',
  });
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('editing');
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [supervisorReturnNotes, setSupervisorReturnNotes] = useState('');

  // Draft banner
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const draftDataRef = useRef<DraftState | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const isOnline = useOnlineStatus();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Load draft on mount
  useEffect(() => {
    loadDraft().then(data => {
      if (data) {
        draftDataRef.current = data as DraftState;
        setShowDraftBanner(true);
        if ((data as DraftState).empresa) {
          setEmpresa((data as DraftState).empresa);
        }
      }
    }).catch(() => {});
  }, []);

  const restoreDraft = useCallback(() => {
    const d = draftDataRef.current;
    if (!d) return;
    setEmpresa(d.empresa ?? null);
    setChecklistType(d.checklistType);
    setContext(d.context);
    setItems(d.items);
    setUserName(d.userName);
    setAuditConfirmed(d.auditConfirmed);
    setVehiclePlate(d.vehiclePlate);
    // role is now derived from auth profile, no need to restore
    setApprovalFlow(d.approvalFlow);
    setWorkflowStatus(d.workflowStatus);
    setCriticalAlerts(d.criticalAlerts);
    setShowDraftBanner(false);
  }, []);

  const discardDraft = useCallback(() => {
    clearDraft().catch(() => {});
    setShowDraftBanner(false);
  }, []);

  // Auto-save draft with debounce
  useEffect(() => {
    if (showDraftBanner) return; // Don't overwrite while banner is shown
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const draft: DraftState = {
        checklistType, empresa, context, items, userName, auditConfirmed, vehiclePlate,
        role, approvalFlow, workflowStatus, criticalAlerts,
      };
      saveDraft(draft).catch(() => {});
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [checklistType, empresa, context, items, userName, auditConfirmed, vehiclePlate, role, approvalFlow, workflowStatus, criticalAlerts, showDraftBanner]);

  const switchType = useCallback((type: ChecklistType) => {
    setChecklistType(type);
    const base = getBaseItems(type);
    setItems(initializeItems(base));
    setContext({ vehicle: false, fragile: false, hazmat: false });
    setFinalStatus('pending');
    setAuditConfirmed(false);
    setVehiclePlate('');
    setWorkflowStatus('editing');
    setCriticalAlerts([]);
    setApprovalFlow({ inspectorName: '', inspectorConfirmed: false, supervisorName: '', supervisorStatus: 'pending', supervisorNotes: '' });
    setSignatureData(null);
  }, []);

  const toggleContext = useCallback((key: keyof ChecklistContext) => {
    setContext(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const base = getBaseItems(checklistType);
      const conditional = [
        ...(next.vehicle ? VEHICLE_ITEMS : []),
        ...(next.fragile ? FRAGILE_ITEMS : []),
        ...(next.hazmat ? HAZMAT_ITEMS : []),
      ];
      setItems(current => {
        const existingMap = new Map(current.map(i => [i.id, i]));
        return initializeItems([...base, ...conditional]).map(item =>
          existingMap.has(item.id) ? existingMap.get(item.id)! : item
        );
      });
      return next;
    });
    setFinalStatus('pending');
  }, [checklistType]);

  const handleStatusChange = useCallback((id: string, status: ItemStatus) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, status: i.status === status ? 'PENDING' : status } : i);
      // Check for critical item failure → toast + alert
      const item = updated.find(i => i.id === id);
      if (item && item.isCritical && item.status === 'NOT_OK') {
        toast.warning(`⚠️ Item crítico reprovado: ${item.label}. Notificação registrada para supervisão.`);
        // TODO: POST webhook para /api/alerts
        setCriticalAlerts(prev => {
          if (prev.some(a => a.id === id)) return prev;
          return [...prev, { id, label: item.label, timestamp: new Date().toISOString() }];
        });
      }
      return updated;
    });
    setFinalStatus('pending');
  }, []);

  const handleNotesChange = useCallback((id: string, notes: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  }, []);

  const handlePhotoChange = useCallback((id: string, photo: string | undefined) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, photo } : i));
  }, []);

  const getGeoLocation = (): Promise<GeoLocation | null> => {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          timestamp_iso: new Date().toISOString(),
        }),
        () => resolve(null),
        { timeout: 10000 }
      );
    });
  };

  const handleFinalize = useCallback(async () => {
    if (!empresa) {
      toast.error('Informe o CNPJ da empresa auditada antes de finalizar.');
      return;
    }

    const criticalFailed = items.some(i => i.isCritical && i.status === 'NOT_OK');
    const criticalPending = items.some(i => i.isCritical && i.status === 'PENDING');

    if (role === 'inspector' && workflowStatus === 'editing') {
      // Inspector submits for supervisor review
      if (criticalFailed) {
        setFinalStatus('rejected');
        return;
      }
      if (!criticalPending && auditConfirmed && userName.trim() && signatureData) {
        setApprovalFlow(prev => ({ ...prev, inspectorName: userName, inspectorConfirmed: true }));
        setWorkflowStatus('awaiting_supervisor');
        toast.success('Checklist enviado para supervisão.');
        return;
      }
      return;
    }

    if (role === 'supervisor' && workflowStatus === 'awaiting_supervisor') {
      // Supervisor approves
      const location = await getGeoLocation();
      setApprovalFlow(prev => ({ ...prev, supervisorName: userName, supervisorStatus: 'approved' }));
      setFinalStatus('approved');
      setWorkflowStatus('editing');

      // Export JSON
      const data = buildExportData(location, { ...approvalFlow, supervisorName: userName, supervisorStatus: 'approved' });
      downloadJSON(data);
      clearDraft().catch(() => {});
      return;
    }

    // Default finalize for inspector (no supervisor flow needed if acting alone)
    if (criticalFailed) {
      setFinalStatus('rejected');
    } else if (!criticalPending && auditConfirmed && userName.trim() && signatureData) {
      const location = await getGeoLocation();
      setFinalStatus('approved');
      const data = buildExportData(location);
      downloadJSON(data);
      clearDraft().catch(() => {});
    }
  }, [items, auditConfirmed, userName, signatureData, role, workflowStatus, approvalFlow, checklistType, context, vehiclePlate, criticalAlerts]);

  const handleSupervisorReturn = useCallback(() => {
    if (!supervisorReturnNotes.trim()) {
      toast.error('Informe o motivo da devolução.');
      return;
    }
    setApprovalFlow(prev => ({
      ...prev,
      supervisorStatus: 'returned',
      supervisorNotes: supervisorReturnNotes,
      returnedAt: new Date().toISOString(),
    }));
    setWorkflowStatus('in_review');
    setSupervisorReturnNotes('');
    toast.info('Checklist devolvido ao inspetor para correção.');
  }, [supervisorReturnNotes]);

  const handleInspectorResend = useCallback(() => {
    setWorkflowStatus('awaiting_supervisor');
    setApprovalFlow(prev => ({ ...prev, supervisorStatus: 'pending', supervisorNotes: '' }));
    toast.success('Checklist reenviado para supervisão.');
  }, []);

  const buildExportData = useCallback((location: GeoLocation | null, flowOverride?: ApprovalFlow) => {
    return {
      checklist_id: `${checklistType}_${Date.now()}`,
      type: checklistType === 'inbound' ? 'Recebimento' : checklistType === 'outbound' ? 'Envio' : 'Auditoria',
      empresa: empresa ? {
        cnpj: empresa.cnpj,
        cnpj_formatted: empresa.cnpj_formatted,
        nome: empresa.nome,
        nome_fantasia: empresa.nome_fantasia ?? null,
        municipio: empresa.municipio ?? null,
        uf: empresa.uf ?? null,
      } : null,
      context,
      vehicle: context.vehicle ? { plate: vehiclePlate || null } : undefined,
      items: items.map(i => ({
        id: i.id,
        label: i.label,
        status: i.status,
        is_critical: i.isCritical,
        notes: i.notes,
        module: i.module,
        photo_base64: i.photo || null,
      })),
      audit: {
        user: userName,
        timestamp: new Date().toISOString(),
        confirmed: auditConfirmed,
      },
      driver_signature: signatureData || null,
      location,
      approval_flow: flowOverride || approvalFlow,
      critical_alerts: criticalAlerts,
      final_status: 'approved',
    };
  }, [checklistType, context, vehiclePlate, items, userName, auditConfirmed, signatureData, approvalFlow, criticalAlerts]);

  const downloadJSON = (data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checklist_${checklistType}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = useCallback(async () => {
    const location = await getGeoLocation();
    const data = buildExportData(location);
    downloadJSON(data);
  }, [buildExportData]);

  // Group items by module
  const groupedItems = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    items.forEach(item => {
      if (!groups[item.module]) groups[item.module] = [];
      groups[item.module].push(item);
    });
    return groups;
  }, [items]);

  const isLocked = workflowStatus === 'awaiting_supervisor' && role === 'inspector';
  const isSupervisorView = role === 'supervisor' && workflowStatus === 'awaiting_supervisor';

  // Sidebar props based on workflow
  let finalizeLabel: string | undefined;
  let canFinalizeOverride: boolean | undefined;
  let workflowLabel: string | undefined;

  if (role === 'inspector' && workflowStatus === 'editing') {
    finalizeLabel = 'Enviar para Supervisão';
  } else if (role === 'inspector' && workflowStatus === 'in_review') {
    finalizeLabel = 'Reenviar para Supervisão';
    workflowLabel = '🔄 Devolvido pelo supervisor — corrija e reenvie';
  } else if (role === 'inspector' && workflowStatus === 'awaiting_supervisor') {
    workflowLabel = '⏳ Aguardando aprovação do supervisor';
  } else if (isSupervisorView) {
    workflowLabel = '📋 Revisão do supervisor';
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Draft banner */}
      {showDraftBanner && (
        <div className="bg-warning/15 border-b border-warning/30 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-foreground">📝 Rascunho encontrado</span>
          <div className="flex gap-2">
            <button onClick={restoreDraft} className="text-xs font-semibold text-primary hover:underline">Continuar</button>
            <button onClick={discardDraft} className="text-xs font-semibold text-destructive hover:underline">Descartar</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm sm:text-lg text-foreground leading-none truncate">Checklist Operacional</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">Sistema universal de controle e validação</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {isInspectorActive && (
              <Link to="/users" className="p-1.5 sm:p-2 rounded-lg border bg-muted/50 text-muted-foreground hover:text-foreground transition-fast" title="Gerenciar usuários">
                <Users className="w-4 h-4" />
              </Link>
            )}
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-success" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-destructive" />
              )}
            </div>
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-1.5 sm:p-2 rounded-lg border bg-muted/50 text-muted-foreground hover:text-foreground transition-fast"
              aria-label="Alternar modo escuro"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => signOut()}
              className="p-1.5 sm:p-2 rounded-lg border bg-muted/50 text-muted-foreground hover:text-destructive transition-fast"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={exportJSON}
              className="text-[10px] sm:text-xs font-medium text-primary hover:text-primary/80 transition-fast whitespace-nowrap"
            >
              Exportar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* CNPJ da empresa auditada */}
        <div className="mb-4 sm:mb-6">
          <CnpjInput
            onEmpresaValidada={setEmpresa}
            disabled={isLocked}
            initialValue={empresa?.cnpj ?? ''}
          />
        </div>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {([
            { type: 'inbound' as const, label: 'Recebimento', icon: ArrowDownToLine },
            { type: 'outbound' as const, label: 'Envio', icon: ArrowUpFromLine },
            { type: 'audit' as const, label: 'Auditoria', icon: ClipboardList },
          ]).map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => switchType(type)}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-display font-semibold text-xs sm:text-sm transition-fast',
                checklistType === type
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Context toggles */}
        <div className="mb-6">
          <h2 className="font-display font-bold text-sm text-foreground mb-3">Contexto da Operação</h2>
          <ContextToggle context={context} onToggle={toggleContext} vehiclePlate={vehiclePlate} onVehiclePlateChange={setVehiclePlate} />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supervisor return notes */}
            {workflowStatus === 'in_review' && role === 'inspector' && approvalFlow.supervisorNotes && (
              <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
                <p className="text-xs font-bold text-warning mb-1">Observação do supervisor:</p>
                <p className="text-sm text-foreground">{approvalFlow.supervisorNotes}</p>
              </div>
            )}

            {Object.entries(groupedItems).map(([module, moduleItems]) => (
              <motion.section
                key={module}
                initial={module !== 'base' ? { opacity: 0, y: 16, scale: 0.98 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  {MODULE_LABELS[module] || module}
                  {module !== 'base' && (
                    <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">Condicional</span>
                  )}
                </h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {moduleItems.map(item => (
                      <ChecklistItemCard
                        key={item.id}
                        item={item}
                        onStatusChange={handleStatusChange}
                        onNotesChange={handleNotesChange}
                        onPhotoChange={handlePhotoChange}
                        disabled={isLocked || isSupervisorView}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <ValidationSidebar
                items={items}
                onFinalize={
                  role === 'inspector' && workflowStatus === 'in_review'
                    ? handleInspectorResend
                    : handleFinalize
                }
                finalStatus={finalStatus}
                auditConfirmed={auditConfirmed}
                onConfirmToggle={() => setAuditConfirmed(p => !p)}
                userName={userName}
                onUserNameChange={setUserName}
                signatureData={signatureData}
                onSignatureChange={setSignatureData}
                disabled={isLocked}
                isSupervisor={isSupervisorView}
                workflowLabel={workflowLabel}
                finalizeLabel={finalizeLabel}
                canFinalize={
                  isSupervisorView ? true
                    : role === 'inspector' && workflowStatus === 'in_review' ? true
                    : undefined
                }
              />

              {/* Supervisor actions */}
              {isSupervisorView && (
                <div className="rounded-xl border bg-card shadow-[var(--shadow-elevated)] p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações do Supervisor</h4>
                  <textarea
                    placeholder="Motivo da devolução (obrigatório para devolver)"
                    value={supervisorReturnNotes}
                    onChange={e => setSupervisorReturnNotes(e.target.value)}
                    className="w-full rounded-md border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSupervisorReturn}
                    className="w-full rounded-lg py-2.5 text-sm font-bold font-display bg-warning/15 text-warning border border-warning/30 hover:bg-warning/25 transition-fast"
                  >
                    Devolver com Observação
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
