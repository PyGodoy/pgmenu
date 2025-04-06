import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface OrdersCardProps {
  restaurantId: number;
  tables: { id: string; tableNumber: number; token: string }[];
}

export const OrdersCard = ({ restaurantId, tables }: OrdersCardProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
  
  // Novo useEffect para verificar mesas inexistentes
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Controle de Pedidos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Carregando pedidos...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coluna de Pedidos Pendentes */}
              <Droppable droppableId="pending">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      Pedidos Pendentes ({pendingOrders.length})
                    </h3>
                    
                    {pendingOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum pedido pendente
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingOrders.map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
                                      {getTableNumber(order.table_token)}
                                    </div>
                                    <h4 className="font-semibold">{order.customer_name}</h4>
                                  </div>
                                  <Badge variant="secondary">Pendente</Badge>
                                </div>
                                
                                <div className="mt-2 space-y-1">
                                  {parseItems(order.items).map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                      {item.name} - R${(item.is_promotional && item.promotional_price) ? 
                                        item.promotional_price.toFixed(2) : 
                                        item.price.toFixed(2)}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(order.created_at)}
                                </div>
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
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Pedidos Concluídos ({completedOrders.length})
                    </h3>
                    
                    {completedOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum pedido concluído
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedOrders.map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-600 opacity-80"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-sm text-gray-500 dark:text-gray-400">
                                      {getTableNumber(order.table_token)}
                                    </div>
                                    <h4 className="font-semibold">{order.customer_name}</h4>
                                  </div>
                                  <Badge variant="outline">Concluído</Badge>
                                </div>
                                
                                <div className="mt-2 space-y-1">
                                  {parseItems(order.items).map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                      {item.name} - R${(item.is_promotional && item.promotional_price) ? 
                                        item.promotional_price.toFixed(2) : 
                                        item.price.toFixed(2)}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(order.created_at)}
                                </div>
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
        )}
      </CardContent>
    </Card>
  );
};