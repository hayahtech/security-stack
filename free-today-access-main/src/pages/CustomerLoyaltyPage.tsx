import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QRCodeSVG } from 'qrcode.react';
import { Gift, Star, Ticket, ShoppingBag } from 'lucide-react';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CustomerLoyaltyPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-customer', token],
    queryFn: async () => {
      // Get customer by qr_token
      const { data: customer, error: cErr } = await supabase
        .from('customers')
        .select('id, name, user_id, qr_token')
        .eq('qr_token', token!)
        .single();
      if (cErr || !customer) throw new Error('Cliente não encontrado.');

      // Get active loyalty programs
      const { data: programs } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('user_id', customer.user_id)
        .eq('active', true);

      // Get loyalty points
      const { data: points } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get active coupons
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('active', true)
        .gte('valid_until', new Date().toISOString().split('T')[0]);

      // Get last 5 sales
      const { data: sales } = await supabase
        .from('sales')
        .select('id, date, total_amount, channel, payment_method')
        .eq('customer_id', customer.id)
        .eq('status', 'fechado')
        .order('date', { ascending: false })
        .limit(5);

      // Calculate balance
      const balance = (points || []).reduce((sum, p) => {
        if (p.type === 'earn') return sum + p.points;
        if (p.type === 'redeem') return sum - Math.abs(p.points);
        return sum;
      }, 0);

      return { customer, programs: programs || [], balance, coupons: coupons || [], sales: sales || [], points: points || [] };
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Cliente não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, programs, balance, coupons, sales } = data;
  const mainProgram = programs[0];
  const progressPercent = mainProgram ? Math.min((balance / mainProgram.points_required) * 100, 100) : 0;
  const pointsToNext = mainProgram ? Math.max(mainProgram.points_required - balance, 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-xl font-bold">🍕 Cartão Fidelidade</h1>
          <p className="text-lg font-semibold mt-2">{customer.name}</p>
        </div>

        {/* Points card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="py-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-6 w-6 text-primary fill-primary" />
              <span className="text-3xl font-bold">{balance}</span>
              <span className="text-sm text-muted-foreground">pontos</span>
            </div>
            {mainProgram && (
              <>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {pointsToNext > 0
                    ? `Faltam ${pointsToNext} pontos para a próxima recompensa`
                    : '🎉 Você pode resgatar uma recompensa!'
                  }
                </p>
                {mainProgram.reward_type && (
                  <Badge variant="secondary">
                    <Gift className="h-3 w-3 mr-1" />
                    Prêmio: {mainProgram.reward_type === 'desconto_fixo' ? formatCurrency(mainProgram.reward_value) : `${mainProgram.reward_value}%`} de desconto
                  </Badge>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Active coupons */}
        {coupons.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4" /> Cupons ativos ({coupons.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {coupons.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-mono font-bold text-sm">{c.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.discount_type === 'fixo' ? formatCurrency(c.discount_value) : `${c.discount_value}%`} de desconto
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Até {new Date(c.valid_until).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent orders */}
        {sales.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Últimos pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sales.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                  <span className="font-medium">{formatCurrency(s.total_amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* QR Code */}
        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">Apresente este QR Code no caixa</p>
            <QRCodeSVG value={`${window.location.origin}/cliente/${token}`} size={160} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
