import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, Pencil } from "lucide-react";
import { format } from "date-fns";

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

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [invRes, itemsRes, profileRes] = await Promise.all([
        db.from("invoices").select("*, clients(name, email, company, phone), projects(name)").eq("id", id).single(),
        db.from("invoice_items").select("*").eq("invoice_id", id).order("date"),
        supabase.from("profiles").select("display_name, email").eq("user_id", user.id).single(),
      ]);
      setInvoice(invRes.data);
      setItems(itemsRes.data ?? []);
      setProfile(profileRes.data);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!invoice) return <div className="text-center py-20"><p>Fatura não encontrada</p></div>;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/financeiro/faturas")}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-extrabold tracking-tight">Fatura {invoice.number}</h1>
            <Badge className={`${statusColors[invoice.status]} font-medium border`}>{statusLabels[invoice.status]}</Badge>
          </div>
          <div className="flex gap-2">
            <Link to={`/financeiro/faturas/${id}/editar`}>
              <Button variant="outline" size="sm" className="gap-2"><Pencil className="h-4 w-4" /> Editar</Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir / PDF</Button>
          </div>
        </div>

        <div className="print-area space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-extrabold">{profile?.display_name || "Freelancer"}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-primary">{invoice.number}</h3>
              <Badge className={`${statusColors[invoice.status]} font-medium border mt-1`}>{statusLabels[invoice.status]}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Cliente</p>
                <p className="font-medium text-lg">{invoice.clients?.name || "—"}</p>
                {invoice.clients?.company && <p className="text-sm text-muted-foreground">{invoice.clients.company}</p>}
                {invoice.clients?.email && <p className="text-sm text-muted-foreground">{invoice.clients.email}</p>}
                {invoice.clients?.phone && <p className="text-sm text-muted-foreground">{invoice.clients.phone}</p>}
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Data de Emissão</p>
                  <p className="font-medium">{format(new Date(invoice.issue_date), "dd/MM/yyyy")}</p>
                </div>
                {invoice.due_date && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vencimento</p>
                    <p className="font-medium">{format(new Date(invoice.due_date), "dd/MM/yyyy")}</p>
                  </div>
                )}
                {invoice.projects?.name && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Projeto</p>
                    <p className="font-medium">{invoice.projects.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Descrição</TableHead>
                    <TableHead className="font-medium">Data</TableHead>
                    <TableHead className="font-medium text-right">Horas</TableHead>
                    <TableHead className="font-medium text-right">Valor/h</TableHead>
                    <TableHead className="font-medium text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.date ? format(new Date(item.date), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="text-right">{Number(item.hours).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de Horas</span>
                    <span className="font-medium">{Number(invoice.total_hours).toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desconto</span>
                      <span className="font-medium text-destructive">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl border-t border-border pt-3 mt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-extrabold text-primary">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Observações</p>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {invoice.paid_at && (
            <p className="text-center text-sm text-green-400 font-medium">
              Pago em {format(new Date(invoice.paid_at), "dd/MM/yyyy 'às' HH:mm")}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default InvoiceView;
