const express = require("express");
const router = express.Router();
const passwordController = require("../controlers/pwdcontroller");

// Route to handle form submission for changing password
router.post("/change-password", passwordController.changePassword);

module.exports = router;
