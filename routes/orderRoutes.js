const express = require("express");
const router = express.Router();
const orderController = require("../controlers/ordersController");
const adminController = require("../controlers/adminController");
// Define route to fetch orders
router.get("/admin/orders", orderController.getOrders);
router.post("/order/save-order-status", (req, res) => {
    console.log("Reached /order/save-order-status route");
    adminController.saveOrderStatus(req, res);
});
router.post("/order/cancel", orderController.cancelOrder);

module.exports = router;
