import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface CMVData {
  cmvTotal: number;
  revenueTotal: number;
  cmvPercent: number;
  cmvGoal: number;
  previousCmvPercent: number;
  variation: number;
  byCategory: CategoryCMV[];
  byProduct: ProductCMV[];
  monthlyHistory: MonthlyPoint[];
  wasteAnalysis: WasteItem[];
  projection: ProjectionData;
}

export interface CategoryCMV {
  category: string;
  qtySold: number;
  costTotal: number;
  revenueTotal: number;
  cmvPercent: number;
  marginPercent: number;
}

export interface ProductCMV {
  menuItemId: string;
  name: string;
  qtySold: number;
  costUnit: number;
  costTotal: number;
  salePrice: number;
  marginValue: number;
  marginPercent: number;
  hasRecipe: boolean;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  cmvValue: number;
  cmvPercent: number;
  revenue: number;
}

export interface WasteItem {
  productId: string;
  name: string;
  wastePercent: number;
  wasteCost: number;
  impactOnCmv: number;
}

export interface ProjectionData {
  projectedRevenue: number;
  projectedCmv: number;
  projectedCmvPercent: number;
  projectedMargin: number;
}

function calcPeriodCMV(
  sales: any[],
  saleItems: any[],
  recipes: any[],
  ingredients: any[],
  menuItems: any[],
  products: any[],
  startDate: string,
  endDate: string,
) {
  const periodSales = sales.filter(s => s.date >= startDate && s.date <= endDate && s.status === 'fechado');
  const saleIds = new Set(periodSales.map(s => s.id));
  const periodItems = saleItems.filter(si => saleIds.has(si.sale_id));

  const recipeByMenuItem: Record<string, any> = {};
  recipes.forEach(r => { recipeByMenuItem[r.menu_item_id] = r; });

  const ingredientsByRecipe: Record<string, any[]> = {};
  ingredients.forEach(ing => {
    if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = [];
    ingredientsByRecipe[ing.recipe_id].push(ing);
  });

  const productMap = new Map(products.map((p: any) => [p.id, p]));
  const menuItemMap = new Map(menuItems.map((m: any) => [m.id, m]));

  let cmvTotal = 0;
  let revenueTotal = 0;

  const categoryAgg: Record<string, { qtySold: number; cost: number; revenue: number }> = {};
  const productAgg: Record<string, { qtySold: number; costTotal: number; costUnit: number; salePrice: number; name: string; hasRecipe: boolean }> = {};

  periodItems.forEach(si => {
    const menuItem = menuItemMap.get(si.menu_item_id);
    if (!menuItem) return;

    const qty = si.quantity;
    const itemRevenue = si.subtotal || (si.unit_price * qty);
    revenueTotal += itemRevenue;

    const recipe = recipeByMenuItem[si.menu_item_id];
    let itemCost = 0;

    if (recipe) {
      const recipeIngs = ingredientsByRecipe[recipe.id] || [];
      const yld = recipe.yield_quantity || 1;
      recipeIngs.forEach((ing: any) => {
        const product = productMap.get(ing.product_id);
        if (!product) return;
        const wasteFactor = 1 + (ing.waste_percentage || 0) / 100;
        const costPerUnit = (ing.quantity / yld) * wasteFactor * Number(product.cost_price);
        itemCost += costPerUnit;
      });
    } else {
      itemCost = Number(menuItem.cost_price);
    }

    const totalItemCost = itemCost * qty;
    cmvTotal += totalItemCost;

    // Category aggregation
    const cat = menuItem.category || 'outro';
    if (!categoryAgg[cat]) categoryAgg[cat] = { qtySold: 0, cost: 0, revenue: 0 };
    categoryAgg[cat].qtySold += qty;
    categoryAgg[cat].cost += totalItemCost;
    categoryAgg[cat].revenue += itemRevenue;

    // Product aggregation
    if (!productAgg[si.menu_item_id]) {
      productAgg[si.menu_item_id] = { qtySold: 0, costTotal: 0, costUnit: itemCost, salePrice: Number(menuItem.sale_price), name: menuItem.name, hasRecipe: !!recipe };
    }
    productAgg[si.menu_item_id].qtySold += qty;
    productAgg[si.menu_item_id].costTotal += totalItemCost;
  });

  return { cmvTotal, revenueTotal, categoryAgg, productAgg };
}

export function useCMV(startDate: Date, endDate: Date, cmvGoal: number = 35) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cmv', user?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), cmvGoal],
    queryFn: async (): Promise<CMVData> => {
      // Fetch all data in parallel
      const [salesRes, saleItemsRes, recipesRes, ingredientsRes, menuItemsRes, productsRes] = await Promise.all([
        supabase.from('sales').select('id, date, status, total_amount'),
        supabase.from('sale_items').select('sale_id, menu_item_id, quantity, unit_price, subtotal'),
        supabase.from('recipes').select('id, menu_item_id, yield_quantity'),
        supabase.from('recipe_ingredients').select('recipe_id, product_id, quantity, unit, waste_percentage'),
        supabase.from('menu_items').select('id, name, category, sale_price, cost_price'),
        supabase.from('products').select('id, name, cost_price, unit'),
      ]);

      const sales = salesRes.data || [];
      const saleItems = saleItemsRes.data || [];
      const recipes = recipesRes.data || [];
      const ingredients = ingredientsRes.data || [];
      const menuItems = menuItemsRes.data || [];
      const products = productsRes.data || [];

      const sd = format(startDate, 'yyyy-MM-dd');
      const ed = format(endDate, 'yyyy-MM-dd');

      // Current period
      const current = calcPeriodCMV(sales, saleItems, recipes, ingredients, menuItems, products, sd, ed);
      const cmvPercent = current.revenueTotal > 0 ? (current.cmvTotal / current.revenueTotal) * 100 : 0;

      // Previous period
      const prevStart = format(subMonths(startDate, 1), 'yyyy-MM-dd');
      const prevEnd = format(subMonths(endDate, 1), 'yyyy-MM-dd');
      const prev = calcPeriodCMV(sales, saleItems, recipes, ingredients, menuItems, products, prevStart, prevEnd);
      const previousCmvPercent = prev.revenueTotal > 0 ? (prev.cmvTotal / prev.revenueTotal) * 100 : 0;
      const variation = cmvPercent - previousCmvPercent;

      // By category
      const categoryLabels: Record<string, string> = { pizza: 'Pizza', bebida: 'Bebida', sobremesa: 'Sobremesa', outro: 'Outro' };
      const byCategory: CategoryCMV[] = Object.entries(current.categoryAgg)
        .map(([cat, d]) => ({
          category: categoryLabels[cat] || cat,
          qtySold: d.qtySold,
          costTotal: d.cost,
          revenueTotal: d.revenue,
          cmvPercent: d.revenue > 0 ? (d.cost / d.revenue) * 100 : 0,
          marginPercent: d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0,
        }))
        .sort((a, b) => b.cmvPercent - a.cmvPercent);

      // By product (top 20)
      const byProduct: ProductCMV[] = Object.entries(current.productAgg)
        .map(([id, d]) => ({
          menuItemId: id,
          name: d.name,
          qtySold: d.qtySold,
          costUnit: d.costUnit,
          costTotal: d.costTotal,
          salePrice: d.salePrice,
          marginValue: (d.salePrice - d.costUnit) * d.qtySold,
          marginPercent: d.salePrice > 0 ? ((d.salePrice - d.costUnit) / d.salePrice) * 100 : 0,
          hasRecipe: d.hasRecipe,
        }))
        .sort((a, b) => b.costTotal - a.costTotal)
        .slice(0, 20);

      // Monthly history (12 months)
      const monthlyHistory: MonthlyPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const mStart = startOfMonth(subMonths(new Date(), i));
        const mEnd = endOfMonth(subMonths(new Date(), i));
        const m = calcPeriodCMV(sales, saleItems, recipes, ingredients, menuItems, products, format(mStart, 'yyyy-MM-dd'), format(mEnd, 'yyyy-MM-dd'));
        monthlyHistory.push({
          month: format(mStart, 'yyyy-MM'),
          label: format(mStart, 'MMM/yy'),
          cmvValue: m.cmvTotal,
          cmvPercent: m.revenueTotal > 0 ? (m.cmvTotal / m.revenueTotal) * 100 : 0,
          revenue: m.revenueTotal,
        });
      }

      // Waste analysis
      const productMap = new Map(products.map(p => [p.id, p]));
      const recipeByMenuItem: Record<string, any> = {};
      recipes.forEach(r => { recipeByMenuItem[r.menu_item_id] = r; });
      const ingredientsByRecipe: Record<string, any[]> = {};
      ingredients.forEach(ing => {
        if (!ingredientsByRecipe[ing.recipe_id]) ingredientsByRecipe[ing.recipe_id] = [];
        ingredientsByRecipe[ing.recipe_id].push(ing);
      });

      const wasteByProduct: Record<string, { name: string; wastePercent: number; wasteCost: number; totalCost: number }> = {};
      const periodSales = sales.filter(s => s.date >= sd && s.date <= ed && s.status === 'fechado');
      const saleIds = new Set(periodSales.map(s => s.id));
      const periodItems = saleItems.filter(si => saleIds.has(si.sale_id));

      periodItems.forEach(si => {
        const recipe = recipeByMenuItem[si.menu_item_id];
        if (!recipe) return;
        const recipeIngs = ingredientsByRecipe[recipe.id] || [];
        const yld = recipe.yield_quantity || 1;
        recipeIngs.forEach((ing: any) => {
          const product = productMap.get(ing.product_id);
          if (!product) return;
          const wp = ing.waste_percentage || 0;
          if (wp <= 0) return;
          const baseCost = (ing.quantity / yld) * Number(product.cost_price) * si.quantity;
          const wasteCost = baseCost * (wp / 100);
          if (!wasteByProduct[ing.product_id]) {
            wasteByProduct[ing.product_id] = { name: product.name, wastePercent: wp, wasteCost: 0, totalCost: 0 };
          }
          wasteByProduct[ing.product_id].wasteCost += wasteCost;
          wasteByProduct[ing.product_id].totalCost += baseCost + wasteCost;
        });
      });

      const wasteAnalysis: WasteItem[] = Object.entries(wasteByProduct)
        .map(([id, d]) => ({
          productId: id,
          name: d.name,
          wastePercent: d.wastePercent,
          wasteCost: d.wasteCost,
          impactOnCmv: current.revenueTotal > 0 ? (d.wasteCost / current.revenueTotal) * 100 : 0,
        }))
        .sort((a, b) => b.wasteCost - a.wasteCost);

      // Projection (next 30 days based on last 30 days average)
      const dailyRevenue = current.revenueTotal / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyCmv = current.cmvTotal / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const projectedRevenue = dailyRevenue * 30;
      const projectedCmv = dailyCmv * 30;

      const projection: ProjectionData = {
        projectedRevenue,
        projectedCmv,
        projectedCmvPercent: projectedRevenue > 0 ? (projectedCmv / projectedRevenue) * 100 : 0,
        projectedMargin: projectedRevenue - projectedCmv,
      };

      return {
        cmvTotal: current.cmvTotal,
        revenueTotal: current.revenueTotal,
        cmvPercent,
        cmvGoal,
        previousCmvPercent,
        variation,
        byCategory,
        byProduct,
        monthlyHistory,
        wasteAnalysis,
        projection,
      };
    },
    enabled: !!user,
  });
}
