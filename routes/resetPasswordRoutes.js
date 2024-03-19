const express = require("express");
const router = express.Router();
const resetPasswordController = require("../controlers/resetPasswordController");

router.get("/resetpassword", resetPasswordController.renderResetPasswordPage);
router.post("/resetpassword", resetPasswordController.resetPassword);

module.exports = router;
