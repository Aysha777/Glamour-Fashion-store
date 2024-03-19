// controllers/checkoutController.js

const Cart = require("../models/cartModel");

const checkoutController = {};

checkoutController.renderCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.user;

    // Fetch the user's cart data
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    cart.items.forEach((item) => {
      item.subtotal = item.product.price * item.quantity;
    });
    // Calculate the new total price based on the cart items
    const newTotalPrice = calculateTotalPrice(cart.items);

    // Update the totalPrice field in the cart
    cart.totalPrice = newTotalPrice;

    // Save the cart with the updated total price
    await cart.save();

    // Render the checkout page with the cart data
    res.render("user/products/checkout", {
      cart,
    });
  } catch (error) {
    console.error("Error rendering checkout page:", error);
    res.status(500).send("Internal Server Error");
  }
};

function calculateTotalPrice(items) {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

module.exports = checkoutController;
