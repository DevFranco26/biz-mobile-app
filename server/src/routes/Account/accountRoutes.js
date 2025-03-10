const express = require("express");
const router = express.Router();
const authenticateToken = require("@middlewares/authMiddleware");
const { getUserEmail, getUserProfile, signIn, signOut } = require("@controllers/Account/accountSigninController");
const { getAllSubscriptionPlans, checkCompanyName, checkUsername, signUp } = require("@controllers/Account/accountSignupController");
const deleteAccountController = require("@controllers/Account/accountDeleteController");

// SIGN-IN FLOW
router.get("/get-user-email", getUserEmail);
router.get("/profile", getUserProfile);
router.get("/sign-in", signIn);
router.post("/sign-out", signOut);

// SIGN-UP FLOW
router.get("/plans", getAllSubscriptionPlans);
router.get("/check-company-name", checkCompanyName);
router.get("/check-username", checkUsername);
router.post("/sign-up", signUp);

// Account Deletion Endpoint (protected)
router.delete("/delete", authenticateToken, deleteAccountController);

module.exports = router;
