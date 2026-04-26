import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Sparkles } from 'lucide-react';

const categoryLabels: Record<string, { label: string; emoji: string }> = {
  pizza: { label: 'Pizzas', emoji: '🍕' },
  bebida: { label: 'Bebidas', emoji: '🥤' },
  sobremesa: { label: 'Sobremesas', emoji: '🍰' },
  outro: { label: 'Outros', emoji: '📦' },
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      // Find profile by slug
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, store_slug')
        .eq('store_slug', slug)
        .single();

      if (!profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStoreName(profile.full_name || 'Cardápio');

      // Fetch active menu items, promotions, and reviews in parallel
      const [menuRes, promoRes, reviewRes] = await Promise.all([
        supabase.from('menu_items').select('*').eq('user_id', profile.id).eq('active', true).order('category').order('name'),
        supabase.from('daily_promotions').select('*').eq('user_id', profile.id).eq('active', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('reviews').select('rating').eq('user_id', profile.id),
      ]);

      setItems(menuRes.data || []);
      setPromotions(promoRes.data || []);

      if (reviewRes.data && reviewRes.data.length > 0) {
        const sum = reviewRes.data.reduce((a, r) => a + r.rating, 0);
        setAvgRating(sum / reviewRes.data.length);
        setReviewCount(reviewRes.data.length);
      }

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 p-4">
        <div className="max-w-lg mx-auto space-y-4 pt-8">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-6xl">🍕</p>
          <h1 className="text-2xl font-bold text-gray-800">Cardápio não encontrado</h1>
          <p className="text-gray-500">Verifique o link e tente novamente</p>
        </div>
      </div>
    );
  }

  const grouped = items.reduce((acc: Record<string, any[]>, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categoryOrder = ['pizza', 'bebida', 'sobremesa', 'outro'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 pt-8 pb-10 rounded-b-[2rem] shadow-lg">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Nunito' }}>
            {storeName}
          </h1>
          {avgRating !== null && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-300 text-yellow-300' : 'text-white/40'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-white/70">({reviewCount} avaliações)</span>
            </div>
          )}
          <p className="text-white/80 text-sm mt-1 flex items-center justify-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Cardápio Digital
          </p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 -mt-5 pb-12 space-y-5">
        {/* Promotions */}
        {promotions.length > 0 && (
          <div className="space-y-3">
            {promotions.map(promo => (
              <div key={promo.id} className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 shadow-md text-white">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">{promo.title}</p>
                    {promo.description && <p className="text-xs text-white/90 mt-0.5">{promo.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Categories */}
        {categoryOrder.filter(cat => grouped[cat]?.length).map(cat => {
          const info = categoryLabels[cat] || { label: cat, emoji: '📋' };
          return (
            <section key={cat}>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Nunito' }}>
                <span className="text-2xl">{info.emoji}</span> {info.label}
              </h2>
              <div className="space-y-3">
                {grouped[cat].map((item: any) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden flex">
                    {item.image_url && (
                      <div className="w-24 h-24 shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <p className="text-base font-extrabold text-red-600 mt-1">
                        {formatCurrency(Number(item.sale_price))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🍽️</p>
            <p className="text-sm">Nenhum item disponível no momento</p>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-6 text-xs text-gray-400">
          <p>Feito com ❤️ pelo PizzaFlow</p>
        </footer>
      </div>
    </div>
  );
}
