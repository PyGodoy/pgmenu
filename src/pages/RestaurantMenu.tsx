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
import { QrCodeIcon, TruckIcon, ClipboardListIcon } from "lucide-react";
import { TableOrder } from "@/components/TableOrder";
import { CartModal } from "@/components/CartModal"; // Importe o novo componente
import { FinalizeTableModal } from "@/components/FinalizeTableModal";

const RestaurantMenu = () => {
  const { restaurantSlug, tableToken } = useParams();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTableOrderActive, setIsTableOrderActive] = useState(false);
  const [cart, setCart] = useState<MenuItemType[]>([]);
  const [showTableOrderModal, setShowTableOrderModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false); // Estado para controlar o modal do carrinho
  const [customerName, setCustomerName] = useState("");
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [tableOrders, setTableOrders] = useState<any>(null);
  const [hasOrders, setHasOrders] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Fetch restaurant data
  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ['restaurant', restaurantSlug],
    queryFn: async () => {
      setLoading(true);
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
          customization: data.customization || {},
        };
      } finally {
        setLoading(false);
      }
    },
  });

  const verifyTableToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('token', token)
        .single();

      if (error) throw error;

      if (!data) {
        console.error("Mesa não encontrada");
        // Redirecionar ou mostrar erro
      }
    } catch (error) {
      console.error("Erro ao verificar token da mesa:", error);
    }
  };

  useEffect(() => {
    if (!tableToken || !restaurant?.id) return;

    const channel = supabase
        .channel(`realtime-orders-${tableToken}`)
        .on(
            'postgres_changes',
            {
                event: '*', // Escuta INSERT, UPDATE e DELETE
                schema: 'public',
                table: 'orders',
                filter: `table_token=eq.${tableToken}`
            },
            async (payload) => {
                console.log('Mudança detectada:', payload.eventType);
                await checkTableOrders(tableToken); // Força re-verificação
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}, [tableToken, restaurant?.id]);

const checkTableOrders = async (token: string) => {
  try {
      const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('table_token', token);

      if (error) throw error;

      const hasOrdersNow = data && data.length > 0;
      setHasOrders(hasOrdersNow); // Atualiza o estado

      if (hasOrdersNow) {
          const { data: tableData, error: tableError } = await supabase
              .from('tables')
              .select('table_number')
              .eq('token', token)
              .single();

          if (tableError) throw tableError;

          setTableOrders({
              tableNumber: tableData?.table_number,
              orders: data
          });
      } else {
          // Se não há pedidos, limpa o estado
          setTableOrders(null);
      }

      return hasOrdersNow;
  } catch (error) {
      console.error("Erro ao verificar pedidos:", error);
      return false;
  } finally {
      setInitialCheckDone(true);
  }
};

  useEffect(() => {
    if (!tableToken || !showOrdersModal) return;
  
    const intervalId = setInterval(() => {
      checkTableOrders(tableToken);
    }, 10000);
  
    return () => clearInterval(intervalId);
  }, [tableToken, showOrdersModal]);

    // Verificar se o token da mesa é válido
    useEffect(() => {
      if (tableToken) {
        verifyTableToken(tableToken);
        checkTableOrders(tableToken);
      }
    }, [tableToken]);

    const handleViewOrders = () => {
      // Refresh orders data before showing the modal
      if (tableToken) {
        checkTableOrders(tableToken);
      }
      setShowOrdersModal(true);
    };

  // Aplicar as personalizações dinamicamente
  useEffect(() => {
    if (restaurant?.customization) {
      const { primaryColor, secondaryColor, backgroundColor, textColor } = restaurant.customization;

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
        .eq('active', true)
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

  const handleAddToCart = (item: MenuItemType) => {
    setCart([...cart, item]);
  };

  const handleRemoveItem = (itemId: number) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const handleFinalizeOrder = () => {
    setShowTableOrderModal(true);
  };

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
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 px-2">
      <button 
        className="flex items-center justify-center py-2 px-3 sm:px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs sm:text-sm"
        style={{ 
          backgroundColor: 'var(--background)', 
          color: 'var(--text)',
          minWidth: '120px'
        }}
        onClick={() => setIsTableOrderActive(true)}
      >
        <QrCodeIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
        Pedir na Mesa
      </button>
      <button 
        className="flex items-center justify-center py-2 px-3 sm:px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs sm:text-sm"
        style={{ 
          backgroundColor: 'var(--background)', 
          color: 'var(--text)',
          minWidth: '120px'
        }}
      >
        <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
        Delivery
      </button>
      {(hasOrders || !initialCheckDone) && (
        <button 
          className="flex items-center justify-center py-2 px-3 sm:px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs sm:text-sm"
          style={{ 
            backgroundColor: 'var(--background)', 
            color: 'var(--text)',
            minWidth: '120px'
          }}
          onClick={handleViewOrders}
        >
          <ClipboardListIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          Ver Pedidos
        </button>
      )}
    </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mt-4 sm:mt-6 md:mt-8">
            {filteredItems.map((item) => (
              <MenuItem 
                key={item.id} 
                {...item}
                onAddToCart={() => handleAddToCart(item)}
                showAddButton={isTableOrderActive}
              />
            ))}
          </div>
        </div>
      </main>
      {isTableOrderActive && (
        <div 
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 w-full max-w-xs cursor-pointer"
          style={{ backgroundColor: 'var(--text)' }}
          onClick={() => setShowCartModal(true)} // Abre o CartModal ao clicar em qualquer lugar da barra
        >
          <div className="flex justify-between items-center">
            {/* Bolinha com o número de itens e "Ver Carrinho" */}
            <div className="flex items-center gap-2">
              {/* Bolinha com o número de itens */}
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--background)' }} // Cor de fundo da bolinha
              >
                <span 
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text)' }} // Cor do texto (número de itens)
                >
                  {cart.length}
                </span>
              </div>

              {/* Texto "Ver Carrinho" */}
              <span className="text-sm font-semibold" style={{ color: 'var(--background)' }}>Ver Carrinho</span>
            </div>

            {/* Valor total */}
            <span className="text-sm font-semibold" style={{ color: 'var(--background)' }}>
              R${cart.reduce((total, item) => {
                // Verifica se o item está em promoção e se tem um preço promocional
                if (item.is_promotional && item.promotional_price) {
                  return total + item.promotional_price; // Usa o preço promocional
                }
                return total + item.price; // Usa o preço normal
              }, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
      {showCartModal && (
        <CartModal
          cart={cart}
          onRemoveItem={handleRemoveItem}
          onClose={() => setShowCartModal(false)}
          onConfirmOrder={(name, phone) => {
            // Aqui você pode processar os dados do pedido (ex: enviar para o backend)
            setCustomerName(name);
            console.log("Pedido confirmado:", { name, phone });

            // Fecha o modal do carrinho
            setShowCartModal(false);

            // Abre o modal do TableOrder
            setShowTableOrderModal(true);
          }}
        />
      )}

      {showTableOrderModal && (
        <TableOrder
          onClose={() => setShowTableOrderModal(false)}
          cart={cart} // Passar o carrinho como prop
          tableToken={tableToken} // Passar o token da mesa (se disponível)
          restaurantId={restaurant?.id} // Passar o ID do restaurante
          customerName={customerName}
        />
      )}
      {/* Modal de Visualização de Pedidos */}
      {showOrdersModal && tableOrders && (
        <FinalizeTableModal
          isOpen={showOrdersModal}
          onClose={() => setShowOrdersModal(false)}
          table={tableOrders}
          onConfirmFinalization={() => {/* Não será usado, apenas para satisfazer a prop */}}
          hideConfirmButton={true}
        />
      )}
      <BackToTop />
      <Footer restaurant={restaurant} />
    </div>
  );
};

export default RestaurantMenu;