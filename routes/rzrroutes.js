
const express = require('express');
const router = express.Router();
const placeOrderController = require('../controlers/placeOrderController');

// // GET route for handling Razorpay callback
// router.get("/razorpay/callback", (req, res) => {
//   console.log("Reached the Razorpay callback route (GET)");
//   placeOrderController.handleRazorpayPayment(req, res);
// });

// POST route for handling Razorpay callback
router.post("/razorpay/callback", (req, res) => {
  console.log("Reached the Razorpay callback route (POST)");
  placeOrderController.handleRazorpayPayment(req, res);
});

module.exports = router;
