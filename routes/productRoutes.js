const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const productController = require("../controlers/pdtController");

// Define a route to handle requests for viewing product details
router.get("/product/:orderId/:itemId", productController.getProductDetails);

module.exports = router;
