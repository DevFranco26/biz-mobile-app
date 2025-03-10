const express = require("express");
const router = express.Router();
const { getUserEmail, getUserProfile, signIn, signOut } = require("@controllers/Account/accountSigninController");
const { getAllSubscriptionPlans, checkCompanyName, checkUsername, signUp } = require("@controllers/Account/accountSignupController");
const { deleteAccount, deleteUserAccountForGoogle } = require("@controllers/Account/accountDeleteController");

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

// DELETE ACCOUNT FLOW
router.delete("/delete-account", deleteAccount);
router.post("/user-delete", deleteUserAccountForGoogle);

module.exports = router;
