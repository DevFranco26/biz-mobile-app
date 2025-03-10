const express = require("express");
const router = express.Router();
const subscriptionPlanController = require("@controllers/Account/subscriptionPlanController");
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");

router.get("/", subscriptionPlanController.getAllPlans);
router.use(authenticate);
router.use(authorizeRoles("superadmin"));
router.post("/", subscriptionPlanController.createPlan);
router.put("/:id", subscriptionPlanController.updatePlan);
router.delete("/:id", subscriptionPlanController.deletePlan);

module.exports = router;
