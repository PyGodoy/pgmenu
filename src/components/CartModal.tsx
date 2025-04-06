import { X, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import type { MenuItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface CartModalProps {
  cart: MenuItem[];
  onRemoveItem: (itemId: number) => void;
  onClose: () => void;
  onConfirmOrder: (customerName: string, phone: string, cart: MenuItem[]) => void;
  tableToken?: string;
}

export const CartModal = ({ cart, onRemoveItem, onClose, onConfirmOrder, tableToken }: CartModalProps) => {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  useEffect(() => {
    if (tableToken) {
      fetchExistingCustomers();
    }
  }, [tableToken]);

  const fetchExistingCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name')
        .eq('table_token', tableToken);

      if (error) throw error;

      // Remove duplicates and empty names
      const uniqueCustomers = Array.from(
        new Set(data.map(order => order.customer_name).filter(name => name))
      );
      
      setExistingCustomers(uniqueCustomers);
    } catch (error) {
      console.error("Error fetching existing customers:", error);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      if (item.is_promotional && item.promotional_price) {
        return total + item.promotional_price;
      }
      return total + item.price;
    }, 0);
  };

  const handleConfirmOrder = async () => {
    if (!customerName) {
      setErrorMessage("Por favor, preencha seu nome.");
      return;
    }
  
    // Sempre cria um novo pedido, mesmo que seja o mesmo cliente
    onConfirmOrder(customerName, phone, cart);
    onClose();
  };

  const handleUseExistingCustomer = () => {
    setShowCustomerList(true);
  };

  const handleSelectCustomer = (name: string) => {
    setCustomerName(name);
    setShowCustomerList(false);
    setIsUpdatingOrder(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Seu Carrinho</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-600">Seu carrinho está vazio.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  {item.is_promotional && item.promotional_price ? (
                    <div className="text-sm text-gray-600">
                      <span className="line-through">R${item.price.toFixed(2)}</span>
                      <span className="ml-2 text-green-600">R${item.promotional_price.toFixed(2)}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">R${item.price.toFixed(2)}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="flex justify-between items-center border-t pt-4 mb-4">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold">R${calculateTotal().toFixed(2)}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Digitar seu nome</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setIsUpdatingOrder(false);
            }}
            className="w-full p-2 border rounded-lg mb-2"
            placeholder="Seu nome"
          />
          
          {existingCustomers.length > 0 && !showCustomerList && (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={handleUseExistingCustomer}
            >
              Usar Nome Cadastrado
            </Button>
          )}

          {showCustomerList && (
            <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Clientes nesta mesa:</p>
              {existingCustomers.map((name) => (
                <div 
                  key={name}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                  onClick={() => handleSelectCustomer(name)}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
        )}

        <Button
          className="w-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--text)', 
            color: 'var(--background)' 
          }}
          onClick={handleConfirmOrder}
        >
          {isUpdatingOrder ? 'Adicionar ao Pedido Existente' : 'Confirmar Pedido'}
        </Button>
      </div>
    </div>
  );
};