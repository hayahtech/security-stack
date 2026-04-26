import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, DollarSign, Calendar, FileText,
  CheckCircle, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  mockParceiros, tipoLabel, tipoColor, mockParceiroTxns,
} from "@/data/parceiros-mock";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function ParceiroDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const parceiro = mockParceiros.find((p) => p.id === id);

  const txns = parceiro ? (mockParceiroTxns[parceiro.id] || []) : [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalMonth = useMemo(() =>
    txns
      .filter((t) => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
      .reduce((sum, t) => sum + (t.direction === "saida" ? t.amount : 0), 0),
    [txns, currentMonth, currentYear]);

  const totalYear = useMemo(() =>
    txns
      .filter((t) => new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + (t.direction === "saida" ? t.amount : 0), 0),
    [txns, currentYear]);

  const totalReceivedYear = useMemo(() =>
    txns
      .filter((t) => new Date(t.date).getFullYear() === currentYear && t.direction === "entrada")
      .reduce((sum, t) => sum + t.amount, 0),
    [txns, currentYear]);

  const lastTxn = txns.length > 0 ? txns[0] : null;

  if (!parceiro) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Parceiro não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/contato/parceiros")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/contato/parceiros")} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
          {parceiro.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{parceiro.name}</h1>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge className={`border text-xs ${tipoColor[parceiro.tipo]}`}>{tipoLabel[parceiro.tipo]}</Badge>
            {parceiro.especialidade && <Badge variant="outline" className="text-xs">{parceiro.especialidade}</Badge>}
            {parceiro.active ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 text-xs gap-1">
                <CheckCircle className="h-3 w-3" /> Ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1"><XCircle className="h-3 w-3" /> Inativo</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {parceiro.doc && (
          <Card><CardContent className="p-3 flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground shrink-0" /><span className="font-mono">{parceiro.doc}</span></CardContent></Card>
        )}
        {parceiro.phones[0] && (
          <Card><CardContent className="p-3 flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground shrink-0" />{parceiro.phones.join(", ")}</CardContent></Card>
        )}
        {parceiro.email && (
          <Card><CardContent className="p-3 flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground shrink-0" />{parceiro.email}</CardContent></Card>
        )}
        {(parceiro.city || parceiro.state || parceiro.address) && (
          <Card><CardContent className="p-3 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground shrink-0" />{[parceiro.address, parceiro.city, parceiro.state].filter(Boolean).join(", ")}</CardContent></Card>
        )}
        {parceiro.crmv && (
          <Card><CardContent className="p-3 text-sm"><span className="text-muted-foreground mr-2">CRMV:</span><span className="font-mono font-medium">{parceiro.crmv}</span></CardContent></Card>
        )}
        {parceiro.anac_sisant && (
          <Card><CardContent className="p-3 text-sm"><span className="text-muted-foreground mr-2">ANAC/SISANT:</span><span className="font-mono font-medium">{parceiro.anac_sisant}</span></CardContent></Card>
        )}
      </div>

      {parceiro.notes && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground mr-2">Observações:</span>{parceiro.notes}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Gasto no Mês</p>
            <p className="text-2xl font-bold text-foreground">{fmt(totalMonth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Gasto no Ano</p>
            <p className="text-2xl font-bold text-foreground">{fmt(totalYear)}</p>
            {totalReceivedYear > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                + {fmt(totalReceivedYear)} recebido
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Última Transação</p>
            {lastTxn ? (
              <>
                <p className="text-sm font-medium text-foreground">{lastTxn.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(lastTxn.date + "T12:00").toLocaleDateString("pt-BR")} — {fmt(lastTxn.amount)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem transações</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Histórico de Transações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Sem transações registradas</TableCell></TableRow>
              ) : (
                txns.map((t, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(t.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-xs ${t.direction === "entrada" ? "text-emerald-700 dark:text-emerald-300 border-emerald-300" : "text-red-700 dark:text-red-300 border-red-300"}`}>
                        {t.direction === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${t.direction === "entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {t.direction === "entrada" ? "+" : "−"} {fmt(t.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
