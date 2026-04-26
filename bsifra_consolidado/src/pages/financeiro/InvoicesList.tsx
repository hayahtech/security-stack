import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getDbErrorMessage } from "@/lib/utils";
import { format } from "date-fns";
import { MotionDiv, staggerContainer, fadeUp, scaleIn } from "@/lib/motion";

const db = supabase as any;

const statusColors: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviada: "bg-primary/20 text-primary border-primary/30",
  paga: "bg-green-500/20 text-green-400 border-green-500/30",
  vencida: "bg-destructive/20 text-destructive border-destructive/30",
  cancelada: "bg-muted/50 text-muted-foreground/70",
};

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho", enviada: "Enviada", paga: "Paga", vencida: "Vencida", cancelada: "Cancelada",
};

const InvoicesList = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const [invRes, cliRes] = await Promise.all([
      db.from("invoices").select("*, clients(name, company), projects(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").eq("user_id", user.id).order("name"),
    ]);
    setInvoices((invRes.data as any[]) ?? []);
    setClients(cliRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]); // eslint-disable-line

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta fatura?")) return;
    const { error } = await db.from("invoices").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", description: getDbErrorMessage(error), variant: "destructive" }); } else { toast({ title: "Fatura excluída" }); fetchData(); }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.number?.toLowerCase().includes(search.toLowerCase()) || inv.clients?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchClient = clientFilter === "all" || inv.client_id === clientFilter;
    return matchSearch && matchStatus && matchClient;
  });

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <MotionDiv className="space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
      <MotionDiv variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Faturas</h1>
          <p className="text-sm font-light text-muted-foreground">Gerencie suas faturas e cobranças</p>
        </div>
        <Link to="/financeiro/faturas/nova"><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Fatura</Button></Link>
      </MotionDiv>

      <MotionDiv variants={scaleIn}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por número ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12"><FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">Nenhuma fatura encontrada</p></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Nº</TableHead>
                      <TableHead className="font-medium">Cliente</TableHead>
                      <TableHead className="font-medium">Projeto</TableHead>
                      <TableHead className="font-medium">Emissão</TableHead>
                      <TableHead className="font-medium">Vencimento</TableHead>
                      <TableHead className="font-medium text-right">Total</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="font-medium text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{inv.number}</TableCell>
                        <TableCell>{inv.clients?.name || "—"}</TableCell>
                        <TableCell>{inv.projects?.name || "—"}</TableCell>
                        <TableCell>{inv.issue_date ? format(new Date(inv.issue_date), "dd/MM/yyyy") : "—"}</TableCell>
                        <TableCell>{inv.due_date ? format(new Date(inv.due_date), "dd/MM/yyyy") : "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(inv.total || 0)}</TableCell>
                        <TableCell><Badge className={`${statusColors[inv.status] || statusColors.rascunho} font-medium border`}>{statusLabels[inv.status] || inv.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/financeiro/faturas/${inv.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Eye className="h-4 w-4" /></Button></Link>
                            <Link to={`/financeiro/faturas/${inv.id}/editar`}><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Pencil className="h-4 w-4" /></Button></Link>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(inv.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </MotionDiv>
    </MotionDiv>
  );
};

export default InvoicesList;
