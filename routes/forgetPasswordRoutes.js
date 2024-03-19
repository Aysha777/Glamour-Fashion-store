const express = require("express");
const router = express.Router();
const forgetPasswordController = require("../controlers/forgetPasswordController");

router.get(
  "/forgetpassword",
  forgetPasswordController.renderForgetPasswordPage
);

module.exports = router;
