// File: server/controllers/paymentController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { prisma } = require("../config/database");

exports.CreatePaymentIntent = async (req, res) => {
  try {
    const { amount, planId } = req.body;
    if (!amount || !planId) {
      return res.status(400).json({ message: "Missing amount or planId" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customer.id }, { apiVersion: "2020-08-27" });
    res.status(200).json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.RegisterPayment = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log("Received event:", event.type);
    let charge;
    if (event.type === "charge.succeeded") {
      charge = event.data.object;
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const charges = paymentIntent.charges.data;
      if (charges && charges.length > 0) {
        charge = charges[0];
      } else {
        console.error("No charges found on PaymentIntent");
        return res.status(400).send("No charges found on PaymentIntent");
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
      return res.status(200).send(`Unhandled event type: ${event.type}`);
    }
    const amount = charge.amount;
    const currency = charge.currency;
    const emailFromStripe = charge.receipt_email || (charge.billing_details && charge.billing_details.email) || null;
    const createdTimestamp = new Date(charge.created * 1000);
    const paymentData = {
      chargeId: charge.id,
      amount,
      amountCaptured: charge.amount_captured,
      currency,
      paymentMethod: charge.payment_method,
      chargeStatus: charge.status,
      createdTimestamp,
      receiptUrl: charge.receipt_url,
      billingDetails: charge.billing_details,
      shippingDetails: charge.shipping,
      balanceTransactionId: charge.balance_transaction,
      chargeDescription: charge.description,
      paymentOutcome: charge.outcome,
      paymentIntentId: charge.payment_intent,
      receiptEmail: emailFromStripe,
      eventType: event.type,
    };
    let user = null;
    if (emailFromStripe) {
      user = await prisma.users.findFirst({ where: { email: emailFromStripe } });
    }
    if (user) {
      const companyId = user.companyId;
      paymentData.companyId = companyId;
      const subscription = await prisma.subscriptions.findFirst({
        where: { companyId, status: "active" },
        orderBy: { createdAt: "desc" },
      });
      if (subscription) {
        paymentData.subscriptionId = subscription.id;
      }
      await prisma.payments.create({ data: paymentData });
    } else {
      await prisma.payments.create({ data: paymentData });
    }
    res.status(200).send("Payment recorded and subscription updated!");
  } catch (error) {
    console.error("Error in RegisterPayment:", error);
    res.status(500).send("Webhook processing error.");
  }
};
