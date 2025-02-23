import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuItem } from "@/components/MenuItem";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { supabase } from "@/integrations/supabase/client";
import type { Category, MenuItem as MenuItemType } from "@/types";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0); // Estado para a altura do Header
  const [restaurant, setRestaurant] = useState<any>(null);


  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id,
  });

  const { data: menuItems = [] } = useQuery<MenuItemType[]>({
    queryKey: ['menuItems', activeCategory],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('active', true) // Filtra apenas os itens ativos
        .order('name');
      
      if (activeCategory) {
        query = query.eq('category_id', activeCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Set initial active category when categories are loaded
  if (categories.length > 0 && !activeCategory) {
    setActiveCategory(categories[0].id);
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && item.active; // Filtra apenas os itens ativos
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onSearch={setSearchQuery}
        onHeaderHeightChange={setHeaderHeight} // Passa a altura para o Header
        restaurant={restaurant}/>
      <main className="flex-1">
        <div className="container mx-auto px-2 sm:px-4">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory ?? 0}
            onCategoryChange={setActiveCategory}
            headerHeight={headerHeight} // Passa a altura para o CategoryNav
          />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8">
            {filteredItems.map((item) => (
              <MenuItem key={item.id} {...item} />
            ))}
          </div>
        </div>
      </main>
      <BackToTop />
      <Footer 
      restaurant={restaurant}
      />
    </div>
  );
};

export default Index;