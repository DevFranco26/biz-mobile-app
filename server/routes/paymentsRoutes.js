// File: server/routes/paymentsRoutes.js
const express = require("express");
const bodyParser = require("body-parser");
const { CreatePaymentIntent, RegisterPayment } = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/create-payment-intent", CreatePaymentIntent);
router.post("/stripe-webhook", bodyParser.raw({ type: "application/json" }), RegisterPayment);

module.exports = router;
