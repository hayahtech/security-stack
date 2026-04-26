import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Search } from 'lucide-react';
import { MarketingCampaign, CHANNEL_OPTIONS, OBJECTIVE_OPTIONS, STATUS_OPTIONS } from '@/hooks/useMarketingCampaigns';
import { useNavigate } from 'react-router-dom';

interface Props {
  campaigns: MarketingCampaign[];
  onNewCampaign: () => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CampaignsList({ campaigns, onNewCampaign }: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'budget' | 'roi'>('recent');
  const navigate = useNavigate();

  let filtered = campaigns;
  if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter);
  if (channelFilter !== 'all') filtered = filtered.filter(c => c.channel === channelFilter);
  if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (sortBy === 'budget') {
    filtered = [...filtered].sort((a, b) => Number(b.budget) - Number(a.budget));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar campanha..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CHANNEL_OPTIONS.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="budget">Maior Orçamento</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onNewCampaign}>
          <Plus className="h-4 w-4 mr-1" /> Nova Campanha
        </Button>
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhuma campanha encontrada. Crie sua primeira campanha!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(campaign => {
            const channel = CHANNEL_OPTIONS.find(c => c.value === campaign.channel);
            const objective = OBJECTIVE_OPTIONS.find(o => o.value === campaign.objective);
            const statusOpt = STATUS_OPTIONS.find(s => s.value === campaign.status);
            const budgetProgress = Number(campaign.budget) > 0
              ? Math.min((Number(campaign.spent) / Number(campaign.budget)) * 100, 100)
              : 0;
            const overBudget = Number(campaign.spent) > Number(campaign.budget);

            return (
              <Card
                key={campaign.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/marketing/${campaign.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{campaign.name}</h3>
                      <p className="text-xs text-muted-foreground">{objective?.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{channel?.icon}</span>
                      <Badge variant={statusOpt?.color as any || 'secondary'} className="text-xs">
                        {statusOpt?.label || campaign.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(campaign.start_date).toLocaleDateString('pt-BR')}
                    {campaign.end_date && ` — ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}`}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Orçamento: {formatCurrency(Number(campaign.budget))}</span>
                      <span className={overBudget ? 'text-destructive font-semibold' : ''}>
                        Gasto: {formatCurrency(Number(campaign.spent))}
                      </span>
                    </div>
                    <Progress value={budgetProgress} className={`h-2 ${overBudget ? '[&>div]:bg-destructive' : ''}`} />
                  </div>

                  {(campaign.expected_conversions || campaign.actual_conversions) && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Conversões: {campaign.actual_conversions ?? '—'} / {campaign.expected_conversions ?? '—'}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
