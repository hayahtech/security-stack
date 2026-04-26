import { useState, useMemo } from "react";
import { FileText, Download, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { mockAuditLog, type AuditEntry } from "@/data/access-control-mock";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "Criou", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  update: { label: "Editou", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  delete: { label: "Excluiu", color: "bg-destructive/15 text-destructive" },
  login: { label: "Login", color: "bg-muted text-muted-foreground" },
  approve: { label: "Aprovou", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  reject: { label: "Rejeitou", color: "bg-destructive/15 text-destructive" },
};

export default function LogAuditoria() {
  const [filterUser, setFilterUser] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [search, setSearch] = useState("");

  const uniqueUsers = useMemo(() => [...new Set(mockAuditLog.map((e) => e.userName))], []);
  const uniqueModules = useMemo(() => [...new Set(mockAuditLog.map((e) => e.module))], []);

  const filtered = useMemo(() => {
    return mockAuditLog.filter((e) => {
      if (filterUser !== "all" && e.userName !== filterUser) return false;
      if (filterModule !== "all" && e.module !== filterModule) return false;
      if (filterAction !== "all" && e.action !== filterAction) return false;
      if (search && !e.record.toLowerCase().includes(search.toLowerCase()) && !e.userName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterUser, filterModule, filterAction, search]);

  function handleExportCSV() {
    const header = "Data/Hora,Usuário,Ação,Módulo,Registro,IP\n";
    const rows = filtered.map((e) =>
      `${new Date(e.timestamp).toLocaleString("pt-BR")},${e.userName},${ACTION_LABELS[e.action]?.label || e.action},${e.module},"${e.record}",${e.ip}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Log de Auditoria
          </h1>
          <p className="text-sm text-muted-foreground">Todas as ações realizadas no sistema</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-1">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Usuário</Label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueUsers.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Módulo</Label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueModules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de ação</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar registro..." className="pl-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Registro afetado</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell>
                  </TableRow>
                ) : filtered.map((e) => {
                  const act = ACTION_LABELS[e.action] || { label: e.action, color: "bg-muted text-muted-foreground" };
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-medium text-sm">{e.userName}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${act.color}`}>{act.label}</Badge></TableCell>
                      <TableCell className="text-sm">{e.module}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">{e.record}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{e.ip}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">{filtered.length} registro(s) encontrado(s)</p>
    </div>
  );
}
