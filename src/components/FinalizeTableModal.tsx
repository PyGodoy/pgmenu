
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

interface FinalizeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    tableNumber: string;
    token: string;
    orders: any[];
  };
  onConfirmFinalization: () => void;
  hideConfirmButton?: boolean;
}

interface CustomerOrder {
  customer_name: string;
  items: any[];
  orderTotal: number;
}

export const FinalizeTableModal = ({
  isOpen,
  onClose,
  table,
  onConfirmFinalization,
  hideConfirmButton = false
}: FinalizeTableModalProps) => {
  const { toast } = useToast();
  if (!table || !Array.isArray(table.orders)) return null;

  const { tableNumber, orders, token } = table;

  const calculateTotalByCustomer = (orders: any[]) => {
    const totals: { [key: string]: number } = {};
    orders.forEach((order) => {
      const customerName = order.customer_name;
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      const total = items.reduce((sum, item) => {
        return sum + (item.is_promotional && item.promotional_price ? item.promotional_price : item.price);
      }, 0);
      totals[customerName] = (totals[customerName] || 0) + total;
    });
    return totals;
  };

  const calculateTotal = (orders: any[]) => {
    return orders.reduce((total, order) => {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      return total + items.reduce((sum, item) => {
        return sum + (item.is_promotional && item.promotional_price ? item.promotional_price : item.price);
      }, 0);
    }, 0);
  };

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

  const groupedOrders: Record<string, CustomerOrder> = orders.reduce((acc, order) => {
    if (!acc[order.customer_name]) {
      acc[order.customer_name] = {
        customer_name: order.customer_name,
        items: [],
        orderTotal: 0
      };
    }
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
    acc[order.customer_name].items.push(...items);
    acc[order.customer_name].orderTotal += items.reduce((sum: number, item: any) => {
      return sum + (item.is_promotional && item.promotional_price ? item.promotional_price : item.price);
    }, 0);
    return acc;
  }, {} as Record<string, CustomerOrder>);

  const mesaTotal = Object.values(groupedOrders).reduce(
    (sum: number, customer: CustomerOrder) => sum + customer.orderTotal,
    0
  );

  const handleFinalizeTable = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('table_token', token);

      if (error) throw error;

      toast({
        title: "Mesa finalizada com sucesso",
        description: `Os pedidos da mesa ${tableNumber} foram excluídos.`,
        variant: "default",
      });

      onConfirmFinalization();
    } catch (error) {
      console.error("Erro ao finalizar mesa:", error);
      toast({
        title: "Erro ao finalizar mesa",
        description: "Não foi possível excluir os pedidos desta mesa.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl"
        style={{
          background: 'var(--background)',
          maxHeight: '90vh',
          width: '100%',
          overflow: 'hidden',
          padding: 0
        }}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            {hideConfirmButton ? 'Pedidos da Mesa' : 'Finalizar Mesa'} {tableNumber}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          className="overflow-y-auto px-6 pb-6"
          style={{ maxHeight: 'calc(80vh - 120px)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="space-y-6">
            {Object.values(groupedOrders).map((customer, index) => (
              <motion.div
                key={index}
                className="rounded-2xl bg-white p-5 shadow-lg border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <div className="mb-4 border-b pb-2">
                  <h4 className="text-lg font-bold text-gray-900">{customer.customer_name}</h4>
                </div>
                <div className="space-y-3">
                  {groupItems(customer.items).map((item, i) => {
                    const unit = item.is_promotional && item.promotional_price
                      ? item.promotional_price
                      : item.price;

                    return (
                      <div key={i} className="flex justify-between items-start">
                        <div className="flex flex-col text-sm">
                          <span className="font-medium text-gray-800">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            Unitário: R$ {unit.toFixed(2)}
                            {item.is_promotional && (
                              <motion.span
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="ml-2 text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-semibold"
                              >
                                Promoção
                              </motion.span>
                            )}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          R$ {(unit * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-3 mt-4 text-right">
                  <span className="text-sm text-gray-500">Subtotal:</span>{" "}
                  <span className="text-base font-bold text-gray-800">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(customer.orderTotal)}
                  </span>
                </div>
              </motion.div>
            ))}

            <div className="rounded-xl bg-gray-50 border p-4 text-right">
              <p className="text-base text-gray-500 font-medium">Total da Mesa</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(mesaTotal)}
              </p>
            </div>
          </div>
        </motion.div>

        <DialogFooter className="px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            style={{ borderColor: 'var(--primary)' }}
          >
            Fechar
          </Button>
          {!hideConfirmButton && (
            <Button
              variant="default"
              onClick={handleFinalizeTable}
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Confirmar Finalização
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
