import { supabase } from "@/integrations/supabase/client";

export async function finalizarPedidoComStripe({
  cart,
  tableToken,
  restaurantId,
  customerName,
}: {
  cart: any[]; // MenuItem[]
  tableToken: string;
  restaurantId: number;
  customerName: string;
}) {
  try {
    // 1. Salva o pedido no Supabase
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

    // 2. Busca stripe_account_id do restaurante
    const { data: restaurante, error: restauranteError } = await supabase
      .from("restaurants")
      .select("stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (restauranteError || !restaurante?.stripe_account_id) {
      throw new Error("Restaurante não possui conta Stripe conectada.");
    }

    // 3. Calcula o valor total
    const valorTotal = cart.reduce((sum, item) => {
      const preco =
        item.is_promotional && item.promotional_price
          ? item.promotional_price
          : item.price;
      return sum + preco;
    }, 0);

    const valorEmCentavos = Math.round(valorTotal * 100);

    // 4. Cria PaymentIntent via API
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

    if (!clientSecret) throw new Error("Erro ao criar pagamento.");

    // 5. Confirma pagamento com Stripe.js
    const stripe = await (window as any).Stripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: customerName,
        },
      },
    });

    if (result.error) {
      console.error("Erro no pagamento:", result.error.message);
      throw new Error(result.error.message);
    }

    if (result.paymentIntent.status === "succeeded") {
      console.log("Pagamento confirmado!");

      // ✅ Aqui o webhook já atualiza o pedido como "paid"
      return { success: true, pedidoId };
    }

    return { success: false, error: "Pagamento não confirmado." };
  } catch (error: any) {
    console.error("Erro ao finalizar pedido:", error);
    return { success: false, error: error.message };
  }
}
