
import { supabase } from "@/integrations/supabase/client";
import type { MenuItem } from "@/types";
import type { MenuItemFormData } from "./MenuItemForm";

export async function getRestaurantId(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user?.id)
    .single();

  if (restaurantError || !restaurant) {
    throw new Error('Restaurante não encontrado.');
  }

  return restaurant.id;
}

export async function createMenuItem(data: MenuItemFormData): Promise<void> {
  const restaurantId = await getRestaurantId();

  const { error } = await supabase
    .from("menu_items")
    .insert([{
      name: data.name,
      description: data.description,
      price: data.price,
      category_id: data.category_id,
      image_url: data.image_url || null,
      restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: data.active,
    }]);

  if (error) throw error;
}

export async function updateMenuItem(menuItemId: number, data: MenuItemFormData): Promise<void> {
  const { error } = await supabase
    .from("menu_items")
    .update({
      name: data.name,
      description: data.description,
      price: data.price,
      category_id: data.category_id,
      image_url: data.image_url || null,
      active: data.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", menuItemId);

  if (error) throw error;
}
