import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CHANNEL_OPTIONS, OBJECTIVE_OPTIONS, CampaignInsert } from '@/hooks/useMarketingCampaigns';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CampaignInsert) => void;
}

export function CampaignForm({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('novos_clientes');
  const [channel, setChannel] = useState('instagram');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [expectedReach, setExpectedReach] = useState('');
  const [expectedConversions, setExpectedConversions] = useState('');
  const [costCenter, setCostCenter] = useState('geral');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name || !budget) {
      toast({ title: 'Preencha nome e orçamento', variant: 'destructive' });
      return;
    }
    onSave({
      name,
      objective,
      channel,
      budget: parseFloat(budget),
      start_date: startDate,
      end_date: endDate || undefined,
      target_audience: targetAudience || undefined,
      expected_reach: expectedReach ? parseInt(expectedReach) : undefined,
      expected_conversions: expectedConversions ? parseInt(expectedConversions) : undefined,
      cost_center: costCenter,
      notes: notes || undefined,
    });
    // Reset
    setName(''); setBudget(''); setTargetAudience(''); setExpectedReach('');
    setExpectedConversions(''); setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome da campanha *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Black Friday 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Objetivo</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Canal Principal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Orçamento Total (R$) *</Label>
            <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label>Público-alvo</Label>
            <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Ex: Homens 25-40 Florianópolis" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Alcance Esperado</Label>
              <Input type="number" value={expectedReach} onChange={e => setExpectedReach(e.target.value)} placeholder="Pessoas" />
            </div>
            <div>
              <Label>Conversões Esperadas</Label>
              <Input type="number" value={expectedConversions} onChange={e => setExpectedConversions(e.target.value)} placeholder="Clientes" />
            </div>
          </div>
          <div>
            <Label>Centro de Custo</Label>
            <Select value={costCenter} onValueChange={setCostCenter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="salao">Salão</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="ifood">iFood</SelectItem>
                <SelectItem value="rappi">Rappi</SelectItem>
                <SelectItem value="eventos">Eventos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes, links, referências..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Criar Campanha</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
