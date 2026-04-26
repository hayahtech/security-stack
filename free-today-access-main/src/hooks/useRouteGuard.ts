import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { toast } from '@/hooks/use-toast';

/**
 * Hook that checks if current user has permission to access the current route.
 * Redirects to dashboard with a toast if not authorized.
 */
export function useRouteGuard() {
  const { hasPermission, loading } = useRestaurant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!hasPermission(location.pathname)) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta área.',
        variant: 'destructive',
      });
      navigate('/', { replace: true });
    }
  }, [location.pathname, hasPermission, loading, navigate]);
}
