import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definindo os tipos
interface Table {
  id: string;
  tableNumber: number;
  token: string;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  is_promotional?: boolean;
  promotional_price?: number;
  quantity?: number;
}

interface Order {
  id: number;
  table_token: string;
  customer_name: string;
  items: OrderItem[] | string;
  status: string;
  created_at: string;
}

interface OrdersCardProps {
  restaurantId: number;
  tables: Table[];
  orders: Order[];
  onOrderComplete: (orderId: string, status: string) => void;
}

interface OrderCardProps {
  order: Order;
  isPending: boolean;
  onComplete: (orderId: string) => void;
  tables: Table[];
}

interface OrderItemsListProps {
  order: Order;
}

const MAX_VISIBLE_ITEMS = 3;

const OrderItemsList = memo(({ order }: OrderItemsListProps) => {
  const parseItems = (items: any): OrderItem[] => {
    try {
      if (Array.isArray(items)) return items;
      return JSON.parse(items);
    } catch {
      return [];
    }
  };

  const groupItems = (items: OrderItem[]): OrderItem[] => {
    const grouped: Record<number, OrderItem> = {};
    items.forEach(item => {
      if (grouped[item.id]) {
        grouped[item.id].quantity = (grouped[item.id].quantity || 1) + 1;
      } else {
        grouped[item.id] = { ...item, quantity: 1 };
      }
    });
    return Object.values(grouped);
  };

  const items = groupItems(parseItems(order.items));
  const hasMoreItems = items.length > MAX_VISIBLE_ITEMS;
  const [showAllItems, setShowAllItems] = useState(false);
  
  const toggleShowAllItems = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllItems(!showAllItems);
  };
  
  const visibleItems = showAllItems ? items : items.slice(0, MAX_VISIBLE_ITEMS);
  
  return (
    <div className="mt-2">
      <div className={`space-y-1 ${!showAllItems && hasMoreItems ? "max-h-28 overflow-y-auto pr-1" : ""}`}>
        {visibleItems.map((item, idx) => {
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
              <span>R$ {(item.quantity! * price).toFixed(2)}</span>
            </motion.div>
          );
        })}
      </div>
      
      {hasMoreItems && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleShowAllItems} 
          className="w-full mt-1 text-xs py-0 h-6 hover:bg-gray-100 transition-colors duration-200"
        >
          {showAllItems ? "Menos itens" : `+ ${items.length - MAX_VISIBLE_ITEMS} itens`}
        </Button>
      )}
    </div>
  );
});

const OrderCard = memo(({ order, isPending, onComplete, tables }: OrderCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTableNumber = useCallback((tableToken: string) => {
    const table = tables.find(t => t.token === tableToken);
    return table ? `Mesa ${table.tableNumber}` : 'Mesa não encontrada';
  }, [tables]);

  const formatDateTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm - dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`bg-white rounded-lg shadow-sm p-4 border ${
        isPending ? "border-yellow-200 hover:border-yellow-300" : "border-green-200 hover:border-green-300"
      } transition-all duration-200 ${isHovered ? "shadow-md" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-sm text-gray-500">
            {getTableNumber(order.table_token)}
          </div>
          <h4 className="font-semibold">{order.customer_name}</h4>
        </div>
        <Badge variant={isPending ? "secondary" : "outline"} className={isPending ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}>
          {isPending ? "Pendente" : "Concluído"}
        </Badge>
      </div>

      <OrderItemsList order={order} />

      <div className="mt-2 text-xs text-gray-500">
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
            onClick={() => onComplete(order.id.toString())}
          >
            Marcar como Concluído
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
});

export const OrdersCard = ({ restaurantId, tables, orders, onOrderComplete }: OrdersCardProps) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [isMobile, setIsMobile] = useState(false);
  const pendingScrollRef = useRef<HTMLDivElement>(null);
  const completedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const [pendingOrders, completedOrders] = useMemo(() => {
    const pending = orders.filter(order => order.status !== 'completed');
    const completed = orders.filter(order => order.status === 'completed');
    return [pending, completed];
  }, [orders]);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    await onOrderComplete(orderId, 'completed');
    if (isMobile) setActiveTab("completed");
  }, [onOrderComplete, isMobile]);

  const onDragEnd = useCallback(async (result: any) => {
    if (!result.destination) return;
    const sourceColumn = result.source.droppableId;
    const destColumn = result.destination.droppableId;
    const orderId = result.draggableId;

    if (sourceColumn !== destColumn && destColumn === 'completed') {
      await handleCompleteOrder(orderId);
    }
  }, [handleCompleteOrder]);

  const DesktopContent = useMemo(() => (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Droppable droppableId="pending">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="bg-gray-50 rounded-lg p-4">
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
                <div ref={pendingScrollRef} className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {pendingOrders.map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <OrderCard 
                            order={order} 
                            isPending={true} 
                            onComplete={handleCompleteOrder}
                            tables={tables}
                          />
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

        <Droppable droppableId="completed">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="bg-gray-50 rounded-lg p-4">
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
                <div ref={completedScrollRef} className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {completedOrders.map((order, index) => (
                    <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <OrderCard 
                            order={order} 
                            isPending={false} 
                            onComplete={handleCompleteOrder}
                            tables={tables}
                          />
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
  ), [pendingOrders, completedOrders, handleCompleteOrder, onDragEnd, tables]);

  const MobileContent = useMemo(() => (
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
        <div className="bg-gray-50 rounded-lg p-4">
          {pendingOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200"
            >
              Nenhum pedido pendente
            </motion.div>
          ) : (
            <div ref={pendingScrollRef} className="space-y-4 max-h-[600px] overflow-y-auto">
              {pendingOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  isPending={true} 
                  onComplete={handleCompleteOrder}
                  tables={tables}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="completed" className="mt-0">
        <div className="bg-gray-50 rounded-lg p-4">
          {completedOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-200"
            >
              Nenhum pedido concluído
            </motion.div>
          ) : (
            <div ref={completedScrollRef} className="space-y-4 max-h-[600px] overflow-y-auto">
              {completedOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  isPending={false} 
                  onComplete={handleCompleteOrder}
                  tables={tables}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  ), [activeTab, pendingOrders, completedOrders, handleCompleteOrder, tables]);

  return (
    <Card className="w-full">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl sm:text-2xl">Controle de Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isMobile ? MobileContent : DesktopContent}
      </CardContent>
    </Card>
  );
};