import { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Meal {
  id: string;
  date: string;
  type: string;
  person: string;
  costCenter: string;
  value: string;
  setor: string;
  funcao: string;
  restaurante: string;
  descontar: boolean;
}

const initialMeals: Meal[] = [
  { id: '1', date: '17/03/2026', type: 'Almoço', person: 'José Pereira', costCenter: 'Manutenção', value: 'R$ 25,00', setor: 'Manutenção', funcao: 'Técnico', restaurante: 'Caseirinho', descontar: false },
  { id: '2', date: '17/03/2026', type: 'Almoço', person: 'Marcos Alves', costCenter: 'Produção', value: 'R$ 25,00', setor: 'Produção', funcao: 'Operador', restaurante: 'Caseirinho', descontar: true },
  { id: '3', date: '16/03/2026', type: 'Jantar', person: 'Ana Costa', costCenter: 'Logística', value: 'R$ 20,00', setor: 'Logística', funcao: 'Analista', restaurante: 'Bom Sabor', descontar: false },
];

const RefeitoryPage = () => {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    person: '', type: 'Almoço', costCenter: '', value: '',
    setor: '', funcao: '', restaurante: '', descontar: false,
  });

  const handleSave = () => {
    if (!form.person || !form.costCenter) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    setMeals(prev => [
      { id: Date.now().toString(), date: dateStr, ...form },
      ...prev,
    ]);
    toast.success('Refeição registrada');
    setOpen(false);
    setForm({ person: '', type: 'Almoço', costCenter: '', value: '', setor: '', funcao: '', restaurante: '', descontar: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Refeitório e Centro de Custo</h2>
          <p className="text-xs text-muted-foreground">Controle de refeições por centro de custo</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar Refeição
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { center: 'Manutenção', total: 'R$ 1.250,00', meals: 50 },
          { center: 'Produção', total: 'R$ 3.450,00', meals: 138 },
          { center: 'Logística', total: 'R$ 980,00', meals: 49 },
        ].map(c => (
          <div key={c.center} className="rounded-lg border border-border bg-card p-3">
            <span className="text-[10px] text-muted-foreground">{c.center}</span>
            <p className="text-lg font-bold font-mono text-foreground">{c.total}</p>
            <span className="text-[10px] text-muted-foreground">{c.meals} refeições</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Pessoa</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Centro de Custo</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Setor/Função</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Restaurante</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Descontar?</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Valor</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((m, i) => (
              <motion.tr
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 transition hover:bg-secondary/50"
              >
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{m.date}</td>
                <td className="px-4 py-2.5 text-foreground">{m.type}</td>
                <td className="px-4 py-2.5 text-foreground">{m.person}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.costCenter}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.setor}{m.funcao ? ` / ${m.funcao}` : ''}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.restaurante}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.descontar ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-2.5 font-mono text-foreground">{m.value}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Refeição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Refeição</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Funcionário *</Label>
                <Input value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} placeholder="Nome" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Refeição</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Café da Manhã">Café da Manhã</SelectItem>
                    <SelectItem value="Almoço">Almoço</SelectItem>
                    <SelectItem value="Jantar">Jantar</SelectItem>
                    <SelectItem value="Ceia">Ceia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Centro de Custo *</Label>
                <Input value={form.costCenter} onChange={e => setForm({ ...form, costCenter: e.target.value })} placeholder="Ex: Produção" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor</Label>
                <Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="R$ 0,00" className="h-9 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Setor</Label>
                <Input value={form.setor} onChange={e => setForm({ ...form, setor: e.target.value })} placeholder="Ex: Manutenção" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Função</Label>
                <Input value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} placeholder="Ex: Técnico" className="h-9 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Restaurante</Label>
              <Input value={form.restaurante} onChange={e => setForm({ ...form, restaurante: e.target.value })} placeholder="Ex: Caseirinho" className="h-9 text-xs" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="descontar"
                checked={form.descontar}
                onCheckedChange={(v) => setForm({ ...form, descontar: v === true })}
              />
              <Label htmlFor="descontar" className="text-xs cursor-pointer">Descontar do funcionário?</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">Cancelar</button>
            <button onClick={handleSave} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RefeitoryPage;
