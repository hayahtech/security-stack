import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pizza, Building2, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Register() {
  const { signUp } = useAuth();
  const [tab, setTab] = useState<'create' | 'invite'>('create');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar o cadastro.' });

    // After signup, if creating restaurant, we'll create it when user logs in for the first time
    // Store intent in localStorage
    if (tab === 'create' && restaurantName) {
      localStorage.setItem('pending_restaurant_name', restaurantName);
    }
    if (tab === 'invite' && inviteCode) {
      localStorage.setItem('pending_invite_code', inviteCode);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Pizza className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl" style={{ fontFamily: 'Nunito' }}>Criar Conta</CardTitle>
          <CardDescription>Comece a gerenciar sua pizzaria</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={v => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="create" className="flex items-center gap-1"><Building2 className="h-4 w-4" />Criar Restaurante</TabsTrigger>
              <TabsTrigger value="invite" className="flex items-center gap-1"><UserPlus className="h-4 w-4" />Entrar com Convite</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Seu nome" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
              </div>

              <TabsContent value="create" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="restaurant">Nome do Restaurante</Label>
                  <Input id="restaurant" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="Minha Pizzaria" />
                </div>
              </TabsContent>

              <TabsContent value="invite" className="mt-0 space-y-4">
                <div>
                  <Label htmlFor="invite">Código do Convite</Label>
                  <Input id="invite" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Cole o código recebido por email" />
                  <p className="text-xs text-muted-foreground mt-1">Use o código enviado pelo dono do restaurante</p>
                </div>
              </TabsContent>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </Tabs>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
