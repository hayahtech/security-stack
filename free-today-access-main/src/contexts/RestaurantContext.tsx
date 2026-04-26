import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type MemberRole = 'dono' | 'gerente' | 'caixa' | 'cozinha' | 'contador' | 'entregador';

interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
}

interface Membership {
  id: string;
  restaurant_id: string;
  role: MemberRole;
  status: string;
  restaurant?: Restaurant;
}

interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  currentRole: MemberRole | null;
  memberships: Membership[];
  loading: boolean;
  switchRestaurant: (id: string) => void;
  hasPermission: (route: string) => boolean;
  allowedRoutes: string[];
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// Permission map per role
const rolePermissions: Record<MemberRole, string[]> = {
  dono: ['*'], // all access
  gerente: [
    '/', '/vendas', '/caixa', '/mesas', '/reservas', '/delivery', '/cardapio', '/fichas-tecnicas',
    '/desempenho', '/clientes', '/clientes/:id', '/fidelidade', '/avaliacoes',
    '/zonas-entrega', '/receitas', '/despesas-operacionais', '/despesas-fixas',
    '/taxas', '/marketing', '/emprestimos', '/estoque', '/estoque/entrada',
    '/estoque/inventario', '/previsao-demanda', '/fornecedores', '/funcionarios', '/ponto',
    '/equipamentos', '/equipamentos/:id', '/cmv', '/fluxo-de-caixa', '/balanco',
    '/sanitario', '/relatorios', '/notificacoes', '/instalar', '/configuracoes/equipe', '/auditoria', '/contas', '/centro-custos', '/orcamento', '/conciliacao',
  ],
  caixa: [
    '/', '/vendas', '/caixa', '/mesas', '/reservas', '/clientes', '/clientes/:id', '/fidelidade',
    '/cardapio', '/instalar',
  ],
  cozinha: [
    '/', '/delivery', '/mesas', '/instalar',
  ],
  contador: [
    '/', '/relatorios', '/fluxo-de-caixa', '/balanco', '/cmv', '/centro-custos', '/orcamento', '/conciliacao', '/despesas-operacionais',
    '/despesas-fixas', '/taxas', '/receitas', '/emprestimos', '/instalar',
  ],
  entregador: [
    '/', '/delivery', '/instalar',
  ],
};

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [currentRole, setCurrentRole] = useState<MemberRole | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMemberships = useCallback(async () => {
    if (!user) { setLoading(false); setMemberships([]); setCurrentRestaurant(null); setCurrentRole(null); return; }

    // Load restaurants where user is owner
    const { data: ownedRestaurants } = await (supabase as any)
      .from('restaurants').select('*').eq('owner_id', user.id);

    // Load memberships
    const { data: memberData } = await (supabase as any)
      .from('restaurant_members').select('*, restaurants(*)').eq('user_id', user.id).eq('status', 'ativo');

    const allMemberships: Membership[] = [];

    // Add owner memberships
    ownedRestaurants?.forEach((r: any) => {
      allMemberships.push({
        id: `owner-${r.id}`,
        restaurant_id: r.id,
        role: 'dono',
        status: 'ativo',
        restaurant: r,
      });
    });

    // Add member memberships (avoid duplicates with owned)
    memberData?.forEach((m: any) => {
      if (!allMemberships.find(am => am.restaurant_id === m.restaurant_id)) {
        allMemberships.push({
          id: m.id,
          restaurant_id: m.restaurant_id,
          role: m.role as MemberRole,
          status: m.status,
          restaurant: m.restaurants,
        });
      }
    });

    setMemberships(allMemberships);

    // Set current restaurant from localStorage or first available
    const savedId = localStorage.getItem('current_restaurant_id');
    const saved = allMemberships.find(m => m.restaurant_id === savedId);
    const active = saved || allMemberships[0];

    if (active) {
      setCurrentRestaurant(active.restaurant || null);
      setCurrentRole(active.role);
    } else {
      setCurrentRestaurant(null);
      setCurrentRole(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { loadMemberships(); }, [loadMemberships]);

  const switchRestaurant = (id: string) => {
    const m = memberships.find(m => m.restaurant_id === id);
    if (m) {
      setCurrentRestaurant(m.restaurant || null);
      setCurrentRole(m.role);
      localStorage.setItem('current_restaurant_id', id);
    }
  };

  const hasPermission = (route: string): boolean => {
    if (!currentRole) return true; // no restaurant = legacy mode, allow all
    const perms = rolePermissions[currentRole];
    if (perms.includes('*')) return true;
    // Check exact or pattern match
    return perms.some(p => {
      if (p === route) return true;
      if (p.includes(':')) {
        const base = p.split('/:')[0];
        return route.startsWith(base + '/');
      }
      return false;
    });
  };

  const allowedRoutes = currentRole
    ? (rolePermissions[currentRole].includes('*') ? ['*'] : rolePermissions[currentRole])
    : ['*'];

  return (
    <RestaurantContext.Provider value={{ currentRestaurant, currentRole, memberships, loading, switchRestaurant, hasPermission, allowedRoutes }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurant must be used within RestaurantProvider');
  return ctx;
}

export { rolePermissions };
export type { MemberRole, Restaurant, Membership };
