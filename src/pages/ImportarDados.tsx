import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  FileText, Users, Building2, Wallet, CreditCard, HelpCircle,
} from "lucide-react";
import { importHistory, importTypes, migrationSystems, validationErrors } from "@/mock/importData";
import { cn } from "@/lib/utils";

export default function ImportarDados() {
  const [selectedType, setSelectedType] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "validating" | "importing" | "done">("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState("");

  const simulateUpload = () => {
    setShowValidation(true);
  };

  const simulateImport = () => {
    setUploadState("importing");
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState("done");
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Importar Dados</h1>
        <p className="text-muted-foreground font-data text-sm">Configurações → Dados • Importe e migre seus dados financeiros</p>
      </div>

      <Tabs defaultValue="planilha" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="planilha" className="font-data text-xs">📊 Via Planilha</TabsTrigger>
          <TabsTrigger value="migracao" className="font-data text-xs">🔄 Migração de Sistemas</TabsTrigger>
          <TabsTrigger value="historico" className="font-data text-xs">📋 Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="planilha" className="space-y-4">
          {/* Step 1 */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-data">1. Escolha o que importar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {importTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedType(t.id); setShowValidation(false); setUploadState("idle"); }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      selectedType === t.id ? "border-primary bg-primary/10" : "border-border bg-card/50 hover:border-primary/30"
                    )}
                  >
                    <span className="text-2xl block mb-1">{t.icon}</span>
                    <span className="text-xs font-data text-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedType && (
            <>
              {/* Step 2 - Template */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-data">2. Baixe o template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-data text-foreground">template_{selectedType}.xlsx</p>
                        <p className="text-[10px] text-muted-foreground">
                          Colunas: {importTypes.find((t) => t.id === selectedType)?.columns.join(" • ")}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1 text-xs">
                      <Download className="w-3 h-3" /> Baixar template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 - Upload */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-data">3. Upload do arquivo preenchido</CardTitle>
                </CardHeader>
                <CardContent>
                  {uploadState === "idle" && !showValidation && (
                    <div
                      onClick={simulateUpload}
                      className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                    >
                      <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-data text-foreground">Arraste o arquivo aqui ou clique para selecionar</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Aceita .xlsx, .xls, .csv — Máx. 10MB</p>
                    </div>
                  )}

                  {showValidation && uploadState === "idle" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-sm font-data font-semibold text-success">832 válidos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-data font-semibold text-yellow-500">14 com erro</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-data font-semibold text-destructive">3 duplicatas</span>
                        </div>
                      </div>

                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow><TableHead className="text-xs">Linha</TableHead><TableHead className="text-xs">Campo</TableHead><TableHead className="text-xs">Valor</TableHead><TableHead className="text-xs">Erro</TableHead></TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationErrors.map((e, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs font-data">{e.line}</TableCell>
                                <TableCell className="text-xs font-data">{e.field}</TableCell>
                                <TableCell className="text-xs font-data text-destructive">{e.value || "(vazio)"}</TableCell>
                                <TableCell className="text-xs font-data">{e.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowValidation(false)}>Corrigir e reimportar</Button>
                        <Button size="sm" className="text-xs" onClick={simulateImport}>Importar apenas os válidos (832)</Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setShowValidation(false); setSelectedType(""); }}>Cancelar</Button>
                      </div>
                    </div>
                  )}

                  {uploadState === "importing" && (
                    <div className="space-y-3 p-4">
                      <p className="text-sm font-data text-foreground">Importando 832 lançamentos...</p>
                      <Progress value={importProgress} className="h-3" />
                      <p className="text-xs text-muted-foreground font-data">{importProgress}% concluído</p>
                    </div>
                  )}

                  {uploadState === "done" && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                      <p className="text-sm font-data font-semibold text-success">832 lançamentos importados com sucesso!</p>
                      <p className="text-xs text-muted-foreground">14 registros ignorados (ver relatório)</p>
                      <Button size="sm" variant="outline" className="text-xs mt-2" onClick={() => { setUploadState("idle"); setShowValidation(false); setSelectedType(""); }}>Nova importação</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="migracao" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {migrationSystems.map((sys) => (
              <Card key={sys.id} className={cn("border-border/50 bg-card/80 cursor-pointer transition-all hover:border-primary/30", selectedSystem === sys.id && "border-primary")}>
                <CardContent className="p-4" onClick={() => setSelectedSystem(selectedSystem === sys.id ? "" : sys.id)}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{sys.icon}</span>
                    <h3 className="font-data font-semibold text-sm text-foreground">{sys.name}</h3>
                  </div>
                  {selectedSystem === sys.id && (
                    <div className="space-y-2 mt-3 border-t border-border pt-3">
                      <p className="text-xs font-data text-muted-foreground font-semibold">Passo a passo:</p>
                      {sys.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-primary font-data">{i + 1}.</span>
                          <span className="text-xs font-data text-foreground">{step}</span>
                        </div>
                      ))}
                      <Button size="sm" className="w-full mt-2 text-xs gap-1">
                        Iniciar migração <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Column Mapping Assistant placeholder */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-data flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" /> Assistente de Mapeamento de Colunas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-data font-semibold text-muted-foreground mb-3">COLUNAS DA SUA PLANILHA</p>
                  {["dt_venc", "vlr_total", "nm_cliente", "nr_doc", "obs"].map((col) => (
                    <div key={col} className="p-2 mb-1 rounded bg-card border border-border text-xs font-data cursor-grab">{col}</div>
                  ))}
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-data font-semibold text-primary mb-3">CAMPOS DO FINANCEOS</p>
                  {["Data de vencimento", "Valor", "Cliente", "Documento", "Observações"].map((col) => (
                    <div key={col} className="p-2 mb-1 rounded bg-card border border-primary/30 text-xs font-data">{col}</div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center font-data">Arraste as colunas da esquerda para os campos correspondentes à direita</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-data">Histórico de Importações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Arquivo</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs text-right">Registros</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importHistory.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-data">{r.date}</TableCell>
                      <TableCell className="text-xs font-data flex items-center gap-1"><FileSpreadsheet className="w-3 h-3 text-success" /> {r.fileName}</TableCell>
                      <TableCell className="text-xs font-data">{r.type}</TableCell>
                      <TableCell className="text-xs font-data text-right">{r.records.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "success" ? "default" : "destructive"} className={cn("text-[10px]", r.status === "success" && "bg-success/20 text-success border-success/30")}>
                          {r.status === "success" ? `✅ Sucesso` : `⚠️ ${r.errors} erros`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
