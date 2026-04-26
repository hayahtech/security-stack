import { useState } from 'react';
import { Projeto, Etapa, ProjectStatus } from '@/cronometro/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';

interface Props {
  initial?: Projeto;
  onSave: (p: Projeto) => void;
  onCancel: () => void;
}

function emptyEtapa(ordem: number): Etapa {
  return { id: crypto.randomUUID(), nome: '', descricao: '', horas_previstas: 0, horas_realizadas: 0, ordem };
}

export function ProjectForm({ initial, onSave, onCancel }: Props) {
  const [nome, setNome] = useState(initial?.nome ?? '');
  const [contratante, setContratante] = useState(initial?.contratante ?? '');
  const [dataInicio, setDataInicio] = useState(initial?.data_inicio ?? new Date().toISOString().slice(0, 10));
  const [previsao, setPrevisao] = useState(initial?.previsao_conclusao ?? '');
  const [descricao, setDescricao] = useState(initial?.descricao ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'ativo');
  const [etapas, setEtapas] = useState<Etapa[]>(initial?.etapas ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projeto: Projeto = {
      id: initial?.id ?? crypto.randomUUID(),
      nome,
      contratante,
      data_inicio: dataInicio,
      previsao_conclusao: previsao,
      descricao,
      status,
      criado_em: initial?.criado_em ?? new Date().toISOString(),
      etapas,
    };
    onSave(projeto);
  };

  const addEtapa = () => setEtapas([...etapas, emptyEtapa(etapas.length)]);

  const updateEtapa = (idx: number, field: keyof Etapa, value: string | number) => {
    const copy = [...etapas];
    (copy[idx] as any)[field] = value;
    setEtapas(copy);
  };

  const removeEtapa = (idx: number) => setEtapas(etapas.filter((_, i) => i !== idx));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Projeto *</Label>
          <Input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Contratante/Cliente</Label>
          <Input value={contratante} onChange={e => setContratante(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Previsão de Conclusão</Label>
          <Input type="date" value={previsao} onChange={e => setPrevisao(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Descrição</Label>
          <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as ProjectStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Etapas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Etapas</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addEtapa}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {etapas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma etapa adicionada</p>
          )}
          {etapas.map((etapa, idx) => (
            <div key={etapa.id} className="grid grid-cols-12 gap-2 items-end border border-border rounded-md p-3">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={etapa.nome} onChange={e => updateEtapa(idx, 'nome', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input value={etapa.descricao} onChange={e => updateEtapa(idx, 'descricao', e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">H. Previstas</Label>
                <Input type="number" min={0} value={etapa.horas_previstas} onChange={e => updateEtapa(idx, 'horas_previstas', +e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">H. Realizadas</Label>
                <Input type="number" min={0} value={etapa.horas_realizadas} onChange={e => updateEtapa(idx, 'horas_realizadas', +e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeEtapa(idx)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit">{initial ? 'Salvar Alterações' : 'Criar Projeto'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
