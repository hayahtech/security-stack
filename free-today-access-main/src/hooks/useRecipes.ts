import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface RecipeIngredientInput {
  product_id: string;
  quantity: number;
  unit: string;
  waste_percentage: number;
}

export function useRecipes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, menu_items(name, category, sale_price, cost_price, active), recipe_ingredients(*, products(name, cost_price, unit, quantity_current))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRecipeByMenuItem(menuItemId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recipe', menuItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*, products(name, cost_price, unit, quantity_current))')
        .eq('menu_item_id', menuItemId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!menuItemId,
  });
}

export function useCreateRecipe() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      menu_item_id: string;
      yield_quantity: number;
      prep_time_minutes?: number;
      notes?: string;
      ingredients: RecipeIngredientInput[];
    }) => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .insert({ user_id: user!.id, menu_item_id: input.menu_item_id, yield_quantity: input.yield_quantity, prep_time_minutes: input.prep_time_minutes, notes: input.notes })
        .select()
        .single();
      if (error) throw error;

      if (input.ingredients.length > 0) {
        const rows = input.ingredients.map(i => ({ recipe_id: recipe.id, product_id: i.product_id, quantity: i.quantity, unit: i.unit, waste_percentage: i.waste_percentage }));
        const { error: ie } = await supabase.from('recipe_ingredients').insert(rows);
        if (ie) throw ie;
      }
      return recipe;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); qc.invalidateQueries({ queryKey: ['recipe'] }); toast({ title: 'Ficha técnica salva!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      yield_quantity?: number;
      prep_time_minutes?: number;
      notes?: string;
      ingredients?: RecipeIngredientInput[];
    }) => {
      const { id, ingredients, ...rest } = input;
      const { error } = await supabase.from('recipes').update(rest).eq('id', id);
      if (error) throw error;

      if (ingredients) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
        if (ingredients.length > 0) {
          const rows = ingredients.map(i => ({ recipe_id: id, product_id: i.product_id, quantity: i.quantity, unit: i.unit, waste_percentage: i.waste_percentage }));
          const { error: ie } = await supabase.from('recipe_ingredients').insert(rows);
          if (ie) throw ie;
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); qc.invalidateQueries({ queryKey: ['recipe'] }); toast({ title: 'Ficha técnica atualizada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); qc.invalidateQueries({ queryKey: ['recipe'] }); toast({ title: 'Ficha técnica excluída!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

/** Calculate real cost per unit from recipe ingredients */
export function calcRecipeCost(recipe: any): { costPerUnit: number; totalCost: number; ingredients: { name: string; qty: number; unit: string; waste: number; cost: number }[] } {
  if (!recipe?.recipe_ingredients) return { costPerUnit: 0, totalCost: 0, ingredients: [] };
  const yld = Number(recipe.yield_quantity) || 1;
  const ingredients = (recipe.recipe_ingredients || []).map((ri: any) => {
    const productCost = Number(ri.products?.cost_price || 0);
    const qty = Number(ri.quantity);
    const waste = Number(ri.waste_percentage) || 0;
    const effectiveQty = qty * (1 + waste / 100);
    const cost = effectiveQty * productCost;
    return { name: ri.products?.name || '?', qty, unit: ri.unit, waste, cost };
  });
  const totalCost = ingredients.reduce((s: number, i: any) => s + i.cost, 0);
  return { costPerUnit: totalCost / yld, totalCost, ingredients };
}

/** Deduct stock for sold items based on recipes */
export async function deductStockForSale(userId: string, saleItems: { menu_item_id: string; quantity: number }[]) {
  for (const item of saleItems) {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(product_id, quantity, waste_percentage)')
      .eq('menu_item_id', item.menu_item_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!recipe?.recipe_ingredients) continue;

    const yld = Number(recipe.yield_quantity) || 1;
    for (const ri of recipe.recipe_ingredients) {
      const qtyPerUnit = Number(ri.quantity) * (1 + Number(ri.waste_percentage) / 100) / yld;
      const totalDeduct = qtyPerUnit * item.quantity;

      // Record stock movement
      await supabase.from('stock_movements').insert({
        user_id: userId,
        product_id: ri.product_id,
        type: 'saida' as const,
        quantity: totalDeduct,
        reason: 'Venda automática',
      });

      // Update product quantity
      const { data: product } = await supabase.from('products').select('quantity_current').eq('id', ri.product_id).single();
      if (product) {
        await supabase.from('products').update({ quantity_current: Math.max(0, Number(product.quantity_current) - totalDeduct) }).eq('id', ri.product_id);
      }
    }
  }
}
