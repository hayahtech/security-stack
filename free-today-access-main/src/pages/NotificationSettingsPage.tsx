import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Phone, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('notification_phone, notification_email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPhone(data.notification_phone || '');
          setEmail(data.notification_email || '');
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_phone: phone || null,
        notification_email: email || null,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações de notificação salvas!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Configurações de Notificação
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure como deseja receber os alertas automáticos do PizzaFlow
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-green-500" />
              WhatsApp
            </CardTitle>
            <CardDescription>
              Receba alertas críticos e avisos diretamente no seu WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Número com DDD e código do país</Label>
              <Input
                id="phone"
                placeholder="5511999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ex: 5511999999999 (Brasil + DDD + número)
              </p>
            </div>
            {phone && (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-500" />
              E-mail
            </CardTitle>
            <CardDescription>
              Receba um resumo dos alertas por e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail para notificações</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {email && (
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tipos de alerta notificados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Estoque crítico', emoji: '📦', severity: 'Crítico' },
              { label: 'Contas vencendo', emoji: '💳', severity: 'Aviso' },
              { label: 'Aniversário de cliente', emoji: '🎂', severity: 'Info' },
              { label: 'Parcelas de empréstimo', emoji: '🏦', severity: 'Aviso' },
              { label: 'Temperatura crítica', emoji: '❄️', severity: 'Crítico' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.severity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
