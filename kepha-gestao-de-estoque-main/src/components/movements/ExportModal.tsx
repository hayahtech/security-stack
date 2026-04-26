import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reportOptions = [
  { id: 'movements', label: 'Movimentações Completas' },
  { id: 'entries', label: 'Apenas Entradas' },
  { id: 'exits', label: 'Apenas Saídas' },
  { id: 'transfers', label: 'Transferências' },
  { id: 'adjustments', label: 'Ajustes e Devoluções' },
  { id: 'losses', label: 'Avarias e Baixas' },
];

export function ExportModal({ open, onOpenChange }: Props) {
  const [format, setFormat] = useState('csv');
  const [selected, setSelected] = useState<Set<string>>(new Set(['movements']));

  const toggleReport = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    if (selected.size === 0) {
      toast.error('Selecione ao menos um relatório');
      return;
    }
    const labels = reportOptions.filter(r => selected.has(r.id)).map(r => r.label).join(', ');
    toast.success(`Exportando ${labels} em ${format.toUpperCase()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Relatório
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Formato do Arquivo</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Selecione os relatórios</Label>
            <div className="space-y-2 pt-1">
              {reportOptions.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <Checkbox
                    id={r.id}
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggleReport(r.id)}
                  />
                  <label htmlFor={r.id} className="text-sm cursor-pointer">{r.label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
