import { useState } from 'react';
import { useEmployees, useCreateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Users } from 'lucide-react';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [phone, setPhone] = useState('');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const activeEmployees = (employees || []).filter(e => e.status === 'ativo');
  const totalPayroll = activeEmployees.reduce((s, e) => s + Number(e.salary), 0);

  const handleCreate = () => {
    createEmployee.mutate({ name, role, salary: parseFloat(salary), hire_date: hireDate, phone });
    setFormOpen(false);
    setName(''); setRole(''); setSalary(''); setPhone('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Funcionários</h1>
          <p className="text-sm text-muted-foreground">Gestão da equipe</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Funcionário</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{activeEmployees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Folha de Pagamento Mensal</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(totalPayroll)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">Salário</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(employees || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum funcionário cadastrado</TableCell>
              </TableRow>
            ) : (
              (employees || []).map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.role || '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(e.salary))}</TableCell>
                  <TableCell>{new Date(e.hire_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === 'ativo' ? 'default' : 'secondary'}>
                      {e.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                      if (confirm('Excluir este funcionário?')) deleteEmployee.mutate(e.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Funcionário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><Label>Cargo</Label><Input value={role} onChange={e => setRole(e.target.value)} /></div>
            <div><Label>Salário (R$)</Label><Input type="number" step="0.01" value={salary} onChange={e => setSalary(e.target.value)} required /></div>
            <div><Label>Data de Admissão</Label><Input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
