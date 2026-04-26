import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Calendar,
  FileText,
  DollarSign,
  BarChart2,
  TrendingUp,
  Package,
  AlertTriangle,
  Truck,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--info))'];

const reportTypes = [
  { id: 'all', label: 'Todos', icon: BarChart2 },
  { id: 'valuation', label: 'Valoração de Estoque', icon: DollarSign },
  { id: 'abc', label: 'Análise ABC', icon: BarChart2 },
  { id: 'dead-stock', label: 'Estoque Parado', icon: Clock },
  { id: 'turnover', label: 'Giro de Estoque', icon: TrendingUp },
  { id: 'shrinkage', label: 'Perdas e Quebras', icon: AlertTriangle },
  { id: 'fill-rate', label: 'Fill Rate por Fornecedor', icon: Truck },
];

export default function Reports() {
  const { skus, movements, suppliers } = useAppStore();
  const [selectedReport, setSelectedReport] = useState('all');
  const [period, setPeriod] = useState('30d');

  // Generate report data
  const categoryData = ['Eletrônicos', 'Vestuário', 'Casa', 'Alimentos', 'Industrial'].map((cat) => {
    const catSkus = skus.filter((s) => s.category === cat);
    return {
      name: cat,
      valor: catSkus.reduce((acc, s) => acc + s.stock * s.cost, 0),
      quantidade: catSkus.reduce((acc, s) => acc + s.stock, 0),
      skus: catSkus.length,
    };
  });

  const abcData = [
    { name: 'Classe A', value: 20, revenue: 80, color: 'hsl(var(--success))' },
    { name: 'Classe B', value: 30, revenue: 15, color: 'hsl(var(--warning))' },
    { name: 'Classe C', value: 50, revenue: 5, color: 'hsl(var(--muted-foreground))' },
  ];

  const turnoverData = ['Eletrônicos', 'Vestuário', 'Casa', 'Alimentos', 'Industrial'].map((cat) => ({
    name: cat.substring(0, 4),
    giro: (Math.random() * 8 + 2).toFixed(1),
  }));

  const supplierFillRate = suppliers.slice(0, 6).map((sup) => ({
    name: sup.name.split(' ')[0],
    fillRate: sup.fillRate,
    onTime: sup.onTimeDeliveryRate,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground">Insights detalhados sobre seu estoque</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="ytd">Ano atual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Button
              key={report.id}
              variant={selectedReport === report.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedReport(report.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {report.label}
            </Button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Valuation by Category */}
        {(selectedReport === 'all' || selectedReport === 'valuation') && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Valoração de Estoque por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                    />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedReport === 'all' || selectedReport === 'abc') && (
          <Card>
            <CardHeader>
              <CardTitle>Análise ABC - Curva de Pareto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={abcData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {abcData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {abcData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span>{item.value}% SKUs</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{item.revenue}% receita</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedReport === 'all' || selectedReport === 'turnover') && (
          <Card>
            <CardHeader>
              <CardTitle>Giro de Estoque por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turnoverData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={50} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="giro" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {(selectedReport === 'all' || selectedReport === 'fill-rate') && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Desempenho de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplierFillRate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`]}
                    />
                    <Legend />
                    <Bar dataKey="fillRate" name="Fill Rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="onTime" name="Entrega no Prazo" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
