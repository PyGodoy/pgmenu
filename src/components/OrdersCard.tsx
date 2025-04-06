import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface OrdersCardProps {
  restaurantId: number;
  tables: { id: string; tableNumber: number; token: string }[];
}

export const OrdersCard = ({ restaurantId, tables }: OrdersCardProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  // Verificar se é dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkIfMobile();
    
    // Adicionar event listener para resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro ao buscar pedidos",
        description: "Ocorreu um erro ao carregar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteOrdersFromNonExistentTables = async () => {
    try {
      // Obter todos os tokens de mesa existentes
      const existingTableTokens = tables.map(table => table.token);

      // Encontrar pedidos com tokens que não correspondem a mesas existentes
      const ordersToDelete = orders.filter(order =>
        !existingTableTokens.includes(order.table_token)
      );

      if (ordersToDelete.length === 0) return;

      // Extrair IDs dos pedidos para exclusão
      const orderIdsToDelete = ordersToDelete.map(order => order.id);

      // Excluir os pedidos no Supabase
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIdsToDelete);

      if (error) throw error;

      // Atualizar estado local removendo os pedidos excluídos
      setOrders(currentOrders =>
        currentOrders.filter(order =>
          existingTableTokens.includes(order.table_token)
        )
      );

      toast({
        title: "Pedidos limpos",
        description: `${ordersToDelete.length} pedidos de mesas inexistentes foram removidos.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao excluir pedidos de mesas inexistentes:", error);
      toast({
        title: "Erro ao limpar pedidos",
        description: "Não foi possível remover pedidos de mesas inexistentes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!restaurantId) return;

    fetchOrders();

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  // Verificar mesas inexistentes
  useEffect(() => {
    if (orders.length > 0 && tables.length > 0) {
      deleteOrdersFromNonExistentTables();
    }
  }, [orders, tables]);

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const orderIdNum = parseInt(orderId, 10);
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('customer_name')
        .eq('id', orderIdNum)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          customer_name: existingOrder.customer_name
        })
        .eq('id', orderIdNum);

      if (error) throw error;

      // Em dispositivos móveis, mudar para a aba de concluídos após marcar como concluído
      if (isMobile) {
        setActiveTab("completed");
      }

      toast({
        title: "Pedido concluído",
        description: "Pedido marcado como concluído com sucesso!",
        variant: "default",
      });

    } catch (error) {
      console.error("Erro ao completar o pedido:", error);
      toast({
        title: "Erro ao atualizar pedido",
        description: "Não foi possível marcar o pedido como concluído.",
        variant: "destructive",
      });
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceColumn = result.source.droppableId;
    const destColumn = result.destination.droppableId;
    const orderId = result.draggableId;

    // Se moveu entre colunas (Pedidos -> Concluídos)
    if (sourceColumn !== destColumn && destColumn === 'completed') {
      await handleCompleteOrder(orderId);
    }
  };

  const getTableNumber = (tableToken: string) => {
    const table = tables.find(t => t.token === tableToken);
    if (!table) {
      // Se a mesa não existe, marca o pedido para exclusão
      setTimeout(() => {
        const orderToDelete = orders.find(o => o.table_token === tableToken);
        if (orderToDelete) {
          handleDeleteOrder(orderToDelete.id);
        }
      }, 0);
      return 'Mesa não encontrada (pedido será removido)';
    }
    return `Mesa ${table.tableNumber}`;
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      // Atualiza o estado local
      setOrders(currentOrders =>
        currentOrders.filter(order => order.id !== orderId)
      );
    } catch (error) {
      console.error(`Erro ao excluir pedido ${orderId}:`, error);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm - dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const parseItems = (items: any) => {
    try {
      if (Array.isArray(items)) return items;
      return JSON.parse(items);
    } catch {
      return [];
    }
  };

  const pendingOrders = orders.filter(order => order.status !== 'completed');
  const completedOrders = orders.filter(order => order.status === 'completed');

  const groupItems = (items: any[]) => {
    const grouped: Record<number, any & { quantity: number }> = {};
    items.forEach(item => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += 1;
      } else {
        grouped[item.id] = { ...item, quantity: 1 };
      }
    });
    return Object.values(grouped);
  };

  // Limitar o número de itens visíveis por padrão
  const MAX_VISIBLE_ITEMS = 3;

  const OrderItemsList = ({ order }) => {
    const items = groupItems(parseItems(order.items));
    const hasMoreItems = items.length > MAX_VISIBLE_ITEMS;
    const [showAllItems, setShowAllItems] = useState(false);
    
    // Função para alternar a exibição de todos os itens
    const toggleShowAllItems = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowAllItems(!showAllItems);
    };
    
    // Itens a serem exibidos
    const visibleItems = showAllItems ? items : items.slice(0, MAX_VISIBLE_ITEMS);
    
    return (
      <div className="mt-2">
        <div className={`space-y-1 ${!showAllItems && hasMoreItems ? "max-h-28 overflow-y-auto pr-1" : ""}`}>
          {visibleItems.map((item: any, idx: number) => {
            const price = item.is_promotional && item.promotional_price
              ? item.promotional_price
              : item.price;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="text-sm flex justify-between"
              >
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.quantity * price).toFixed(2)}</span>
              </motion.div>
            );
          })}
        </div>
        
        {hasMoreItems && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleShowAllItems} 
            className="w-full mt-1 text-xs py-0 h-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {showAllItems ? "Menos itens" : `+ ${items.length - MAX_VISIBLE_ITEMS} itens`}
          </Button>
        )}
      </div>
    );
  };

  // Componente para o cartão de pedido (usado tanto para pendentes quanto para concluídos)
  const OrderCard = ({ order, isPending = true }) => {
    // Estado para animação de hover
    const [isHovered, setIsHovered] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border ${
          isPending ? "border-yellow-200 hover:border-yellow-300" : "border-green-200 hover:border-green-300"
        } dark:border-gray-600 transition-all duration-200 ${
          isPending ? "" : "opacity-80"
        } ${isHovered ? "shadow-md" : ""}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
              {getTableNumber(order.table_token)}
            </div>
            <h4 className="font-semibold">{order.customer_name}</h4>
          </div>
          <Badge variant={isPending ? "secondary" : "outline"} className={isPending ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}>
            {isPending ? "Pendente" : "Concluído"}
          </Badge>
        </div>

        <OrderItemsList order={order} />

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {formatDateTime(order.created_at)}
        </div>
        
        {isPending && (
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700 transition-all duration-200"
              onClick={() => handleCompleteOrder(order.id.toString())}
            >
              Marcar como Concluído
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Conteúdo para versão desktop (duas colunas lado a lado)
  const DesktopContent = () => (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna de Pedidos Pendentes */}
        <Droppable droppableId="pending">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <motion.span 
                  className="w-3 h-3 bg-yellow-500 rounded-full mr-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, repeatDelay: 5, duration: 1 }}
                ></motion.span>
                Pedidos Pendentes
                <Badge className="ml-2 bg-yellow-500 text-white">{pendingOrders.length}</Badge>
              </h3>

              {pendingOrders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200"
                >
                  Nenhum pedido pendente
                </motion.div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {pendingOrders.map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <OrderCard order={order} isPending={true} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Coluna de Pedidos Concluídos */}
        <Droppable droppableId="completed">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <motion.span 
                  className="w-3 h-3 bg-green-500 rounded-full mr-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, repeatDelay: 8, duration: 1 }}
                ></motion.span>
                Pedidos Concluídos
                <Badge className="ml-2 bg-green-500 text-white">{completedOrders.length}</Badge>
              </h3>

              {completedOrders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200"
                >
                  Nenhum pedido concluído
                </motion.div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {completedOrders.map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <OrderCard order={order} isPending={false} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </DragDropContext>
  );

  // Conteúdo para versão mobile (com abas para alternar)
  const MobileContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4 w-full">
        <TabsTrigger value="pending" className="relative">
          Pendentes
          {pendingOrders.length > 0 && (
            <Badge className="ml-2 bg-yellow-500 text-white">{pendingOrders.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="relative">
          Concluídos
          {completedOrders.length > 0 && (
            <Badge className="ml-2 bg-green-500 text-white">{completedOrders.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending" className="mt-0">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          {pendingOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200"
            >
              Nenhum pedido pendente
            </motion.div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} isPending={true} />
              ))}
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="completed" className="mt-0">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          {completedOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200"
            >
              Nenhum pedido concluído
            </motion.div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} isPending={false} />
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

  // Loading Skeleton (com animação)
  const LoadingSkeleton = () => (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((column) => (
          <div key={column} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <motion.div 
                  key={item}
                  className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-1/2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                  <div className="mt-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800">
        <CardTitle className="text-xl sm:text-2xl flex items-center">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
            className="mr-2 text-gray-500"
          >
            {loading && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </motion.div>
          Controle de Pedidos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <LoadingSkeleton />
        ) : isMobile ? (
          <MobileContent />
        ) : (
          <DesktopContent />
        )}
      </CardContent>
    </Card>
  );
};