import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Package, TrendingDown, DollarSign, AlertTriangle, Plus, Eye, Settings, ArrowRight,
  MapPin, Calendar, Tag, Wrench,
} from "lucide-react";
import { fixedAssets, assetKpis, depreciationByCategory } from "@/mock/fixedAssetsData";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Imobilizado() {
  const [selectedAsset, setSelectedAsset] = useState<typeof fixedAssets[0] | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = fixedAssets.filter((a) =>
    a.name.toLowerCase().includes(filter.toLowerCase()) || a.category.toLowerCase().includes(filter.toLowerCase())
  );

  const depreciationProgress = (asset: typeof fixedAssets[0]) => {
    const used = asset.acquisitionValue - asset.currentValue;
    return (used / asset.acquisitionValue) * 100;
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gestão de Ativo Imobilizado</h1>
          <p className="text-muted-foreground font-data text-sm">Controle patrimonial • Depreciação e amortização</p>
        </div>
        <Button size="sm" className="gap-1 text-xs"><Plus className="w-3 h-3" /> Cadastrar Ativo</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Imobilizado Bruto", value: formatCurrency(assetKpis.grossTotal), color: "text-foreground", icon: Package },
          { label: "Depreciação Acumulada", value: formatCurrency(assetKpis.accumulatedDepreciation), color: "text-destructive", icon: TrendingDown },
          { label: "Imobilizado Líquido", value: formatCurrency(assetKpis.netTotal), color: "text-primary", icon: DollarSign },
          { label: "Depreciação Mensal", value: formatCurrency(assetKpis.monthlyDepreciation), color: "text-yellow-500", icon: Calendar },
          { label: "Totalmente Depreciados", value: `${assetKpis.fullyDepreciated} ativos`, color: "text-muted-foreground", icon: AlertTriangle },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border/50 bg-card/80">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground font-data">{k.label}</p>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className={`text-lg font-bold font-data ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assets table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-data">Cadastro de Ativos ({filtered.length})</CardTitle>
          <input
            type="text"
            placeholder="Buscar ativo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs font-data text-foreground placeholder:text-muted-foreground w-48"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Ativo</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs text-right">Valor Aquisição</TableHead>
                  <TableHead className="text-xs">Data Compra</TableHead>
                  <TableHead className="text-xs">Vida Útil</TableHead>
                  <TableHead className="text-xs text-right">Depr/Mês</TableHead>
                  <TableHead className="text-xs text-right">Valor Atual</TableHead>
                  <TableHead className="text-xs">Local</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id} className={cn(a.status === "fully_depreciated" && "opacity-60")}>
                    <TableCell className="text-xs font-data font-medium">{a.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-data">{a.category}</Badge></TableCell>
                    <TableCell className="text-xs font-data text-right">{formatCurrency(a.acquisitionValue)}</TableCell>
                    <TableCell className="text-xs font-data">{a.purchaseDate}</TableCell>
                    <TableCell className="text-xs font-data">{a.usefulLifeMonths}m</TableCell>
                    <TableCell className="text-xs font-data text-right">{a.monthlyDepreciation > 0 ? formatCurrency(a.monthlyDepreciation) : "—"}</TableCell>
                    <TableCell className="text-xs font-data text-right font-semibold">{formatCurrency(a.currentValue)}</TableCell>
                    <TableCell className="text-xs font-data">{a.location}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]",
                        a.status === "active" ? "bg-success/20 text-success border-success/30" :
                        a.status === "fully_depreciated" ? "bg-muted text-muted-foreground border-border" :
                        "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      )}>
                        {a.status === "active" ? "Ativo" : a.status === "fully_depreciated" ? "Depreciado" : a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedAsset(a)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Depreciation by category */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-data">Relatório de Depreciação Mensal por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs text-right">Bruto</TableHead>
                <TableHead className="text-xs text-right">Deprec. Acum.</TableHead>
                <TableHead className="text-xs text-right">Líquido</TableHead>
                <TableHead className="text-xs text-right">Deprec./Mês</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depreciationByCategory.map((d) => (
                <TableRow key={d.category}>
                  <TableCell className="text-xs font-data font-medium">{d.category}</TableCell>
                  <TableCell className="text-xs font-data text-right">{formatCurrency(d.gross)}</TableCell>
                  <TableCell className="text-xs font-data text-right text-destructive">{formatCurrency(d.depreciation)}</TableCell>
                  <TableCell className="text-xs font-data text-right font-semibold">{formatCurrency(d.net)}</TableCell>
                  <TableCell className="text-xs font-data text-right">{formatCurrency(d.monthlyDep)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-3">
            <Button size="sm" className="text-xs gap-1">Lançar depreciação na DRE <ArrowRight className="w-3 h-3" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Asset detail dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle className="font-data text-base">{selectedAsset.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Tag, label: "Tag", value: selectedAsset.tag },
                    { icon: MapPin, label: "Local", value: selectedAsset.location },
                    { icon: Calendar, label: "Compra", value: selectedAsset.purchaseDate },
                    { icon: Package, label: "Categoria", value: selectedAsset.category },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-data">{item.label}</p>
                        <p className="text-xs font-data text-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-data">
                    <span className="text-muted-foreground">Valor aquisição</span>
                    <span>{formatCurrency(selectedAsset.acquisitionValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-data">
                    <span className="text-muted-foreground">Depreciação acumulada</span>
                    <span className="text-destructive">{formatCurrency(selectedAsset.acquisitionValue - selectedAsset.currentValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-data font-semibold">
                    <span>Valor atual</span>
                    <span className="text-primary">{formatCurrency(selectedAsset.currentValue)}</span>
                  </div>
                  <Progress value={depreciationProgress(selectedAsset)} className="h-2" />
                  <p className="text-[10px] text-muted-foreground font-data text-center">
                    {Math.round(depreciationProgress(selectedAsset))}% depreciado • {selectedAsset.usefulLifeMonths} meses de vida útil
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs gap-1"><Wrench className="w-3 h-3" /> Manutenção</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1"><MapPin className="w-3 h-3" /> Transferir</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1 text-destructive">Dar baixa</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1">Vender</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
