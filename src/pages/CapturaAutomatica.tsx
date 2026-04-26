import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Clock, Brain, Sparkles,
  FileImage, FileCode, Zap, MessageSquareText, History, Search, ChevronRight, Loader2, Copy, Check, Edit, X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ─── Mock data ─── */
const pendingDocs = [
  { id: 1, file: "NF_AWS_Mar2025.xml", supplier: "AWS Brasil Ltda", value: 48320, status: "Aguardando revisão", confidence: 97, date: "05/03/2025" },
  { id: 2, file: "NF_Google_Cloud.pdf", supplier: "Google Cloud Brasil", value: 32100, status: "Aprovado automaticamente", confidence: 99, date: "03/03/2025" },
  { id: 3, file: "recibo_uber_mar.jpg", supplier: "Uber do Brasil", value: 847.5, status: "Confiança baixa", confidence: 72, date: "06/03/2025" },
  { id: 4, file: "NF_Aluguel_Sede.pdf", supplier: "Imobiliária Central", value: 18500, status: "Aguardando revisão", confidence: 94, date: "01/03/2025" },
  { id: 5, file: "NF_Slack_Licenca.xml", supplier: "Slack Technologies", value: 4200, status: "Duplicata detectada!", confidence: 98, date: "04/03/2025" },
  { id: 6, file: "recibo_restaurante.png", supplier: "Restaurante Bom Sabor", value: 342, status: "Confiança baixa", confidence: 68, date: "07/03/2025" },
  { id: 7, file: "NF_Marketing_Digital.pdf", supplier: "AdTech Solutions", value: 28750, status: "Aprovado automaticamente", confidence: 96, date: "02/03/2025" },
  { id: 8, file: "NF_Consultoria_RH.xml", supplier: "PeopleFirst Consultoria", value: 15000, status: "Aguardando revisão", confidence: 91, date: "05/03/2025" },
];

const captureHistory = [
  { id: 1, source: "NF-e XML", desc: "AWS Brasil — Infraestrutura Cloud", value: 48320, date: "07/03 14:22", confidence: 97, icon: FileCode },
  { id: 2, source: "OCR PDF", desc: "Google Cloud — Licenças", value: 32100, date: "07/03 11:05", confidence: 99, icon: FileText },
  { id: 3, source: "OCR Imagem", desc: "Uber — Transporte", value: 847.5, date: "07/03 09:33", confidence: 72, icon: FileImage },
  { id: 4, source: "Texto IA", desc: "Combustível — Operação Sul", value: 1200, date: "06/03 18:40", confidence: 95, icon: MessageSquareText },
  { id: 5, source: "NF-e XML", desc: "Slack — Licenças de Software", value: 4200, date: "06/03 16:12", confidence: 98, icon: FileCode },
  { id: 6, source: "Manual", desc: "Café e suprimentos escritório", value: 185, date: "06/03 14:55", confidence: 100, icon: Edit },
  { id: 7, source: "NF-e XML", desc: "Imobiliária Central — Aluguel", value: 18500, date: "06/03 10:00", confidence: 94, icon: FileCode },
  { id: 8, source: "OCR PDF", desc: "AdTech — Marketing Digital", value: 28750, date: "05/03 17:30", confidence: 96, icon: FileText },
  { id: 9, source: "Texto IA", desc: "Almoço equipe comercial", value: 680, date: "05/03 13:15", confidence: 88, icon: MessageSquareText },
  { id: 10, source: "NF-e XML", desc: "PeopleFirst — Consultoria RH", value: 15000, date: "05/03 09:45", confidence: 91, icon: FileCode },
  { id: 11, source: "OCR Imagem", desc: "Restaurante — Reunião cliente", value: 342, date: "04/03 20:10", confidence: 68, icon: FileImage },
  { id: 12, source: "Manual", desc: "Estacionamento centro", value: 45, date: "04/03 16:22", confidence: 100, icon: Edit },
];

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  "Aguardando revisão": { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  "Confiança baixa": { color: "bg-destructive/20 text-destructive border-destructive/30", icon: AlertTriangle },
  "Duplicata detectada!": { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Copy },
  "Aprovado automaticamente": { color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
};

/* ─── Upload Simulation Steps ─── */
type Step = { label: string; done: boolean; active: boolean };

const initialSteps: Step[] = [
  { label: "Recebendo", done: false, active: false },
  { label: "Lendo", done: false, active: false },
  { label: "Extraindo", done: false, active: false },
  { label: "Classificando", done: false, active: false },
  { label: "Pronto", done: false, active: false },
];

export default function CapturaAutomatica() {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [showResult, setShowResult] = useState(false);
  const [resultConfirmed, setResultConfirmed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Text AI
  const [freeText, setFreeText] = useState("Paguei R$ 1.200 de combustível hoje pra fazer a entrega em São Paulo, colocar na operação sul");
  const [textProcessing, setTextProcessing] = useState(false);
  const [textResult, setTextResult] = useState<null | { valor: string; categoria: string; centro: string; data: string }>(null);

  // Inbox filter
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  const simulateUpload = useCallback(() => {
    setProcessing(true);
    setShowResult(false);
    setResultConfirmed(false);
    setUploadProgress(0);

    const stepDelays = [400, 1200, 2600, 3800, 4600];
    const progressIntervals = [20, 45, 70, 90, 100];

    stepDelays.forEach((delay, i) => {
      setTimeout(() => {
        setSteps((prev) =>
          prev.map((s, j) => ({
            ...s,
            done: j < i,
            active: j === i,
          }))
        );
        setUploadProgress(progressIntervals[i]);
      }, delay);
    });

    setTimeout(() => {
      setSteps((prev) => prev.map((s) => ({ ...s, done: true, active: false })));
      setUploadProgress(100);
      setProcessing(false);
      setShowResult(true);
    }, 5200);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      simulateUpload();
    },
    [simulateUpload]
  );

  const handleFileInput = useCallback(() => {
    simulateUpload();
  }, [simulateUpload]);

  const handleTextAI = () => {
    setTextProcessing(true);
    setTextResult(null);
    setTimeout(() => {
      setTextProcessing(false);
      setTextResult({
        valor: "R$ 1.200,00",
        categoria: "Combustível",
        centro: "Operação Sul",
        data: new Date().toLocaleDateString("pt-BR"),
      });
    }, 1500);
  };

  const filteredDocs = pendingDocs.filter((d) => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchSearch = d.supplier.toLowerCase().includes(searchFilter.toLowerCase()) || d.file.toLowerCase().includes(searchFilter.toLowerCase());
    return matchStatus && matchSearch;
  });

  const approveHighConfidence = () => {
    const count = pendingDocs.filter((d) => d.confidence >= 95 && d.status !== "Aprovado automaticamente").length;
    toast({ title: `${count} documentos aprovados`, description: "Todos com confiança > 95% foram lançados automaticamente." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Captura Automática</h1>
          <p className="text-muted-foreground font-data text-sm">Upload inteligente com OCR + IA para entrada de dados</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
          <Zap className="w-3 h-3" /> 84% de automação este mês
        </Badge>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="upload"><Upload className="w-3.5 h-3.5 mr-1" /> Upload</TabsTrigger>
          <TabsTrigger value="inbox"><FileText className="w-3.5 h-3.5 mr-1" /> Inbox ({pendingDocs.filter((d) => d.status !== "Aprovado automaticamente").length})</TabsTrigger>
          <TabsTrigger value="texto"><Brain className="w-3.5 h-3.5 mr-1" /> Texto Livre</TabsTrigger>
          <TabsTrigger value="historico"><History className="w-3.5 h-3.5 mr-1" /> Histórico</TabsTrigger>
        </TabsList>

        {/* ─── UPLOAD TAB ─── */}
        <TabsContent value="upload" className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer",
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border/60 bg-card/50 hover:border-primary/40 hover:bg-primary/[0.02]"
            )}
            onClick={handleFileInput}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                dragOver ? "bg-primary/20 scale-110" : "bg-muted/50",
                processing && "animate-pulse"
              )}>
                <Upload className={cn("w-8 h-8 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">
                  {dragOver ? "Solte o arquivo aqui" : "Arraste ou clique para enviar"}
                </p>
                <p className="text-xs text-muted-foreground font-data mt-1">
                  NF-e XML • PDF de notas • Imagens JPG/PNG de recibos
                </p>
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          {(processing || showResult) && (
            <Card className="border-border/50 bg-card/80">
              <CardContent className="pt-5 space-y-4">
                {/* Progress bar */}
                <Progress value={uploadProgress} className="h-2" />

                {/* Steps */}
                <div className="flex items-center justify-between">
                  {steps.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                        step.done ? "bg-success text-success-foreground" :
                        step.active ? "bg-primary text-primary-foreground animate-pulse" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {step.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-xs font-data transition-colors",
                        step.done ? "text-success" : step.active ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                      {i < steps.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-muted-foreground mx-1" />
                      )}
                    </div>
                  ))}
                </div>

                {processing && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-data text-muted-foreground">Processando documento com IA...</span>
                  </div>
                )}

                {/* Extracted Result */}
                {showResult && !resultConfirmed && (
                  <div className="border border-success/30 bg-success/5 rounded-xl p-5 space-y-4 animate-slide-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="font-display font-semibold text-foreground">Dados Extraídos Automaticamente</span>
                      <Badge className="bg-success/20 text-success border-success/30 text-xs ml-auto">Confiança: 97%</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Fornecedor", value: "AWS Brasil Ltda" },
                        { label: "CNPJ", value: "23.412.587/0001-30" },
                        { label: "Valor", value: "R$ 48.320,00" },
                        { label: "Data emissão", value: "05/03/2025" },
                        { label: "Vencimento", value: "20/03/2025" },
                        { label: "Categoria sugerida", value: "Infraestrutura" },
                        { label: "Centro de custo", value: "Produto" },
                        { label: "Tipo", value: "Nota Fiscal de Serviço" },
                      ].map((f) => (
                        <div key={f.label}>
                          <p className="text-[10px] text-muted-foreground font-data uppercase tracking-wider">{f.label}</p>
                          <p className="text-sm font-data font-medium text-foreground">{f.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="gap-1"
                        onClick={() => {
                          setResultConfirmed(true);
                          toast({ title: "Lançamento confirmado!", description: "AWS Brasil — R$ 48.320,00 adicionado ao Contas a Pagar" });
                        }}
                      >
                        <Check className="w-4 h-4" /> Confirmar e Lançar
                      </Button>
                      <Button variant="outline" className="gap-1">
                        <Edit className="w-4 h-4" /> Editar
                      </Button>
                      <Button variant="ghost" className="gap-1 text-destructive hover:text-destructive">
                        <X className="w-4 h-4" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                )}

                {resultConfirmed && (
                  <div className="flex items-center justify-center gap-2 py-6 text-success">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-display font-semibold">Lançamento confirmado com sucesso!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── INBOX TAB ─── */}
        <TabsContent value="inbox" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por fornecedor ou arquivo..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Aguardando revisão">Aguardando revisão</SelectItem>
                    <SelectItem value="Confiança baixa">Confiança baixa</SelectItem>
                    <SelectItem value="Duplicata detectada!">Duplicata detectada</SelectItem>
                    <SelectItem value="Aprovado automaticamente">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-1 whitespace-nowrap" onClick={approveHighConfidence}>
                  <Sparkles className="w-3.5 h-3.5" /> Aprovar &gt; 95%
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-data">Arquivo</TableHead>
                    <TableHead className="font-data">Fornecedor</TableHead>
                    <TableHead className="font-data text-right">Valor</TableHead>
                    <TableHead className="font-data text-center">Confiança</TableHead>
                    <TableHead className="font-data">Data</TableHead>
                    <TableHead className="font-data">Status</TableHead>
                    <TableHead className="font-data">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc) => {
                    const cfg = statusConfig[doc.status] || statusConfig["Aguardando revisão"];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-data text-xs">{doc.file}</TableCell>
                        <TableCell className="font-data text-xs">{doc.supplier}</TableCell>
                        <TableCell className="font-data text-xs text-right font-medium">{fmtBRL(doc.value)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            doc.confidence >= 95 ? "text-success border-success/30" :
                            doc.confidence >= 85 ? "text-yellow-400 border-yellow-500/30" :
                            "text-destructive border-destructive/30"
                          )}>
                            {doc.confidence}%
                          </Badge>
                        </TableCell>
                        <TableCell className="font-data text-xs text-muted-foreground">{doc.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] gap-1", cfg.color)}>
                            <Icon className="w-3 h-3" />{doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Check className="w-3.5 h-3.5 text-success" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <X className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TEXTO LIVRE TAB ─── */}
        <TabsContent value="texto" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data flex items-center gap-2">
                <MessageSquareText className="w-4 h-4" /> Entrada via Texto Livre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground font-data">
                Cole qualquer descrição de despesa — a IA interpreta e estrutura os dados automaticamente.
              </p>
              <Textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Cole aqui qualquer descrição de despesa..."
                className="min-h-[100px] font-data text-sm"
              />
              <Button
                onClick={handleTextAI}
                disabled={textProcessing || !freeText.trim()}
                className="gap-2"
              >
                {textProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {textProcessing ? "Interpretando..." : "Interpretar com IA"}
              </Button>

              {textResult && (
                <div className="border border-primary/30 bg-primary/5 rounded-xl p-5 space-y-4 animate-slide-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-display font-semibold text-foreground">Dados Interpretados pela IA</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-auto">Confiança: 95%</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Valor", value: textResult.valor },
                      { label: "Categoria", value: textResult.categoria },
                      { label: "Centro de Custo", value: textResult.centro },
                      { label: "Data", value: textResult.data },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-[10px] text-muted-foreground font-data uppercase tracking-wider">{f.label}</p>
                        <p className="text-sm font-data font-medium text-foreground">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button className="gap-1" onClick={() => { setTextResult(null); setFreeText(""); toast({ title: "Lançamento confirmado!", description: `Combustível — ${textResult.valor}` }); }}>
                      <Check className="w-4 h-4" /> Confirmar e Lançar
                    </Button>
                    <Button variant="outline" className="gap-1"><Edit className="w-4 h-4" /> Editar</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── HISTÓRICO TAB ─── */}
        <TabsContent value="historico" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {[
              { label: "Capturas este mês", value: "247", accent: "text-primary" },
              { label: "Automáticas", value: "208 (84%)", accent: "text-success" },
              { label: "Manuais", value: "39 (16%)", accent: "text-muted-foreground" },
              { label: "Confiança média", value: "93,2%", accent: "text-primary" },
            ].map((s) => (
              <Card key={s.label} className="border-border/50 bg-card/80">
                <CardContent className="pt-3 pb-3 px-4">
                  <p className="text-[10px] text-muted-foreground font-data">{s.label}</p>
                  <p className={cn("text-lg font-bold font-data", s.accent)}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data flex items-center gap-2">
                <History className="w-4 h-4" /> Últimas Capturas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {captureHistory.map((entry) => {
                const Icon = entry.icon;
                return (
                  <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-data text-foreground truncate">{entry.desc}</p>
                        <Badge variant="outline" className="text-[9px] flex-shrink-0">{entry.source}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-data">{entry.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-data font-medium">{fmtBRL(entry.value)}</p>
                      <p className={cn(
                        "text-[10px] font-data",
                        entry.confidence >= 95 ? "text-success" : entry.confidence >= 85 ? "text-yellow-400" : "text-destructive"
                      )}>
                        {entry.confidence}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
