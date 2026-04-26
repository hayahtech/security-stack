import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketingCampaigns, useCreateCampaign } from '@/hooks/useMarketingCampaigns';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useCustomers } from '@/hooks/useCustomers';
import { MarketingDashboard } from '@/components/marketing/MarketingDashboard';
import { CampaignsList } from '@/components/marketing/CampaignsList';
import { CampaignForm } from '@/components/marketing/CampaignForm';
import { MarketingExpenses } from '@/components/marketing/MarketingExpenses';
import { BarChart3, Target, Receipt } from 'lucide-react';

export default function MarketingPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: campaigns, isLoading: campaignsLoading } = useMarketingCampaigns();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: allTransactions, isLoading: txLoading } = useTransactions();

  const marketingCats = (categories || []).filter(c => c.group === 'Marketing');
  const marketingCatIds = marketingCats.map(c => c.id);
  const { data: marketingTx } = useTransactions({ categoryIds: marketingCatIds });

  const createCampaign = useCreateCampaign();
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  // Count new customers this month
  const { data: customers } = useCustomers();
  const newCustomersThisMonth = useMemo(() => {
    if (!customers) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return customers.filter(c => new Date(c.created_at) >= monthStart).length;
  }, [customers]);

  const isLoading = campaignsLoading || catLoading || txLoading;

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Marketing</h1>
        <p className="text-sm text-muted-foreground">Campanhas, investimentos e análise de ROI</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Despesas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <MarketingDashboard
            campaigns={campaigns || []}
            transactions={marketingTx || []}
            allTransactions={allTransactions || []}
            newCustomersCount={newCustomersThisMonth}
          />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsList
            campaigns={campaigns || []}
            onNewCampaign={() => setFormOpen(true)}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <MarketingExpenses
            transactions={marketingTx || []}
            categories={marketingCats}
            campaigns={campaigns || []}
            onDelete={(id) => deleteTx.mutate(id)}
            onSave={(data) => {
              const { campaign_id, ...rest } = data;
              createTx.mutate({
                ...rest,
                ...(campaign_id && campaign_id !== 'none' ? { campaign_id } : {}),
              } as any);
            }}
          />
        </TabsContent>
      </Tabs>

      <CampaignForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={(data) => {
          createCampaign.mutate(data);
          setFormOpen(false);
        }}
      />
    </div>
  );
}
