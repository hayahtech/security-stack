import { useState } from "react";
import { FileSpreadsheet, FileText, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DreTable } from "@/components/dre/DreTable";
import { DreChart } from "@/components/dre/DreChart";
import { DreMarginCards } from "@/components/dre/DreMarginCards";
import { dreData, getManagerialData } from "@/mock/dreData";
import { toast } from "sonner";

export default function Dre() {
  const [isManagerial, setIsManagerial] = useState(false);

  const currentData = isManagerial ? getManagerialData(dreData) : dreData;

  const handleExportPDF = () => {
    toast.success("Exportando DRE para PDF...", {
      description: "O download iniciará em instantes.",
    });
  };

  const handleExportExcel = () => {
    toast.success("Exportando DRE para Excel...", {
      description: "O download iniciará em instantes.",
    });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            DRE - Demonstração do Resultado
          </h1>
          <p className="text-muted-foreground font-data">
            Análise detalhada do resultado do exercício
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Contábil/Gerencial */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManagerial(!isManagerial)}
            className={`gap-2 ${
              isManagerial
                ? "bg-secondary/20 border-secondary/50 text-secondary"
                : "bg-muted/50 border-border"
            }`}
          >
            {isManagerial ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {isManagerial ? "Lucro Gerencial" : "Lucro Contábil"}
          </Button>

          {/* Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-2 bg-muted/50 border-border hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-2 bg-muted/50 border-border hover:bg-muted"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Margin Cards */}
      <DreMarginCards data={currentData} />

      {/* DRE Table */}
      <DreTable data={currentData} />

      {/* Chart */}
      <DreChart data={currentData} />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-data p-4 rounded-lg bg-muted/20 border border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold">AH%</span>
          <span>= Análise Horizontal (variação vs período anterior)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">AV%</span>
          <span>= Análise Vertical (% sobre Receita Líquida)</span>
        </div>
        {isManagerial && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-secondary"></span>
            <span>Modo Gerencial: exclui depreciação + ajuste de R$ 45.000/mês</span>
          </div>
        )}
      </div>
    </div>
  );
}
