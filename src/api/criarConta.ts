const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://pgmenu.com/erro",
      return_url: "https://pgmenu.com/sucesso",
      type: "account_onboarding",
    });

    res.status(200).json({
      stripeAccountId: account.id,
      onboardingUrl: accountLink.url,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
