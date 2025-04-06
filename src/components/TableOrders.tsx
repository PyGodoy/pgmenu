import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { FinalizeTableModal } from "./FinalizeTableModal";

interface TableOrdersProps {
    orders: any[];
    tables: { id: string; tableNumber: number; token: string }[];
    onUpdateOrderStatus: (orderId: string, status: string) => void;
    onTableFinalized?: (tableToken: string) => void;
    restaurantId: number;
}

interface GroupedOrder {
  customer_name: string;
  items: MenuItem[];
  status: string;
  orderIds: string[];
}

export const TableOrders = ({ orders, tables, onUpdateOrderStatus, restaurantId, onTableFinalized }: TableOrdersProps) => {
    // Usar uma chave de dependência para forçar a rerendenização
    const [realtimeKey, setRealtimeKey] = useState(Date.now());
    const [localOrders, setLocalOrders] = useState(orders);
    const [localTables, setLocalTables] = useState(tables);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

  // Efeito para sincronizar props com estado local
  useEffect(() => {
    setLocalOrders(orders);
    setLocalTables(tables);
  }, [orders, tables]);

  useEffect(() => {
    console.log("Estado localOrders atualizado:", localOrders);
  }, [localOrders]);

  const handleFinalizeTable = (tableNumber) => {
    const table = tables.find(t => t.tableNumber === parseInt(tableNumber));
    if (!table) return;
  
    // Obter todos os pedidos da mesa (não agrupados)
    const tableOrders = orders.filter(order => order.table_token === table.token);
    
    setSelectedTable({ 
      tableNumber, 
      orders: tableOrders // Agora é um array de pedidos
    });
    setIsFinalizeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFinalizeModalOpen(false);
    setSelectedTable(null);
  };

  const handleConfirmFinalization = async (tableNumber) => {
    try {
      const tableToFinalize = localTables.find(t => t.tableNumber === parseInt(tableNumber));
      
      if (!tableToFinalize) {
        console.error("Mesa não encontrada");
        return;
      }
      
      const { error: deleteOrdersError } = await supabase
        .from('orders')
        .delete()
        .eq('table_token', tableToFinalize.token);

      if (deleteOrdersError) throw deleteOrdersError;

      setLocalOrders(prev => prev.filter(order => 
        order.table_token !== tableToFinalize.token
      ));

      setRealtimeKey(Date.now());
      
      console.log(`Pedidos da mesa ${tableNumber} finalizados e removidos`);
      
      // Chame a callback para notificar o componente pai
      if (onTableFinalized) {
        onTableFinalized(tableToFinalize.token);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao finalizar mesa:", error);
    }
};

  // Função para agrupar os pedidos por mesa
  const groupOrdersByTable = (orders: any[]) => {
    const groupedByTable: { [key: string]: { [key: string]: GroupedOrder } } = {};
  
    orders.forEach((order) => {
      const table = localTables.find((table) => table.token === order.table_token);
      if (table) {
        const tableNumber = table.tableNumber.toString();
        const customerName = order.customer_name;
        
        if (!groupedByTable[tableNumber]) {
          groupedByTable[tableNumber] = {};
        }
        
        if (!groupedByTable[tableNumber][customerName]) {
          groupedByTable[tableNumber][customerName] = {
            customer_name: customerName,
            items: [],
            status: order.status,
            orderIds: []
          };
        }
        
        const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
        groupedByTable[tableNumber][customerName].items.push(...items);
        groupedByTable[tableNumber][customerName].orderIds.push(order.id);
        
        // Mantém o status mais recente se houver múltiplos pedidos
        groupedByTable[tableNumber][customerName].status = order.status;
      }
    });
  
    return groupedByTable;
  };

  // Função para calcular o total dos pedidos de uma mesa
  const calculateTableTotal = (customers: { [key: string]: GroupedOrder }) => {
    return Object.values(customers).reduce((total, customer) => {
      return total + customer.items.reduce((sum, item) => {
        return sum + (item.is_promotional && item.promotional_price ? item.promotional_price : item.price);
      }, 0);
    }, 0);
  };

  // Agrupa os pedidos por mesa
  const groupedOrders = groupOrdersByTable(localOrders);

  return (
    <>
      <Accordion type="single" collapsible key={realtimeKey}>
        {Object.keys(groupedOrders).map((tableNumber) => {
          const tableCustomers = groupedOrders[tableNumber];
          const tableTotal = calculateTableTotal(tableCustomers);
          
          return (
            <AccordionItem key={`table-${tableNumber}-${realtimeKey}`} value={tableNumber}>
              <AccordionTrigger className="text-lg font-semibold">
                  Mesa {tableNumber} - Total: R${tableTotal.toFixed(2)}
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                      e.stopPropagation();
                      handleFinalizeTable(tableNumber);
                      }}
                  >
                      Finalizar Mesa
                  </Button>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(tableCustomers).map((customer) => (
                      <TableRow key={`customer-${customer.customer_name}-${realtimeKey}`}>
                        <TableCell>{customer.customer_name}</TableCell>
                        <TableCell>
                          {customer.items.map((item, index) => (
                            <div key={`item-${index}-${realtimeKey}`}>
                              {item.name} - {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(item.is_promotional && item.promotional_price ? item.promotional_price : item.price)}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.status === 'pending' ? 'secondary' : 'outline'}>
                            {customer.status === 'pending' ? 'Pendente' : 'Concluído'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Integração do Modal de Finalização */}
      {selectedTable && (
        <FinalizeTableModal
          isOpen={isFinalizeModalOpen}
          onClose={handleCloseModal}
          table={selectedTable}
          onConfirmFinalization={() => handleConfirmFinalization(selectedTable.tableNumber)}
        />
      )}
    </>
  );
};