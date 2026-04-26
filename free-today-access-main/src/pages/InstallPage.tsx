import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Wifi, WifiOff, Bell, CheckCircle2, Share, ArrowDown } from 'lucide-react';

export default function InstallPage() {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          Instalar PizzaFlow
        </h1>
        <p className="text-muted-foreground mt-1">
          Instale o PizzaFlow no seu celular para acesso rápido
        </p>
      </div>

      {isInstalled ? (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold">App já instalado!</h2>
              <p className="text-muted-foreground">
                O PizzaFlow já está instalado no seu dispositivo. Procure o ícone na sua tela inicial.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {canInstall && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Download className="h-16 w-16 text-primary mx-auto" />
                  <h2 className="text-xl font-bold">Pronto para instalar!</h2>
                  <p className="text-muted-foreground">
                    Clique no botão abaixo para instalar o PizzaFlow no seu dispositivo.
                  </p>
                  <Button size="lg" onClick={install} className="text-lg px-8 py-6">
                    <Download className="h-5 w-5 mr-2" />
                    Instalar PizzaFlow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isIOS && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como instalar no iPhone/iPad</CardTitle>
                <CardDescription>Siga os passos abaixo para adicionar à tela inicial</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Toque no ícone de compartilhar</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Share className="h-4 w-4" /> No Safari, toque no ícone de compartilhar (quadrado com seta para cima)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Role para baixo e toque em "Adicionar à Tela de Início"</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <ArrowDown className="h-4 w-4" /> Procure a opção na lista de ações
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium">Toque em "Adicionar"</p>
                    <p className="text-sm text-muted-foreground">O PizzaFlow aparecerá como um app na sua tela inicial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!canInstall && !isIOS && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como instalar no Android</CardTitle>
                <CardDescription>Use o Chrome para a melhor experiência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Abra o menu do navegador</p>
                    <p className="text-sm text-muted-foreground">Toque nos 3 pontinhos no canto superior direito</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <WifiOff className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-semibold">Funciona Offline</h3>
            <p className="text-sm text-muted-foreground">Visualize dados cacheados mesmo sem internet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Smartphone className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-semibold">Como um App Nativo</h3>
            <p className="text-sm text-muted-foreground">Tela cheia, sem barra do navegador</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Bell className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-semibold">Alertas Rápidos</h3>
            <p className="text-sm text-muted-foreground">Acesso rápido aos seus alertas e notificações</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
