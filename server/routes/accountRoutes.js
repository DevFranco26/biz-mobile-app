const express = require("express");
const accountController = require("../controllers/accountController.js");
const authenticate = require("../middlewares/authMiddleware.js");

const router = express.Router();

router.delete("/delete", authenticate, accountController.deleteAccount);

router.post("/user-delete", accountController.deleteUserAccount);

module.exports = router;
