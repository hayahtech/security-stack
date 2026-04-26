import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, Pencil, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import NewDeliveryModal from '@/components/NewDeliveryModal';

interface Delivery {
  id: string;
  sender: string;
  carrier: string;
  recipient: string;
  date: string;
  status: string;
  receivedBy: string;
  deliveredTo?: string;
  deliveredAt?: string;
  notes?: string;
  history: { action: string; by: string; at: string }[];
}

const initialDeliveries: Delivery[] = [
  {
    id: '1', sender: 'Amazon', carrier: 'Correios', recipient: 'João Silva - TI',
    date: '17/03/2026 09:00', status: 'aguardando', receivedBy: 'Porteiro Carlos',
    history: [{ action: 'Recebida na portaria', by: 'Porteiro Carlos', at: '17/03/2026 09:00' }],
  },
  {
    id: '2', sender: 'Magazine Luiza', carrier: 'Jadlog', recipient: 'Maria RH',
    date: '17/03/2026 08:15', status: 'aguardando', receivedBy: 'Porteiro Carlos',
    history: [{ action: 'Recebida na portaria', by: 'Porteiro Carlos', at: '17/03/2026 08:15' }],
  },
  {
    id: '3', sender: 'Fornecedor ABC', carrier: 'Transportadora XYZ', recipient: 'Carlos Compras',
    date: '16/03/2026 14:30', status: 'entregue', receivedBy: 'Porteiro Ana',
    deliveredTo: 'Carlos Compras', deliveredAt: '16/03/2026 16:45',
    history: [
      { action: 'Recebida na portaria', by: 'Porteiro Ana', at: '16/03/2026 14:30' },
      { action: 'Entregue ao destinatário', by: 'Carlos Compras', at: '16/03/2026 16:45' },
    ],
  },
];

const statusConfig: Record<string, { label: string; style: string }> = {
  recebida: { label: 'Recebida', style: 'bg-primary/10 text-primary' },
  aguardando: { label: 'Aguardando', style: 'bg-warning/10 text-warning' },
  entregue: { label: 'Entregue', style: 'bg-success/10 text-success' },
};

const DeliveriesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [editModal, setEditModal] = useState<Delivery | null>(null);
  const [historyModal, setHistoryModal] = useState<Delivery | null>(null);
  const [editForm, setEditForm] = useState({ status: '', deliveredTo: '', notes: '' });

  const openEdit = (d: Delivery) => {
    setEditForm({ status: d.status, deliveredTo: d.deliveredTo || '', notes: d.notes || '' });
    setEditModal(d);
  };

  const saveEdit = () => {
    if (!editModal) return;
    if (editForm.status === 'entregue' && !editForm.deliveredTo) {
      toast.error('Informe o nome de quem retirou a entrega');
      return;
    }
    const now = new Date().toLocaleString('pt-BR');
    setDeliveries(prev => prev.map(d => {
      if (d.id !== editModal.id) return d;
      const newHistory = [...d.history];
      if (editForm.status !== d.status) {
        const label = statusConfig[editForm.status]?.label || editForm.status;
        newHistory.push({ action: `Status alterado para ${label}`, by: 'Operador', at: now });
      }
      if (editForm.status === 'entregue' && d.status !== 'entregue') {
        newHistory.push({ action: `Entregue para ${editForm.deliveredTo}`, by: editForm.deliveredTo, at: now });
      }
      return {
        ...d,
        status: editForm.status,
        deliveredTo: editForm.deliveredTo || d.deliveredTo,
        deliveredAt: editForm.status === 'entregue' ? now : d.deliveredAt,
        notes: editForm.notes,
        history: newHistory,
      };
    }));
    toast.success('Entrega atualizada');
    setEditModal(null);
  };

  const markDelivered = (d: Delivery) => {
    const now = new Date().toLocaleString('pt-BR');
    setDeliveries(prev => prev.map(item => {
      if (item.id !== d.id) return item;
      return {
        ...item,
        status: 'entregue',
        deliveredTo: d.recipient,
        deliveredAt: now,
        history: [...item.history, { action: `Entregue para ${d.recipient}`, by: d.recipient, at: now }],
      };
    }));
    toast.success(`Entrega retirada por ${d.recipient}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Entregas e Correspondências</h2>
          <p className="text-xs text-muted-foreground">{deliveries.filter(d => d.status === 'aguardando').length} aguardando retirada</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110">
          <Plus className="h-3.5 w-3.5" />
          Nova Entrega
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Remetente</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Transportadora</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Destinatário</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Recebido por</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Recebimento</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Entregue para</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d, i) => (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 transition-ros hover:bg-secondary/50 cursor-pointer"
                onClick={() => setHistoryModal(d)}
              >
                <td className="px-4 py-2.5 text-foreground">{d.sender}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.carrier}</td>
                <td className="px-4 py-2.5 text-foreground">{d.recipient}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.receivedBy}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{d.date}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.deliveredTo ? `${d.deliveredTo} — ${d.deliveredAt}` : '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusConfig[d.status]?.style || 'bg-muted text-muted-foreground'}`}>
                    {statusConfig[d.status]?.label || d.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(d)} className="rounded p-1 text-primary transition-ros hover:bg-primary/10" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {d.status === 'aguardando' && (
                      <button onClick={() => markDelivered(d)} className="rounded p-1 text-success transition-ros hover:bg-success/10" title="Registrar retirada">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewDeliveryModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Entrega — {editModal?.sender}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                <SelectTrigger className="mt-1 bg-secondary border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="recebida">Recebida</SelectItem>
                  <SelectItem value="aguardando">Aguardando retirada</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.status === 'entregue' && (
              <div>
                <Label className="text-xs text-muted-foreground">Retirado por *</Label>
                <Input value={editForm.deliveredTo} onChange={e => setEditForm(p => ({ ...p, deliveredTo: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" />
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Input value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 bg-secondary border-border text-foreground" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditModal(null)} className="rounded-md px-4 py-2 text-xs font-medium text-muted-foreground bg-secondary hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={saveEdit} className="rounded-md px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all">Salvar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={!!historyModal} onOpenChange={() => setHistoryModal(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Histórico — {historyModal?.sender}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {historyModal?.history.map((h, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-secondary p-2.5">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-foreground">{h.action}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{h.at} — {h.by}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveriesPage;
