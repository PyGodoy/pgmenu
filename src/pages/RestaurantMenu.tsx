import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuItem } from "@/components/MenuItem";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { supabase } from "@/integrations/supabase/client";
import type { Category, MenuItem as MenuItemType, Restaurant } from "@/types";

const RestaurantMenu = () => {
  const { restaurantSlug } = useParams();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch restaurant data
  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ['restaurant', restaurantSlug],
    queryFn: async () => {
      setLoading(true); // Inicia o carregamento
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', restaurantSlug)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Restaurant not found');
        
        return {
          id: data.id,
          name: data.name,
          description: data.description || '',
          logo_url: data.logo_url || '',
          address: data.address,
          phone: data.phone,
          email: data.email,
          hours_of_operation: data.hours_of_operation,
          social_media: data.social_media ? {
            facebook: (data.social_media as any).facebook || undefined,
            instagram: (data.social_media as any).instagram || undefined,
            whatsapp: (data.social_media as any).whatsapp || undefined,
          } : {},
          created_at: data.created_at || '',
          updated_at: data.updated_at || '',
          customization: data.customization || {}, // Adicionar o campo customizations
        };
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    },
  });

  // Aplicar as personalizações dinamicamente

  // Atualizar as meta tags quando o restaurante for carregado
  useEffect(() => {
    if (restaurant) {
      // Atualizar o título da página
      document.title = `${restaurant.name} - PG Menu`;
  
      // Função para atualizar uma meta tag
      const updateMetaTag = (property: string, content: string) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', property);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
      };
  
      // Atualizar as meta tags do Open Graph
      updateMetaTag('og:title', `${restaurant.name} - PG Menu`);
      updateMetaTag('og:description', restaurant.description || 'Cardápio digital do restaurante');
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:image', restaurant.logo_url || '/default-image.png');
    }
  }, [restaurant]);

  useEffect(() => {
    if (restaurant) {
      // Atualizar o título da página
      document.title = `${restaurant.name} - PG Menu`;

      // Atualizar as meta tags do Open Graph
      const metaTitle = document.querySelector('meta[property="og:title"]');
      if (metaTitle) {
        metaTitle.setAttribute('content', `${restaurant.name} - PG Menu`);
      }

      const metaDescription = document.querySelector('meta[property="og:description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', restaurant.description || 'Cardápio digital do restaurante');
      }

      const metaUrl = document.querySelector('meta[property="og:url"]');
      if (metaUrl) {
        metaUrl.setAttribute('content', window.location.href);
      }

      const metaImage = document.querySelector('meta[property="og:image"]');
      if (metaImage && restaurant.logo_url) {
        metaImage.setAttribute('content', restaurant.logo_url);
      }
    }
  }, [restaurant]);

  useEffect(() => {
    if (restaurant?.customization) {
      const { primaryColor, secondaryColor, backgroundColor, textColor } = restaurant.customization;

      // Aplicar as cores ao documento
      const root = document.documentElement;
      if (primaryColor) root.style.setProperty('--primary', primaryColor);
      if (secondaryColor) root.style.setProperty('--secondary', secondaryColor);
      if (backgroundColor) root.style.setProperty('--background', backgroundColor);
      if (textColor) root.style.setProperty('--text', textColor);
    }
  }, [restaurant]);

  // Fetch categories for this restaurant
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

  // Fetch menu items for this restaurant
  const { data: menuItems = [] } = useQuery<MenuItemType[]>({
    queryKey: ['menuItems', restaurant?.id, activeCategory],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('active', true) // Filtra apenas os itens ativos
        .order('order_itens');
      
      if (activeCategory) {
        query = query.eq('category_id', activeCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id,
  });

  // Set initial active category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg animate-pulse">Carregando restaurante...</p>
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Restaurante não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onSearch={setSearchQuery} 
        onHeaderHeightChange={setHeaderHeight}
        restaurant={restaurant}
      />
      <main className="flex-1">
        <div className="container mx-auto px-2 sm:px-4">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory ?? 0}
            onCategoryChange={setActiveCategory}
            headerHeight={headerHeight}
          />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8">
            {filteredItems.map((item) => (
              <MenuItem key={item.id} {...item} />
            ))}
          </div>
        </div>
      </main>
      <BackToTop />
      <Footer restaurant={restaurant} />
    </div>
  );
};

export default RestaurantMenu;
