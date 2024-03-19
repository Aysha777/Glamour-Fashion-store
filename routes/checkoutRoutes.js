const express = require("express");
const router = express.Router();
const { checkinguseroradmin } = require("../middleware/Auth");
const checkoutController = require("../controlers/checkoutController");

router.get("/user/products/checkout", checkoutController.renderCheckoutPage);

module.exports = router;
