// File: src/routes/Account/paymentRoutes.js
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const { createPaymentIntent, createUpgradePaymentIntent, registerPayment } = require("@controllers/Account/paymentController");

// Initial payment intent creation.
router.post("/create-payment-intent", createPaymentIntent);

// Upgrade payment intent creation.
router.post("/create-upgrade-payment-intent", createUpgradePaymentIntent);

// Stripe webhook endpoint (raw body parsing for Stripe signature verification)
router.post("/stripe-webhook", bodyParser.raw({ type: "application/json" }), registerPayment);

module.exports = router;
