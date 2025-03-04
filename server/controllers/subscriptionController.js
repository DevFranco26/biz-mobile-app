// File: server/controllers/subscriptionController.js
const { prisma } = require("../config/database");

exports.getAllSubscriptionsForSuperAdmin = async (req, res) => {
  try {
    const subscriptions = await prisma.subscriptions.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true, domain: true } },
        plan: { select: { id: true, planName: true, rangeOfUsers: true, price: true, features: true } },
      },
    });
    return res.status(200).json({ message: "All subscriptions retrieved successfully.", data: subscriptions });
  } catch (error) {
    console.error("Error in getAllSubscriptionsForSuperAdmin:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const subscription = await prisma.subscriptions.findFirst({
      where: { companyId, status: "active", expirationDateTime: { gt: new Date() } },
      include: { plan: true },
    });
    if (!subscription) return res.status(404).json({ message: "No active subscription found." });
    return res.status(200).json({ message: "Current subscription retrieved.", data: subscription });
  } catch (error) {
    console.error("Error in getCurrentSubscription:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.upgradeSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { planId, paymentMethod } = req.body;
    const plan = await prisma.subscriptionPlans.findUnique({ where: { id: Number(planId) } });
    if (!plan) return res.status(400).json({ message: "Invalid subscription plan ID." });
    // Cancel any active subscription
    await prisma.subscriptions.updateMany({
      where: { companyId, status: "active", expirationDateTime: { gt: new Date() } },
      data: { status: "canceled" },
    });
    const now = new Date();
    const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const newSubscription = await prisma.subscriptions.create({
      data: {
        companyId,
        planId: plan.id,
        paymentMethod: paymentMethod || null,
        paymentDateTime: now,
        expirationDateTime: expiration,
        renewalDateTime: expiration,
        status: "active",
      },
    });
    return res.status(201).json({ message: "Subscription upgraded successfully.", data: newSubscription });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.cancelCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const currentSub = await prisma.subscriptions.findFirst({
      where: { companyId, status: "active", expirationDateTime: { gt: new Date() } },
    });
    if (!currentSub) return res.status(404).json({ message: "No active subscription to cancel." });

    // Cancel the active subscription
    await prisma.subscriptions.update({
      where: { id: currentSub.id },
      data: { status: "canceled" },
    });

    // Create a new subscription row using the free plan (planId = 1)
    const now = new Date();
    const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const newSubscription = await prisma.subscriptions.create({
      data: {
        companyId,
        planId: 1, // Free plan; ensure your free plan has id 1
        paymentMethod: "free",
        paymentDateTime: now,
        expirationDateTime: expiration,
        renewalDateTime: expiration,
        status: "active",
      },
    });
    return res.status(200).json({ message: "Subscription switched to free plan successfully.", data: newSubscription });
  } catch (error) {
    console.error("Error in cancelCurrentSubscription:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
