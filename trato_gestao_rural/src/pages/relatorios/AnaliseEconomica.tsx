import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, DollarSign, Beef, Target, MapPin } from "lucide-react";
import AnaliseGeral from "./AnaliseEconomicaGeral";
import CustoProducao from "./CustoProducao";
import DREPorAnimal from "./DREPorAnimal";
import PontoEquilibrio from "./PontoEquilibrio";
import ResultadosPorArea from "./ResultadosPorArea";

export default function AnaliseEconomica() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Análise Econômica</h1>
        <p className="text-muted-foreground">Indicadores financeiros e de performance da fazenda</p>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="geral" className="gap-1.5"><BarChart3 className="h-4 w-4" />Geral</TabsTrigger>
          <TabsTrigger value="custo" className="gap-1.5"><DollarSign className="h-4 w-4" />Custo Produção</TabsTrigger>
          <TabsTrigger value="dre" className="gap-1.5"><Beef className="h-4 w-4" />DRE por Animal</TabsTrigger>
          <TabsTrigger value="equilibrio" className="gap-1.5"><Target className="h-4 w-4" />Ponto de Equilíbrio</TabsTrigger>
          <TabsTrigger value="areas" className="gap-1.5"><MapPin className="h-4 w-4" />Resultados por Área</TabsTrigger>
        </TabsList>
        <TabsContent value="geral"><AnaliseGeral /></TabsContent>
        <TabsContent value="custo"><CustoProducao /></TabsContent>
        <TabsContent value="dre"><DREPorAnimal /></TabsContent>
        <TabsContent value="equilibrio"><PontoEquilibrio /></TabsContent>
        <TabsContent value="areas"><ResultadosPorArea /></TabsContent>
      </Tabs>
    </div>
  );
}
