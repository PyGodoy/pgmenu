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
    const tableOrders = groupedOrders[tableNumber];
    setSelectedTable({ tableNumber, orders: tableOrders });
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
    const groupedOrders: { [key: string]: any[] } = {};

    orders.forEach((order) => {
      const table = localTables.find((table) => table.token === order.table_token);
      if (table) {
        const tableNumber = table.tableNumber;
        if (!groupedOrders[tableNumber]) {
          groupedOrders[tableNumber] = [];
        }
        groupedOrders[tableNumber].push(order);
      }
    });

    return groupedOrders;
  };

  // Função para calcular o total dos pedidos de uma mesa
  const calculateTableTotal = (orders: any[]) => {
    return orders.reduce((total, order) => {
      try {
        // Verifique se order.items já é um array
        const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
        return (
          total +
          items.reduce((itemTotal, item) => {
            if (item.is_promotional && item.promotional_price) {
              return itemTotal + item.promotional_price;
            }
            return itemTotal + item.price;
          }, 0)
        );
      } catch (error) {
        console.error("Erro ao calcular total:", error);
        return total;
      }
    }, 0);
  };

  // Agrupa os pedidos por mesa
  const groupedOrders = groupOrdersByTable(localOrders);

  return (
    <>
      <Accordion type="single" collapsible key={realtimeKey}>
        {Object.keys(groupedOrders).map((tableNumber) => {
          const tableOrders = groupedOrders[tableNumber];
          const tableTotal = calculateTableTotal(tableOrders);
          return (
            <AccordionItem key={`table-${tableNumber}-${realtimeKey}`} value={tableNumber}>
              <AccordionTrigger className="text-lg font-semibold">
                  Mesa {tableNumber} - Total: R${tableTotal.toFixed(2)}
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                      e.stopPropagation(); // Impede que o Accordion feche ao clicar no botão
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
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableOrders.map((order) => (
                      <TableRow key={`order-${order.id}-${realtimeKey}`}>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>
                          {(() => {
                            try {
                              // Verifique se order.items já é um array
                              const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
                              return items.map((item: MenuItem, index: number) => (
                                <div key={`item-${index}-${realtimeKey}`}>
                                  {item.name} - {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(item.is_promotional && item.promotional_price ? item.promotional_price : item.price)}
                                </div>
                              ));
                            } catch (error) {
                              console.error("Erro ao parsear itens:", error);
                              return <div>Erro ao carregar itens</div>;
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onUpdateOrderStatus(order.id, 'completed');
                              // Opcionalmente, atualize o estado local também para feedback imediato
                              setLocalOrders(prev => 
                                prev.map(o => o.id === order.id ? {...o, status: 'completed'} : o)
                              );
                              setRealtimeKey(Date.now()); // Forçar rerendenização
                            }}
                            disabled={order.status !== 'pending'}
                          >
                            Concluir Pedido
                          </Button>
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