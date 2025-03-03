// File: server/controllers/subscriptionPlansController.js
const { prisma } = require("../config/database");

// Get all subscription plans.
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlans.findMany({
      orderBy: { planName: "asc" },
    });
    return res.status(200).json({
      message: "Subscription plans retrieved successfully.",
      data: plans,
    });
  } catch (error) {
    console.error("Error getting subscription plans:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Create a new subscription plan.
exports.createPlan = async (req, res) => {
  try {
    const { planName, rangeOfUsers, price, description, features } = req.body;
    const existing = await prisma.subscriptionPlans.findFirst({
      where: { planName, rangeOfUsers },
    });
    if (existing)
      return res.status(400).json({
        message: `Plan with planName="${planName}" and rangeOfUsers="${rangeOfUsers}" already exists.`,
      });
    const newPlan = await prisma.subscriptionPlans.create({
      data: {
        planName,
        rangeOfUsers,
        price: price || 0,
        description: description || "",
        features: features || {},
      },
    });
    return res.status(201).json({
      message: "Subscription plan created successfully.",
      data: newPlan,
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update a subscription plan.
exports.updatePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { planName, rangeOfUsers, price, description, features } = req.body;
    const plan = await prisma.subscriptionPlans.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ message: "Subscription plan not found." });
    if ((planName && planName !== plan.planName) || (rangeOfUsers && rangeOfUsers !== plan.rangeOfUsers)) {
      const exists = await prisma.subscriptionPlans.findFirst({
        where: {
          planName: planName || plan.planName,
          rangeOfUsers: rangeOfUsers || plan.rangeOfUsers,
          NOT: { id },
        },
      });
      if (exists)
        return res.status(400).json({
          message: "Another plan with that planName and rangeOfUsers exists.",
        });
    }
    const updatedPlan = await prisma.subscriptionPlans.update({
      where: { id },
      data: {
        planName: planName !== undefined ? planName : plan.planName,
        rangeOfUsers: rangeOfUsers !== undefined ? rangeOfUsers : plan.rangeOfUsers,
        price: price !== undefined ? price : plan.price,
        description: description !== undefined ? description : plan.description,
        features: features !== undefined ? features : plan.features,
      },
    });
    return res.status(200).json({
      message: "Subscription plan updated successfully.",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a subscription plan.
exports.deletePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const plan = await prisma.subscriptionPlans.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ message: "Subscription plan not found." });
    await prisma.subscriptionPlans.delete({ where: { id } });
    return res.status(200).json({ message: "Subscription plan deleted successfully." });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
