"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "@/context/CardContext";
import { supabase } from "@/integrations/supabase/client";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm() {
  const { cart, clearCart } = useCart();
  const { tableToken, restaurantSlug } = useParams();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRestaurant() {
      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", restaurantSlug)
        .single();
      if (data) setRestaurantId(data.id);
    }
    fetchRestaurant();
  }, [restaurantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !tableToken || !restaurantId || !customerName)
      return;

    setLoading(true);

    try {
      const { data: pedido, error: pedidoError } = await supabase
        .from("orders")
        .insert([
          {
            table_token: tableToken,
            items: JSON.stringify(cart),
            status: "pending",
            restaurant_id: restaurantId,
            customer_name: customerName,
          },
        ])
        .select()
        .single();

      if (pedidoError || !pedido) throw pedidoError;

      const pedidoId = pedido.id;

      const { data: restaurante } = await supabase
        .from("restaurants")
        .select("stripe_account_id")
        .eq("id", restaurantId)
        .single();

      if (!restaurante?.stripe_account_id)
        throw new Error("Restaurante sem Stripe vinculado.");

      const valorTotal = cart.reduce((sum, item) => {
        const preco =
          item.is_promotional && item.promotional_price
            ? item.promotional_price
            : item.price;
        return sum + preco;
      }, 0);

      const valorEmCentavos = Math.round(valorTotal * 100);

      const res = await fetch("/api/criarPagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restauranteStripeId: restaurante.stripe_account_id,
          valorEmCentavos,
          pedidoId,
        }),
      });

      const { clientSecret } = await res.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: customerName },
        },
      });

      if (result.error) {
        alert(`Erro no pagamento: ${result.error.message}`);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        clearCart();
        navigate("/sucesso");
      }
    } catch (error: any) {
      alert("Erro ao processar o pagamento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold">Finalizar Pedido</h2>

      <input
        type="text"
        placeholder="Seu nome"
        className="w-full p-2 border rounded"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        required
      />

      <CardElement className="p-4 border rounded" />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? "Processando..." : "Pagar"}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
