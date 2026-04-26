import { useAppStore } from '@/stores/useAppStore';
import { dashboardKPIs, inventoryHealthScore, generateActivityFeed } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  DollarSign,
  AlertTriangle,
  PackageX,
  FileText,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Warehouse,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

const formatCurrency = (num: number): string => {
  if (num >= 1000000) return `R$ ${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R$ ${(num / 1000).toFixed(0)}K`;
  return `R$ ${num.toFixed(0)}`;
};

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  trend: number[];
  icon: React.ElementType;
  valueColor?: string;
}

function KPICard({ title, value, change, trend, icon: Icon, valueColor }: KPICardProps) {
  const isPositive = change >= 0;
  const trendData = trend.map((v, i) => ({ value: v, index: i }));

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${valueColor || ''}`}>{value}</span>
          <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        </div>
        <div className="h-[40px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthScoreCard() {
  const score = inventoryHealthScore;
  const pieData = [
    { name: 'Score', value: score.overall },
    { name: 'Remaining', value: 100 - score.overall },
  ];

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="row-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Score de Saúde do Estoque</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-4xl font-bold font-mono ${getScoreColor(score.overall)}`}>
                {score.overall}
              </span>
            </div>
          </div>
          
          <div className="w-full mt-6 space-y-4">
            {Object.entries(score.breakdown).map(([key, value]) => {
              const labels: Record<string, string> = {
                stockAvailability: 'Disponibilidade',
                turnoverRate: 'Giro de Estoque',
                deadStock: 'Estoque Parado',
                orderFulfillment: 'Atendimento',
              };
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{labels[key]}</span>
                    <span className={`font-mono font-medium ${getScoreColor(value)}`}>{value}%</span>
                  </div>
                  <Progress value={value} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityFeed() {
  const activities = generateActivityFeed();
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'movement': return <Package className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'po': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'alert': return 'text-warning';
      case 'po': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="row-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Atividade ao Vivo</CardTitle>
        <Badge variant="outline" className="font-mono text-xs">
          <span className="w-2 h-2 bg-success rounded-full mr-1.5 animate-pulse" />
          Live
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className={`mt-0.5 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <div className="flex items-center text-xs text-muted-foreground font-mono">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(activity.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TopSKUsChart() {
  const { skus } = useAppStore();
  const topSkus = skus
    .sort((a, b) => (b.stock - b.available) - (a.stock - a.available))
    .slice(0, 10)
    .map((sku) => ({
      name: sku.name.length > 20 ? sku.name.substring(0, 20) + '...' : sku.name,
      vendas: Math.floor(Math.random() * 200) + 50,
    }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top 10 SKUs por Giro (Semana)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSkus} layout="vertical">
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function WarehouseHeatmap() {
  const { warehouses } = useAppStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Utilização por Armazém</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {warehouses.map((wh) => {
            const utilization = (wh.usedCapacity / wh.capacity) * 100;
            const getColor = (util: number) => {
              if (util >= 90) return 'bg-destructive';
              if (util >= 70) return 'bg-warning';
              return 'bg-success';
            };
            return (
              <div key={wh.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{wh.city}</span>
                  </div>
                  <span className="text-sm font-mono">{utilization.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getColor(utilization)} transition-all`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatNumber(wh.usedCapacity)} / {formatNumber(wh.capacity)} m³</span>
                  <span>{wh.totalSKUs} SKUs</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Central de Comando</h1>
        <p className="text-muted-foreground">Visão geral do estoque em tempo real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="SKUs Ativos"
          value={formatNumber(dashboardKPIs.totalActiveSKUs.value)}
          change={dashboardKPIs.totalActiveSKUs.change}
          trend={dashboardKPIs.totalActiveSKUs.trend}
          icon={Package}
        />
        <KPICard
          title="Valor do Estoque"
          value={formatCurrency(dashboardKPIs.totalStockValue.value)}
          change={dashboardKPIs.totalStockValue.change}
          trend={dashboardKPIs.totalStockValue.trend}
          icon={DollarSign}
        />
        <KPICard
          title="Alertas Estoque Baixo"
          value={dashboardKPIs.lowStockAlerts.value.toString()}
          change={dashboardKPIs.lowStockAlerts.change}
          trend={dashboardKPIs.lowStockAlerts.trend}
          icon={AlertTriangle}
          valueColor="text-warning"
        />
        <KPICard
          title="Itens Sem Estoque"
          value={dashboardKPIs.outOfStockItems.value.toString()}
          change={dashboardKPIs.outOfStockItems.change}
          trend={dashboardKPIs.outOfStockItems.trend}
          icon={PackageX}
          valueColor="text-destructive"
        />
        <KPICard
          title="POs Pendentes"
          value={dashboardKPIs.pendingPOs.value.toString()}
          change={dashboardKPIs.pendingPOs.change}
          trend={dashboardKPIs.pendingPOs.trend}
          icon={FileText}
        />
        <KPICard
          title="Fill Rate"
          value={`${dashboardKPIs.fillRate.value}%`}
          change={dashboardKPIs.fillRate.change}
          trend={dashboardKPIs.fillRate.trend}
          icon={TrendingUp}
          valueColor="text-success"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthScoreCard />
        <TopSKUsChart />
        <WarehouseHeatmap />
        <ActivityFeed />
      </div>
    </div>
  );
}
