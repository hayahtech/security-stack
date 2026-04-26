import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ShieldCheck, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getAllWithdrawalReport } from "@/data/withdrawal-utils";

export default function Carencia() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"todos" | "carencia" | "liberados_semana">("todos");

  const allData = useMemo(() => getAllWithdrawalReport(), []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const filtered = useMemo(() => {
    if (filter === "carencia") return allData.filter((d) => d.inWithdrawal);
    if (filter === "liberados_semana") {
      return allData.filter((d) => {
        if (d.inWithdrawal) return false;
        const rel = new Date(d.releaseDate);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return rel >= weekAgo && rel <= today;
      });
    }
    return allData;
  }, [allData, filter]);

  const inWithdrawalCount = allData.filter((d) => d.inWithdrawal).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            Relatório de Carência
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de período de carência de medicamentos
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Em Carência</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{inWithdrawalCount}</p>
            <p className="text-xs text-muted-foreground">animais com restrição</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Liberados</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {allData.filter((d) => !d.inWithdrawal).length}
            </p>
            <p className="text-xs text-muted-foreground">tratamentos com carência expirada</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total de Registros</p>
            <p className="text-3xl font-bold text-foreground">{allData.length}</p>
            <p className="text-xs text-muted-foreground">tratamentos com carência</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os registros</SelectItem>
            <SelectItem value="carencia">Somente em carência</SelectItem>
            <SelectItem value="liberados_semana">Liberados esta semana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Animal</TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead>Data Aplicação</TableHead>
                <TableHead className="text-center">Dias Carência</TableHead>
                <TableHead>Liberação</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow
                    key={d.treatmentId}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => navigate(`/rebanho/animais/${d.animalId}`)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-mono font-semibold text-primary">{d.earTag}</span>
                        <span className="text-muted-foreground ml-2 text-sm">{d.animalName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{d.medication}</TableCell>
                    <TableCell>{d.applicationDate}</TableCell>
                    <TableCell className="text-center">{d.withdrawalDays}</TableCell>
                    <TableCell>{d.releaseDate}</TableCell>
                    <TableCell className="text-center">
                      {d.inWithdrawal ? (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                          ⚠️ {d.remainingDays}d restantes
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Liberado
                        </Badge>
                      )}
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
