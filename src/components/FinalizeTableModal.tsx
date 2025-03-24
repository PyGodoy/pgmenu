import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "./ui/button";
  
  interface FinalizeTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: any;
    onConfirmFinalization: () => void;
  }
  
  export const FinalizeTableModal = ({ 
    isOpen, 
    onClose, 
    table, 
    onConfirmFinalization 
  }: FinalizeTableModalProps) => {
    if (!table) return null;
  
    const { tableNumber, orders } = table;
  
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
            <DialogTitle style={{ color: 'var(--primary)' }}>Finalizar Mesa {tableNumber}</DialogTitle>
          </DialogHeader>
  
          {/* Conteúdo com rolagem */}
          <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(70vh - 120px)' }}>
            {/* Lista de Itens Pedidos */}
            <div className="space-y-4">
              <h3 className="font-semibold" style={{ color: 'var(--primary)' }}>Itens Pedidos:</h3>
              {orders.map((order) => (
                <div key={order.id} style={{ background: 'var(--background)' }}>
                  <h4 className="font-medium" style={{ color: 'var(--primary)' }}>{order.customer_name}</h4>
                  <ul className="list-disc pl-5">
                    {(Array.isArray(order.items) ? order.items : JSON.parse(order.items)).map((item, index) => (
                      <li key={index}>
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
                {Object.entries(totalsByCustomer).map(([customerName, total]) => (
                  <li key={customerName}>
                    <span style={{ color: 'var(--primary)' }}>{customerName}:</span> {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(total)}
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
                }).format(total)}
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
            <Button
              variant="default"
              onClick={() => {
                // Chamar a função para finalizar a mesa e excluir os pedidos
                onConfirmFinalization();
              }}
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              Confirmar Finalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };