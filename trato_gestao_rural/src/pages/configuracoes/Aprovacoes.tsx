import { useState } from "react";
import {
  CheckCircle2, XCircle, Clock, Settings, DollarSign, Edit2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  mockPendingApprovals, mockUsers, defaultApprovalConfig,
  type PendingApproval, type ApprovalConfig,
} from "@/data/access-control-mock";

export default function Aprovacoes() {
  const [config, setConfig] = useState<ApprovalConfig>({ ...defaultApprovalConfig });
  const [approvals, setApprovals] = useState<PendingApproval[]>([...mockPendingApprovals]);

  /* rejection dialog */
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  /* edit & approve dialog */
  const [editApproval, setEditApproval] = useState<PendingApproval | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const eligibleApprovers = mockUsers.filter((u) => u.profileId === "owner" || u.profileId === "manager");

  function handleApprove(id: string) {
    setApprovals(approvals.map((a) => a.id === id ? { ...a, status: "approved" as const } : a));
    toast.success("Lançamento aprovado");
  }

  function handleReject() {
    if (!rejectId || !rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    setApprovals(approvals.map((a) => a.id === rejectId ? { ...a, status: "rejected" as const, rejectionReason: rejectReason } : a));
    setRejectId(null);
    setRejectReason("");
    toast.success("Lançamento rejeitado");
  }

  function openEditApprove(a: PendingApproval) {
    setEditApproval(a);
    setEditAmount(String(a.amount));
    setEditDesc(a.description);
  }

  function handleEditApprove() {
    if (!editApproval) return;
    setApprovals(approvals.map((a) => a.id === editApproval.id
      ? { ...a, status: "approved" as const, amount: Number(editAmount), description: editDesc }
      : a
    ));
    setEditApproval(null);
    toast.success("Lançamento editado e aprovado");
  }

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  function toggleApprover(userId: string) {
    setConfig((c) => ({
      ...c,
      approverIds: c.approverIds.includes(userId)
        ? c.approverIds.filter((id) => id !== userId)
        : [...c.approverIds, userId],
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" /> Aprovação de Lançamentos
        </h1>
        <p className="text-sm text-muted-foreground">Configure o fluxo de aprovação e gerencie lançamentos pendentes</p>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" /> Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-medium">Ativar fluxo de aprovação</p>
              <p className="text-xs text-muted-foreground">Lançamentos acima do limite requerem aprovação</p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => setConfig({ ...config, enabled: v })} />
          </div>

          {config.enabled && (
            <>
              <div className="space-y-1.5 max-w-xs">
                <Label>Limite para aprovação (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number" min={0}
                    value={config.limitValue}
                    onChange={(e) => setConfig({ ...config, limitValue: Number(e.target.value) })}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Lançamentos acima deste valor requerem aprovação</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aprovadores</Label>
                <div className="flex flex-wrap gap-3">
                  {eligibleApprovers.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                      <Switch checked={config.approverIds.includes(u.id)} onCheckedChange={() => toggleApprover(u.id)} />
                      <span className="text-sm">{u.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {u.profileId === "owner" ? "Proprietário" : "Gerente"}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pending */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Pendentes
              <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="w-36">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.description}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {a.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-sm">{a.requestedByName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.module}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="default" className="h-7 gap-1 text-xs" onClick={() => handleApprove(a.id)}>
                            <CheckCircle2 className="h-3 w-3" /> Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs" onClick={() => setRejectId(a.id)}>
                            <XCircle className="h-3 w-3" /> Rejeitar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openEditApprove(a)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Aprovações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolved.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{a.description}</TableCell>
                      <TableCell className="text-sm">
                        {a.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell className="text-sm">{a.requestedByName}</TableCell>
                      <TableCell>
                        <Badge className={a.status === "approved" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-destructive/15 text-destructive"}>
                          {a.status === "approved" ? "Aprovado" : "Rejeitado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.rejectionReason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) { setRejectId(null); setRejectReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Lançamento</DialogTitle>
            <DialogDescription>Informe o motivo da rejeição (obrigatório).</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motivo da rejeição..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit & Approve Dialog */}
      <Dialog open={!!editApproval} onOpenChange={(o) => !o && setEditApproval(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar e Aprovar</DialogTitle>
            <DialogDescription>Ajuste os dados e aprove o lançamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditApproval(null)}>Cancelar</Button>
            <Button onClick={handleEditApprove} className="gap-1"><CheckCircle2 className="h-4 w-4" /> Editar e Aprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
