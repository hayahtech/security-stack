import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Shield } from 'lucide-react';

const roleLabels: Record<string, string> = {
  dono: 'Dono',
  gerente: 'Gerente',
  caixa: 'Caixa',
  cozinha: 'Cozinha',
  contador: 'Contador',
  entregador: 'Entregador',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ativo: { label: 'Ativo', variant: 'default' },
  pendente: { label: 'Pendente', variant: 'secondary' },
  inativo: { label: 'Inativo', variant: 'destructive' },
};

export default function TeamPage() {
  const { user } = useAuth();
  const { currentRestaurant, currentRole } = useRestaurant();
  const qc = useQueryClient();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('caixa');

  const { data: members, isLoading } = useQuery({
    queryKey: ['restaurant_members', currentRestaurant?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('restaurant_members')
        .select('*, profiles:user_id(full_name, email)')
        .eq('restaurant_id', currentRestaurant!.id)
        .order('invited_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentRestaurant && (currentRole === 'dono' || currentRole === 'gerente'),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('restaurant_members').insert({
        restaurant_id: currentRestaurant!.id,
        invited_email: inviteEmail,
        role: inviteRole,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant_members'] });
      toast({ title: 'Convite enviado!' });
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('caixa');
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await (supabase as any).from('restaurant_members').update({ role }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant_members'] });
      toast({ title: 'Perfil atualizado!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('restaurant_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant_members'] });
      toast({ title: 'Membro removido!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhum restaurante selecionado. Crie um restaurante primeiro.</p>
      </div>
    );
  }

  if (currentRole !== 'dono' && currentRole !== 'gerente') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Você não tem permissão para gerenciar a equipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">Gerencie membros e permissões de {currentRestaurant.name}</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="h-4 w-4 mr-1" />Convidar Membro
        </Button>
      </div>

      {/* Owner card */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" />Proprietário</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">O dono tem acesso total ao sistema. Para transferir a propriedade, entre em contato com o suporte.</p>
        </CardContent>
      </Card>

      {/* Members table */}
      <Card>
        <CardHeader><CardTitle>Membros</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> : !members?.length ? (
            <p className="text-muted-foreground text-center py-8">Nenhum membro convidado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m: any) => {
                  const name = m.profiles?.full_name || m.invited_email || '—';
                  const email = m.profiles?.email || m.invited_email || '';
                  const st = statusLabels[m.status] || statusLabels.pendente;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{name}</p>
                          {email && <p className="text-xs text-muted-foreground">{email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {currentRole === 'dono' ? (
                          <Select defaultValue={m.role} onValueChange={role => updateRoleMutation.mutate({ id: m.id, role })}>
                            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).filter(([k]) => k !== 'dono').map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{roleLabels[m.role] || m.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeMutation.mutate(m.id)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar Membro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).filter(([k]) => k !== 'dono').map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {inviteRole === 'gerente' && 'Acesso total exceto gastos pessoais e configurações de conta'}
                {inviteRole === 'caixa' && 'Vendas, caixa, clientes e fidelidade'}
                {inviteRole === 'cozinha' && 'Somente delivery e mesas (ver/atualizar pedidos)'}
                {inviteRole === 'contador' && 'Relatórios financeiros em modo somente leitura'}
                {inviteRole === 'entregador' && 'Somente seus pedidos de delivery ativos'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
