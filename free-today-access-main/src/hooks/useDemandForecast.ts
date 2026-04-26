import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format } from 'date-fns';

export interface DemandItem {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  minStock: number;
  avgDailyConsumption: number;
  weeklyConsumption: number;
  suggestedPurchase: number;
  daysUntilStockout: number | null;
  supplierId: string | null;
  supplierName: string | null;
  costPrice: number;
  estimatedCost: number;
}

export function useDemandForecast(periodDays: number = 30, daysUntilNextPurchase: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['demand_forecast', user?.id, periodDays, daysUntilNextPurchase],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), periodDays), 'yyyy-MM-dd');

      // Fetch all needed data in parallel
      const [salesRes, saleItemsRes, recipesRes, ingredientsRes, productsRes, suppliersRes] = await Promise.all([
        supabase.from('sales').select('id, date, status').gte('date', startDate).eq('status', 'fechado'),
        supabase.from('sale_items').select('sale_id, menu_item_id, quantity'),
        supabase.from('recipes').select('id, menu_item_id, yield_quantity'),
        supabase.from('recipe_ingredients').select('recipe_id, product_id, quantity, unit, waste_percentage'),
        supabase.from('products').select('id, name, unit, quantity_current, quantity_min, cost_price, supplier_id'),
        supabase.from('suppliers').select('id, name'),
      ]);

      const sales = salesRes.data || [];
      const saleItems = saleItemsRes.data || [];
      const recipes = recipesRes.data || [];
      const ingredients = ingredientsRes.data || [];
      const products = productsRes.data || [];
      const suppliers = suppliersRes.data || [];

      const saleIds = new Set(sales.map(s => s.id));
      const filteredItems = saleItems.filter(si => saleIds.has(si.sale_id));

      // Count total quantity sold per menu_item
      const menuItemSold: Record<string, number> = {};
      filteredItems.forEach(si => {
        menuItemSold[si.menu_item_id] = (menuItemSold[si.menu_item_id] || 0) + si.quantity;
      });

      // Map menu_item -> recipe -> ingredients consumed
      const recipeByMenuItem: Record<string, typeof recipes[0]> = {};
      recipes.forEach(r => { recipeByMenuItem[r.menu_item_id] = r; });

      const ingredientsByRecipe: Record<string, typeof ingredients> = {};
      ingredients.forEach(ing => {
        if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = [];
        ingredientsByRecipe[ing.recipe_id].push(ing);
      });

      // Calculate total consumption per product
      const productConsumption: Record<string, number> = {};
      Object.entries(menuItemSold).forEach(([menuItemId, qtySold]) => {
        const recipe = recipeByMenuItem[menuItemId];
        if (!recipe) return;
        const recipeIngredients = ingredientsByRecipe[recipe.id] || [];
        const yieldQty = recipe.yield_quantity || 1;

        recipeIngredients.forEach(ing => {
          const wasteFactor = 1 + (ing.waste_percentage || 0) / 100;
          const consumedPerUnit = (ing.quantity / yieldQty) * wasteFactor;
          const totalConsumed = consumedPerUnit * qtySold;
          productConsumption[ing.product_id] = (productConsumption[ing.product_id] || 0) + totalConsumed;
        });
      });

      // Build demand items
      const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

      const demandItems: DemandItem[] = products.map(p => {
        const totalConsumed = productConsumption[p.id] || 0;
        const avgDaily = totalConsumed / periodDays;
        const weekly = avgDaily * 7;
        const neededForPeriod = avgDaily * daysUntilNextPurchase;
        const suggested = Math.max(0, Math.ceil(neededForPeriod - p.quantity_current + p.quantity_min));
        const daysUntilStockout = avgDaily > 0 ? Math.floor(p.quantity_current / avgDaily) : null;

        return {
          productId: p.id,
          productName: p.name,
          unit: p.unit,
          currentStock: p.quantity_current,
          minStock: p.quantity_min,
          avgDailyConsumption: avgDaily,
          weeklyConsumption: weekly,
          suggestedPurchase: suggested,
          daysUntilStockout,
          supplierId: p.supplier_id,
          supplierName: p.supplier_id ? supplierMap.get(p.supplier_id) || null : null,
          costPrice: p.cost_price,
          estimatedCost: suggested * p.cost_price,
        };
      });

      // Sort: items needing purchase first, then by days until stockout
      demandItems.sort((a, b) => {
        if (a.suggestedPurchase > 0 && b.suggestedPurchase === 0) return -1;
        if (a.suggestedPurchase === 0 && b.suggestedPurchase > 0) return 1;
        if (a.daysUntilStockout !== null && b.daysUntilStockout !== null) return a.daysUntilStockout - b.daysUntilStockout;
        if (a.daysUntilStockout !== null) return -1;
        return 0;
      });

      const totalEstimatedCost = demandItems.reduce((sum, d) => sum + d.estimatedCost, 0);
      const itemsNeedingPurchase = demandItems.filter(d => d.suggestedPurchase > 0);
      const criticalItems = demandItems.filter(d => d.daysUntilStockout !== null && d.daysUntilStockout <= 3);

      return { demandItems, totalEstimatedCost, itemsNeedingPurchase, criticalItems, periodDays };
    },
    enabled: !!user,
  });
}
