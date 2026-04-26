import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  User,
  Package,
  ArrowRightLeft,
  Plus,
  ChevronRight,
  Grid3X3,
} from 'lucide-react';
import { NewWarehouseModal } from '@/components/warehouses/NewWarehouseModal';
import { NewTransferModal } from '@/components/warehouses/NewTransferModal';

export default function Warehouses() {
  const { warehouses } = useAppStore();
  const [newWarehouseOpen, setNewWarehouseOpen] = useState(false);
  const [newTransferOpen, setNewTransferOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Armazéns e Localizações</h1>
          <p className="text-muted-foreground">Gestão de centros de distribuição e bins</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewTransferOpen(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Nova Transferência
          </Button>
          <Button size="sm" onClick={() => setNewWarehouseOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Armazém
          </Button>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((warehouse) => {
          const utilization = (warehouse.usedCapacity / warehouse.capacity) * 100;
          const getUtilizationColor = (util: number) => {
            if (util >= 90) return 'text-destructive';
            if (util >= 70) return 'text-warning';
            return 'text-success';
          };
          const getProgressColor = (util: number) => {
            if (util >= 90) return 'bg-destructive';
            if (util >= 70) return 'bg-warning';
            return 'bg-success';
          };

          return (
            <Card key={warehouse.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <WarehouseIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{warehouse.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {warehouse.city}, {warehouse.state}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilização</span>
                    <span className={`font-mono font-medium ${getUtilizationColor(utilization)}`}>
                      {utilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(utilization)} transition-all`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>{warehouse.usedCapacity.toLocaleString('pt-BR')} m³</span>
                    <span>{warehouse.capacity.toLocaleString('pt-BR')} m³</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold font-mono">{warehouse.totalSKUs}</p>
                      <p className="text-xs text-muted-foreground">SKUs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold font-mono">{warehouse.zones.length}</p>
                      <p className="text-xs text-muted-foreground">Zonas</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Responsável:</span>
                  <span className="text-sm font-medium">{warehouse.manager}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {warehouse.zones.map((zone) => (
                    <Badge key={zone.id} variant="secondary" className="text-xs">
                      {zone.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bin Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mapa de Bins - Visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-20 gap-1">
            {Array.from({ length: 200 }).map((_, i) => {
              const occupied = Math.random() > 0.3;
              const utilization = Math.random();
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-primary ${
                    occupied
                      ? utilization > 0.8
                        ? 'bg-destructive/60'
                        : utilization > 0.5
                        ? 'bg-warning/60'
                        : 'bg-success/60'
                      : 'bg-muted'
                  }`}
                  title={`Bin ${i + 1} - ${occupied ? `${(utilization * 100).toFixed(0)}% ocupado` : 'Vazio'}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <span className="text-muted-foreground">Vazio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-success/60" />
              <span className="text-muted-foreground">&lt; 50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-warning/60" />
              <span className="text-muted-foreground">50-80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-destructive/60" />
              <span className="text-muted-foreground">&gt; 80%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <NewWarehouseModal open={newWarehouseOpen} onOpenChange={setNewWarehouseOpen} />
      <NewTransferModal open={newTransferOpen} onOpenChange={setNewTransferOpen} />
    </div>
  );
}
