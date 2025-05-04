import { createClient } from "@supabase/supabase-js";
import { buffer } from "micro";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const pedidoId = paymentIntent.metadata.pedido_id;

    const { error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", pedidoId);

    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      return res.status(500).json({ error: "Erro ao atualizar pedido" });
    }

    console.log(
      `Pagamento confirmado e pedido ${pedidoId} atualizado com sucesso.`
    );
  }

  res.status(200).json({ received: true });
}
