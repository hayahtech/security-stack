import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackagePlus, Upload, History, Search } from 'lucide-react';
import { ManualEntryTab } from '@/components/stock/ManualEntryTab';
import { XMLImportTab } from '@/components/stock/XMLImportTab';
import { StockEntryHistory } from '@/components/stock/StockEntryHistory';
import { NFeKeyLookupTab } from '@/components/stock/NFeKeyLookupTab';

export default function StockEntryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-primary" />
          Entrada de Estoque
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre entradas manualmente, importe XML ou consulte NF-e pela chave
        </p>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="manual" className="flex items-center gap-1.5 py-2">
            <PackagePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Manual</span>
            <span className="sm:hidden text-xs">Manual</span>
          </TabsTrigger>
          <TabsTrigger value="xml" className="flex items-center gap-1.5 py-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">XML</span>
            <span className="sm:hidden text-xs">XML</span>
          </TabsTrigger>
          <TabsTrigger value="consulta" className="flex items-center gap-1.5 py-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Consultar NF-e</span>
            <span className="sm:hidden text-xs">Consulta</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 py-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
            <span className="sm:hidden text-xs">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual"><ManualEntryTab /></TabsContent>
        <TabsContent value="xml"><XMLImportTab /></TabsContent>
        <TabsContent value="consulta"><NFeKeyLookupTab /></TabsContent>
        <TabsContent value="history"><StockEntryHistory /></TabsContent>
      </Tabs>
    </div>
  );
}
