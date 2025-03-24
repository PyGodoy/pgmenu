import { X, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import type { MenuItem } from "@/types";

interface CartModalProps {
  cart: MenuItem[];
  onRemoveItem: (itemId: number) => void;
  onClose: () => void;
  onConfirmOrder: (customerName: string, phone: string, cart: MenuItem[]) => void;
}

export const CartModal = ({ cart, onRemoveItem, onClose, onConfirmOrder }: CartModalProps) => {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      if (item.is_promotional && item.promotional_price) {
        return total + item.promotional_price;
      }
      return total + item.price;
    }, 0);
  };

  const handleConfirmOrder = () => {
    if (!customerName || !phone) {
      setErrorMessage("Por favor, preencha seu nome e telefone.");
      return;
    }

    alert(`Customer Name no CartModal: ${customerName}`); // Exibe o customerName
    onConfirmOrder(customerName, phone, cart);
    onClose();
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
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Seu nome"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Digitar seu número</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder="Seu telefone"
          />
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
          Confirmar Pedido
        </Button>
      </div>
    </div>
  );
};