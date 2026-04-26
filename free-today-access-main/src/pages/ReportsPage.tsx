import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingDown, Package, Users, Star } from 'lucide-react';
import { DREReport } from '@/components/reports/DREReport';
import { CashFlowReport } from '@/components/reports/CashFlowReport';
import { StockReport } from '@/components/reports/StockReport';
import { PayrollReport } from '@/components/reports/PayrollReport';
import { LoyaltyReport } from '@/components/reports/LoyaltyReport';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Relatórios Profissionais
        </h1>
        <p className="text-muted-foreground mt-1">
          Relatórios completos com exportação em PDF e Excel
        </p>
      </div>

      <Tabs defaultValue="dre" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="dre" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">DRE</span>
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Fluxo de Caixa</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Folha</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Fidelidade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dre"><DREReport /></TabsContent>
        <TabsContent value="cashflow"><CashFlowReport /></TabsContent>
        <TabsContent value="stock"><StockReport /></TabsContent>
        <TabsContent value="payroll"><PayrollReport /></TabsContent>
        <TabsContent value="loyalty"><LoyaltyReport /></TabsContent>
      </Tabs>
    </div>
  );
}
