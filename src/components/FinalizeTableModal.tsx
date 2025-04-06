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

interface FinalizeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    tableNumber: string;
    token: string; // Adicionando o token da mesa
    orders: any[]; // Garantir que é um array
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

  // Função para calcular o total por cliente
  const calculateTotalByCustomer = (orders: any[]) => {
    const totals: { [key: string]: number } = {};

    orders.forEach((order) => {
      const customerName = order.customer_name;
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);

      const total = items.reduce((sum, item) => {
        return sum + (item.is_promotional && item.promotional_price ? item.promotional_price : item.price);
      }, 0);

      if (totals[customerName]) {
        totals[customerName] += total;
      } else {
        totals[customerName] = total;
      }
    });

    return totals;
  };

  // Função para calcular o total geral da mesa
  const calculateTotal = (orders: any[]) => {
    return orders.reduce((total, order) => {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      return (
        total +
        items.reduce((itemTotal, item) => {
          return itemTotal + (item.is_promotional && item.promotional_price ? item.promotional_price : item.price);
        }, 0)
      );
    }, 0);
  };

  const totalsByCustomer = calculateTotalByCustomer(orders);
  const total = calculateTotal(orders);

  // Agrupa os pedidos por cliente
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

  // Nova função para lidar com a finalização da mesa
  const handleFinalizeTable = async () => {
    try {
      // Excluir todos os pedidos associados a esta mesa
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

      // Chamar a função original de finalização
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
        style={{ 
          background: 'var(--background)',
          maxHeight: '90vh',
          maxWidth: '95vw',
          width: '100%',
          overflow: 'hidden'
        }}
        className="sm:max-w-md md:max-w-lg lg:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--primary)' }}>
            {hideConfirmButton ? 'Pedidos da Mesa' : 'Finalizar Mesa'} {tableNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo com rolagem */}
        <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(70vh - 120px)' }}>
          {/* Lista de Itens Pedidos */}
          <div className="space-y-4">
            <h3 className="font-semibold" style={{ color: 'var(--primary)' }}>Itens Pedidos:</h3>
            {Object.values(groupedOrders).map((customer: CustomerOrder, index) => (
              <div key={index} style={{ background: 'var(--background)' }}>
                <h4 className="font-medium" style={{ color: 'var(--primary)' }}>{customer.customer_name}</h4>
                <ul className="list-disc pl-5">
                  {customer.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      {item.name} - {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.is_promotional && item.promotional_price ? item.promotional_price : item.price)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Valor Total por Cliente */}
          <div className="mt-6">
            <h3 className="font-semibold" style={{ color: 'var(--primary)' }}>Valor por Cliente:</h3>
            <ul className="list-disc pl-5">
            {Object.values(groupedOrders).map((customer: CustomerOrder, index) => (
              <li key={index}>
                <span style={{ color: 'var(--primary)' }}>{customer.customer_name}:</span> {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(customer.orderTotal)}
              </li>
            ))}
            </ul>
          </div>

          {/* Valor Total da Mesa */}
          <div className="mt-6 mb-4" style={{ border: '1px solid var(--primary)', borderRadius: '0.5rem', padding: '1rem' }}>
            <h3 className="font-semibold" style={{ color: 'var(--primary)' }}>Valor Total da Mesa:</h3>
            <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(mesaTotal)}
            </p>
          </div>
        </div>

        {/* Botões do Modal */}
        <DialogFooter className="mt-4">
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