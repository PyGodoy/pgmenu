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
import { Card, CardContent } from "@/components/ui/card";
import { MenuItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { FinalizeTableModal } from "./FinalizeTableModal";
import { CheckCircle, Clock, Users, CreditCard, Coffee } from "lucide-react";

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

export const TableOrders = ({
  orders,
  tables,
  onUpdateOrderStatus,
  restaurantId,
  onTableFinalized,
}: TableOrdersProps) => {
  const [realtimeKey, setRealtimeKey] = useState(Date.now());
  const [localOrders, setLocalOrders] = useState(orders);
  const [localTables, setLocalTables] = useState(tables);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [expandedTables, setExpandedTables] = useState<string[]>([]);

  // Efeito para sincronizar props com estado local
  useEffect(() => {
    setLocalOrders(orders);
    setLocalTables(tables);
  }, [orders, tables]);

  const handleFinalizeTable = (tableNumber) => {
    const table = tables.find((t) => t.tableNumber === parseInt(tableNumber));
    if (!table) return;

    // Obter todos os pedidos da mesa
    const tableOrders = orders.filter(
      (order) => order.table_token === table.token
    );

    setSelectedTable({
      tableNumber,
      orders: tableOrders,
    });
    setIsFinalizeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFinalizeModalOpen(false);
    setSelectedTable(null);
  };

  const handleConfirmFinalization = async (tableNumber) => {
    try {
      const tableToFinalize = localTables.find(
        (t) => t.tableNumber === parseInt(tableNumber)
      );

      if (!tableToFinalize) {
        console.error("Mesa não encontrada");
        return;
      }

      const { error: deleteOrdersError } = await supabase
        .from("orders")
        .delete()
        .eq("table_token", tableToFinalize.token);

      if (deleteOrdersError) throw deleteOrdersError;

      setLocalOrders((prev) =>
        prev.filter((order) => order.table_token !== tableToFinalize.token)
      );

      setRealtimeKey(Date.now());

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
    const groupedByTable: { [key: string]: { [key: string]: GroupedOrder } } =
      {};

    orders.forEach((order) => {
      const table = localTables.find(
        (table) => table.token === order.table_token
      );
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
            orderIds: [],
          };
        }

        const items = Array.isArray(order.items)
          ? order.items
          : JSON.parse(order.items);
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
      return (
        total +
        customer.items.reduce((sum, item) => {
          return (
            sum +
            (item.is_promotional && item.promotional_price
              ? item.promotional_price
              : item.price)
          );
        }, 0)
      );
    }, 0);
  };

  // Agrupa os pedidos por mesa
  const groupedOrders = groupOrdersByTable(localOrders);

  const groupItems = (items: MenuItem[]) => {
    const grouped: Record<string, MenuItem & { quantity: number }> = {};
    items.forEach((item) => {
      const key = `${item.id}-${item.name}`;
      if (grouped[key]) {
        grouped[key].quantity += 1;
      } else {
        grouped[key] = { ...item, quantity: 1 };
      }
    });
    return Object.values(grouped);
  };

  // Verifica se há pedidos pendentes na mesa
  const hasActivePendingOrders = (tableNumber: string) => {
    const customers = groupedOrders[tableNumber];
    if (!customers) return false;
    return Object.values(customers).some(
      (customer) => customer.status === "pending"
    );
  };

  // Calcula quantos clientes há na mesa
  const getCustomerCount = (tableNumber: string) => {
    const customers = groupedOrders[tableNumber];
    return customers ? Object.keys(customers).length : 0;
  };

  // Formata o valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para alternar a tabela expandida
  const toggleExpandedTable = (tableNumber: string) => {
    setExpandedTables((prev) =>
      prev.includes(tableNumber)
        ? prev.filter((t) => t !== tableNumber)
        : [...prev, tableNumber]
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Mesas Ativas</h2>

      {Object.keys(groupedOrders).length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Coffee size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              Não há mesas ativas no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(groupedOrders).map((tableNumber) => {
            const tableCustomers = groupedOrders[tableNumber];
            const tableTotal = calculateTableTotal(tableCustomers);
            const isPending = hasActivePendingOrders(tableNumber);
            const customerCount = getCustomerCount(tableNumber);
            const isExpanded = expandedTables.includes(tableNumber);

            return (
              <div
                key={`table-wrapper-${tableNumber}-${realtimeKey}`}
                className="h-auto"
              >
                <Card
                  key={`table-${tableNumber}-${realtimeKey}`}
                  className={`border-l-4 transition-all ${
                    isPending ? "border-l-amber-500" : "border-l-emerald-500"
                  } hover:shadow-md h-auto`}
                  style={{ height: "auto", alignSelf: "flex-start" }}
                >
                  {/* Cabeçalho da mesa */}
                  <div className="p-4 flex justify-between items-center border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-bold">
                        Mesa {tableNumber}
                      </div>
                      {isPending ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          <Clock size={14} className="mr-1" /> Pendente
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <CheckCircle size={14} className="mr-1" /> Atendido
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      onClick={() => handleFinalizeTable(tableNumber)}
                    >
                      Finalizar
                    </Button>
                  </div>

                  {/* Informações resumidas */}
                  <div className="p-4 grid grid-cols-2 gap-4 bg-white">
                    <div className="flex items-center">
                      <Users size={16} className="text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">
                        {customerCount}{" "}
                        {customerCount === 1 ? "cliente" : "clientes"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard size={16} className="text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(tableTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Botão Ver/Ocultar detalhes */}
                  <div className="border-t p-2 bg-gray-50 text-center">
                    <button
                      onClick={() => toggleExpandedTable(tableNumber)}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                    </button>
                  </div>

                  {/* Conteúdo detalhado (visível apenas quando expandido) */}
                  {isExpanded && (
                    <div
                      className="border-t overflow-y-auto"
                      style={{ maxHeight: "300px" }}
                    >
                      {Object.values(tableCustomers).map((customer, idx) => (
                        <div
                          key={`customer-${customer.customer_name}-${realtimeKey}`}
                          className={`p-4 ${idx > 0 ? "border-t" : ""}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">
                              {customer.customer_name}
                            </div>
                            <Badge
                              variant={
                                customer.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={`${
                                customer.status === "pending"
                                  ? "bg-amber-100 text-amber-800 border-none"
                                  : "bg-emerald-100 text-emerald-800 border-none"
                              }`}
                            >
                              {customer.status === "pending"
                                ? "Pendente"
                                : "Concluído"}
                            </Badge>
                          </div>

                          <div className="text-sm space-y-2">
                            {groupItems(customer.items).map((item, index) => {
                              const price =
                                item.is_promotional && item.promotional_price
                                  ? item.promotional_price
                                  : item.price;
                              return (
                                <div
                                  key={`item-${index}-${realtimeKey}`}
                                  className="flex justify-between items-start text-gray-700"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 max-w-[70%]">
                                    <span className="font-medium break-words">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  <span className="font-medium whitespace-nowrap">
                                    {formatCurrency(price * item.quantity)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Integração do Modal de Finalização */}
      {selectedTable && (
        <FinalizeTableModal
          isOpen={isFinalizeModalOpen}
          onClose={handleCloseModal}
          table={selectedTable}
          onConfirmFinalization={() =>
            handleConfirmFinalization(selectedTable.tableNumber)
          }
        />
      )}
    </div>
  );
};
