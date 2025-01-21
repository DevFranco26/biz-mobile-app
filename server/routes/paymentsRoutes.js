// File: server/routes/paymentsRoutes.js

const express = require('express');
const { RegisterPayment } = require('../controllers/paymentController.js');

const router = express.Router();

/**
 * POST /api/payments/stripe-webhook
 * This is where Stripe sends charge.succeeded. 
 * If you want signature verification, parse raw body & verify with stripe.webhooks.constructEvent(...).
 */
router.post('/bizbuddy-stripe-webhook', RegisterPayment);

module.exports = router;
