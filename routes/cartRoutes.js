const express = require("express");
const router = express.Router();
const { checkinguseroradmin } = require("../middleware/Auth");
const Cart = require("../models/cartModel");

// Route for adding a product to the user's cart
router.post("/cart/add", checkinguseroradmin, async (req, res) => {
  try {
    console.log("heyyyyy addd aayy");
    const { productId, quantity } = req.body;
    const userId = req.session.user;

    // Find the user's cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // If the user doesn't have a cart, create a new one
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      // If the product is already in the cart, update the quantity
      existingItem.quantity += quantity;
    } else {
      // If the product is not in the cart, add it
      cart.items.push({ product: productId, quantity });
    }

    // Save the updated cart
    await cart.save();

    res.status(200).send("Product added to cart successfully");
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/cart/remove", checkinguseroradmin, async (req, res) => {
  try {
    console.log("sahdano ipo remove aaku cartRoutes.js");
    const { itemId } = req.body;
    const userId = req.session.user;

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    // Remove the item from the cart based on itemId
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    // Save the updated cart
    await cart.save();

    res.status(200).send("Item removed from cart successfully");
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/cart/updateQuantity", checkinguseroradmin, async (req, res) => {
  const { productId, quantity } = req.body;
  console.log(req.body);
  try {
    console.log("reached updation");
    const result = await cartController.updateQuantity(productId, quantity);
    // Send a success response to the client
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    // Handle any errors and send an error response to the client
    console.error("Error updating item quantity:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
