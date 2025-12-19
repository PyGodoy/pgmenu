const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { restauranteStripeId, valorEmCentavos, pedidoId } = req.body;

  if (!restauranteStripeId || !valorEmCentavos || !pedidoId) {
    return res
      .status(400)
      .json({ error: "Dados incompletos para criar pagamento." });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: valorEmCentavos,
      currency: "brl",
      payment_method_types: ["card"],
      description: `Pedido #${pedidoId} via PG Menu`,
      on_behalf_of: restauranteStripeId,
      transfer_data: {
        destination: restauranteStripeId,
      },
      application_fee_amount: Math.floor(valorEmCentavos * 0.1), // 10% de comissão
      metadata: {
        pedido_id: pedidoId,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    res.status(500).json({
      error: "Erro ao criar pagamento",
      details: err.message,
    });
  }
}
