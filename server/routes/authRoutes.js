// File: server/routes/authRoutes.js
const express = require("express");
const { signIn, signOut, getCurrentUser, updateCurrentUser } = require("../controllers/authController.js");
const { getStarted, checkCompanyName, checkEmail } = require("../controllers/onboardingController.js");
const authenticate = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.post("/sign-in", signIn);
router.post("/sign-out", signOut);
router.post("/get-started", getStarted);
router.get("/check", checkCompanyName);
router.get("/check-email", checkEmail);
router.use(authenticate);
router.get("/user", getCurrentUser);
router.put("/user", updateCurrentUser);

module.exports = router;
