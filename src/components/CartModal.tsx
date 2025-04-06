import { X } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import type { MenuItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface CartModalProps {
  cart: MenuItem[];
  onRemoveItem: (itemId: number) => void;
  onClose: () => void;
  onConfirmOrder: (customerName: string, cart: MenuItem[]) => void;
  onClearCart: () => void;
  tableToken?: string;
}

type CartItem = MenuItem & { quantity: number };

export const CartModal = ({
  cart,
  onRemoveItem,
  onClose,
  onConfirmOrder,
  onClearCart,
  tableToken,
}: CartModalProps) => {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const consolidateCart = (cart: MenuItem[]): CartItem[] => {
    const grouped: Record<number, CartItem> = {};
    cart.forEach(item => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += 1;
      } else {
        grouped[item.id] = { ...item, quantity: 1 };
      }
    });
    return Object.values(grouped);
  };

  const [cartItems, setCartItems] = useState<CartItem[]>(consolidateCart(cart));

  useEffect(() => {
    if (tableToken) {
      fetchExistingCustomers();
    }
  }, [tableToken]);

  const fetchExistingCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("customer_name")
        .eq("table_token", tableToken);

      if (error) throw error;

      const uniqueCustomers = Array.from(
        new Set(data.map((order) => order.customer_name).filter((name) => name))
      );

      setExistingCustomers(uniqueCustomers);
    } catch (error) {
      console.error("Error fetching existing customers:", error);
    }
  };

  const incrementQuantity = (itemId: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (itemId: number) => {
    setCartItems(prev =>
      prev
        .map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.is_promotional && item.promotional_price
        ? item.promotional_price
        : item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const handleConfirmOrder = async () => {
    if (!customerName) {
      setErrorMessage("Por favor, preencha seu nome.");
      return;
    }
  
    const expandedCart = cartItems.flatMap(item =>
      Array(item.quantity).fill(item)
    );
  
    onConfirmOrder(customerName, expandedCart); // ✅ envia carrinho atualizado
    onClose(); // ❌ NÃO limpa aqui
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

        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-2">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500">Seu carrinho está vazio.</p>
          ) : (
            cartItems.map((item) => {
              const price = item.is_promotional && item.promotional_price
                ? item.promotional_price
                : item.price;

              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div className="w-2/3">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => decrementQuantity(item.id)}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                      >-</button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        onClick={() => incrementQuantity(item.id)}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                      >+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">R$ {price.toFixed(2)}</p>
                    <p className="font-semibold">
                      R$ {(price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
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
