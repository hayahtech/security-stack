import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Car, Building2, Briefcase, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type TabKey = 'funcionarios' | 'visitantes' | 'veiculos' | 'fornecedores' | 'setores' | 'funcoes';

interface GenericRecord {
  id: string;
  nome: string;
  extra?: string;
  extra2?: string;
}

const tabs: { key: TabKey; label: string; icon: React.ElementType; fields: { key: string; label: string; placeholder: string }[] }[] = [
  {
    key: 'funcionarios', label: 'Funcionários', icon: Users,
    fields: [
      { key: 'nome', label: 'Nome', placeholder: 'Nome completo' },
      { key: 'extra', label: 'CPF', placeholder: '000.000.000-00' },
      { key: 'extra2', label: 'Setor/Função', placeholder: 'Ex: Manutenção / Técnico' },
    ],
  },
  {
    key: 'visitantes', label: 'Visitantes', icon: Users,
    fields: [
      { key: 'nome', label: 'Nome', placeholder: 'Nome completo' },
      { key: 'extra', label: 'CPF', placeholder: '000.000.000-00' },
      { key: 'extra2', label: 'Empresa', placeholder: 'Empresa de origem' },
    ],
  },
  {
    key: 'veiculos', label: 'Veículos', icon: Car,
    fields: [
      { key: 'nome', label: 'Placa', placeholder: 'ABC-1234' },
      { key: 'extra', label: 'Modelo', placeholder: 'Ex: Fiat Uno' },
      { key: 'extra2', label: 'Proprietário', placeholder: 'Nome do proprietário' },
    ],
  },
  {
    key: 'fornecedores', label: 'Fornecedores', icon: Building2,
    fields: [
      { key: 'nome', label: 'Razão Social', placeholder: 'Nome da empresa' },
      { key: 'extra', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
      { key: 'extra2', label: 'Contato', placeholder: 'Telefone ou e-mail' },
    ],
  },
  {
    key: 'setores', label: 'Setores', icon: MapPin,
    fields: [
      { key: 'nome', label: 'Nome do Setor', placeholder: 'Ex: Manutenção' },
      { key: 'extra', label: 'Responsável', placeholder: 'Nome do responsável' },
    ],
  },
  {
    key: 'funcoes', label: 'Funções', icon: Briefcase,
    fields: [
      { key: 'nome', label: 'Nome da Função', placeholder: 'Ex: Restaurante Caseirinho' },
      { key: 'extra', label: 'Descrição', placeholder: 'Descrição breve' },
    ],
  },
];

const initialData: Record<TabKey, GenericRecord[]> = {
  funcionarios: [
    { id: '1', nome: 'José Pereira', extra: '123.456.789-00', extra2: 'Manutenção / Técnico' },
    { id: '2', nome: 'Marcos Alves', extra: '987.654.321-00', extra2: 'Produção / Operador' },
  ],
  visitantes: [
    { id: '1', nome: 'Carlos Mendes', extra: '111.222.333-44', extra2: 'Tech Solutions' },
  ],
  veiculos: [
    { id: '1', nome: 'ABC-1D23', extra: 'Toyota Hilux', extra2: 'José Pereira' },
  ],
  fornecedores: [
    { id: '1', nome: 'Distribuidora XYZ', extra: '12.345.678/0001-90', extra2: '(11) 99999-0000' },
  ],
  setores: [
    { id: '1', nome: 'Manutenção', extra: 'José Pereira' },
    { id: '2', nome: 'Produção', extra: 'Ana Costa' },
    { id: '3', nome: 'Logística', extra: 'Marcos Alves' },
  ],
  funcoes: [
    { id: '1', nome: 'Restaurante Caseirinho', extra: 'Fornecedor de refeições' },
    { id: '2', nome: 'Restaurante Bom Sabor', extra: 'Fornecedor de refeições' },
  ],
};

const CadastrosPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('funcionarios');
  const [data, setData] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const currentTab = tabs.find(t => t.key === activeTab)!;
  const records = data[activeTab];

  const openNew = () => {
    setEditingId(null);
    setForm({});
    setModalOpen(true);
  };

  const openEdit = (rec: GenericRecord) => {
    setEditingId(rec.id);
    setForm({ nome: rec.nome, extra: rec.extra || '', extra2: rec.extra2 || '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome) { toast.error('Nome é obrigatório'); return; }
    if (editingId) {
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(r => r.id === editingId ? { ...r, nome: form.nome, extra: form.extra, extra2: form.extra2 } : r),
      }));
      toast.success('Registro atualizado');
    } else {
      setData(prev => ({
        ...prev,
        [activeTab]: [{ id: Date.now().toString(), nome: form.nome, extra: form.extra, extra2: form.extra2 }, ...prev[activeTab]],
      }));
      toast.success('Registro criado');
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(r => r.id !== id) }));
    toast.success('Registro removido');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cadastros</h2>
          <p className="text-xs text-muted-foreground">Base unificada de cadastros do sistema</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">
          <Plus className="h-3.5 w-3.5" />
          Novo {currentTab.label.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
              activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              {currentTab.fields.map(f => (
                <th key={f.key} className="px-4 py-2.5 font-medium text-muted-foreground">{f.label}</th>
              ))}
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <motion.tr
                key={rec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-secondary/50"
              >
                <td className="px-4 py-2.5 text-foreground">{rec.nome}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{rec.extra || '—'}</td>
                {currentTab.fields.length > 2 && (
                  <td className="px-4 py-2.5 text-muted-foreground">{rec.extra2 || '—'}</td>
                )}
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(rec)} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(rec.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={currentTab.fields.length + 1} className="px-4 py-8 text-center text-muted-foreground">Nenhum registro encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} {currentTab.label.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {currentTab.fields.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={form[f.key] || ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="h-9 text-xs"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">Cancelar</button>
            <button onClick={handleSave} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CadastrosPage;
