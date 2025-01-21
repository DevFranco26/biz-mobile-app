const { Payment, Subscription, SubscriptionPlan, User, Company } = require('../models');
// If you have a separate subscriptionStore or subscriptionController, you might do partial logic there
// But let's keep it here for clarity.

// e.g. check how you do "upgradeSubscription" in your subscriptionController. We'll replicate a simpler version here.

exports.RegisterPayment = async (req, res) => {
    console.log('attempt:', req.body)
  try {
    const eventType = req.body.type;            // e.g. 'charge.succeeded'
    const charge = req.body.data?.object;       // the actual charge object from Stripe
    if (!charge) {
      return res.status(400).send('Invalid charge object.');
    }

    if (eventType === 'charge.succeeded') {
      // 1) Parse relevant fields from the charge
      const amount = charge.amount; // in cents
      const currency = charge.currency;
      const emailFromStripe =
        charge.receipt_email ||
        (charge.billing_details && charge.billing_details.email) ||
        null;

      // "created" is a Unix timestamp in seconds
      const createdTimestamp = new Date((charge.created || 0) * 1000);

      // Build the payment record
      const paymentData = {
        chargeId: charge.id,
        amount,
        amountCaptured: charge.amount_captured || null,
        currency,
        paymentMethod: charge.payment_method || null,
        chargeStatus: charge.status,
        createdTimestamp,
        receiptUrl: charge.receipt_url || null,
        billingDetails: charge.billing_details || null,
        shippingDetails: charge.shipping || null,
        balanceTransactionId: charge.balance_transaction || null,
        chargeDescription: charge.description || null,
        paymentOutcome: charge.outcome || null,
        paymentIntentId: charge.payment_intent || null,
        receiptEmail: emailFromStripe,
        requestId: req.body.request && req.body.request.id,
        idempotencyKey: req.body.request && req.body.request.idempotency_key,
        eventType, // 'charge.succeeded'
      };

      // 2) Try to find the user by email
      let user = null;
      if (emailFromStripe) {
        user = await User.findOne({ where: { email: emailFromStripe } });
      }

      // If there's no user, we can't do much, but let's still store the Payment
      // So we know at least something came in. (You might choose to handle differently.)
      if (!user) {
        // If there's no user with that email, just store payment and done.
        await Payment.create(paymentData);
        return res
          .status(200)
          .send(`Payment saved. No user found for email: ${emailFromStripe}`);
      }

      // 3) We have a user. Let's get their company
      const companyId = user.companyId;
      console.log('john doe company id' , companyId)
      paymentData.companyId = companyId;

      // 4) Find the subscription plan by unique price
      // e.g. plan with `price = (amount / 100).toFixed(2)` or just compare in cents if you store it that way
      // If your DB stores plan.price as a DECIMAL, you might do some rounding logic
      // We'll do integer comparison in cents for simplicity
      const plan = await SubscriptionPlan.findOne({
        where: { price: (amount / 100).toString() }, // if plan.price is stored as string or decimal
      });
      if (!plan) {
        // store the payment, but we can't update subscription
        await Payment.create(paymentData);
        return res
          .status(200)
          .send('Payment saved. No subscription plan found matching that price.');
      }

      // 5) We have a plan. Let's find or create an active subscription for this company
      // If you have your own logic in subscriptionController, call it. Otherwise:
      let subscription = await Subscription.findOne({
        where: {
          companyId,
          status: 'active',
        },
        order: [['createdAt', 'DESC']], // e.g. last active subscription
      });

      // If we have an existing active sub, let's "upgrade" it by changing plan, or create new if none
      if (subscription) {
        // update the subscription to this plan. Or do your own logic for "upgrade"
        await subscription.update({
          planId: plan.id,
          paymentMethod: charge.payment_method || null,
          paymentDateTime: new Date(),
          // expiration in 30 days, or whatever you do
          expirationDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          renewalDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        });
      } else {
        // create a new subscription record
        subscription = await Subscription.create({
          companyId,
          planId: plan.id,
          paymentMethod: charge.payment_method || null,
          paymentDateTime: new Date(),
          expirationDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          renewalDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        });
      }

      // Now that we have a subscription, link the payment to that subscription
      paymentData.subscriptionId = subscription.id;

      // 6) Finally, store the Payment record
      await Payment.create(paymentData);

      return res.status(200).send('Payment recorded and subscription updated!');
    }

    // If not charge.succeeded, just respond 200
    return res.status(200).send(`Unhandled event type: ${eventType}`);
  } catch (error) {
    console.error('Error in RegisterPayment:', error);
    return res.status(500).send('Webhook processing error.');
  }
};
