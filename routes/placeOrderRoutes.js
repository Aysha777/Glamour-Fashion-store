const express = require("express");
const router = express.Router();
const placeOrderController = require("../controlers/placeOrderController");
const OrderDetail = require("../models/orderdetailsModel");
const { isLogged } = require("../middleware/Auth");
const User = require("../models/userModel");
// Route handler for getting the place order page
router.get(
  "/user/products/placeorder",
  placeOrderController.renderPlaceOrderPage
);
router.get("/addresses", isLogged, async (req, res) => {
  try {
    console.log("address edkan etheen @placreorderroue");
    // Fetch saved addresses from the database
    const addresses = await OrderDetail.find({ user: req.session.user }).select(
      "billingDetails"
    );

    console.log("Saved address:", addresses);
    // Render the addresses as options for the dropdown menu
    const options = addresses.map(
      (address) =>
        `<option value="${address._id},${address.billingDetails.firstName},${address.billingDetails.lastName},${address.billingDetails.companyName},${address.billingDetails.billingAddress},${address.billingDetails.billingAddress2},${address.billingDetails.city},${address.billingDetails.state},${address.billingDetails.zipcode},${address.billingDetails.phone},${address.billingDetails.email}">${address.billingDetails.firstName},${address.billingDetails.lastName},${address.billingDetails.companyName},${address.billingDetails.billingAddress},${address.billingDetails.billingAddress2},${address.billingDetails.city},${address.billingDetails.state},${address.billingDetails.zipcode},${address.billingDetails.phone},${address.billingDetails.email}</option>`
    );

    console.log("options:", options);
    // Send the generated options back to the client
    res.send(options.join(""));
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
// Route handler for placing an order
router.post("/user/products/placeorder", placeOrderController.placeOrder);

router.post("/user/products/placeorder/confirm", (req, res) => {
  console.log("Reached the confrim paycallback route (post)");
  placeOrderController.confirmOnlinePayment(req, res);
});
router.post("/user/products/placeorder/reject", (req, res) => {
  console.log("Reached the confrim paycallback route (post)");
  placeOrderController.rejectOnlinePayment(req, res);
});

// router.post("/razorpay/callback", (req, res) => {
//   console.log("Reached the Razorpay callback route (POST)");
//   placeOrderController.handleRazorpayPayment(req, res);
// });

module.exports = router;
