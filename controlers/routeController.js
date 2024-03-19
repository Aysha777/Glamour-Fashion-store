const express = require("express");
const router = express.Router();
const resetPasswordController = require("../controlers/resetPasswordController");

// Registration Page
router.get("/registration", (req, res) => {
  res.render("registration");
});

// Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/resetpassword", resetPasswordController.renderResetPasswordPage);
router.post("/resetpassword", resetPasswordController.resetPassword);

module.exports = router;
