const Cart = require("../models/cartModel");

const continueShoppingController = {};

continueShoppingController.updateCartAndRedirect = async (userId) => {
  try {
    // Fetch the user's cart data
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Calculate subtotal for each item in the cart
    cart.items.forEach((item) => {
      item.subtotal = item.product.price * item.quantity;
    });

    // Calculate the new total price based on the cart items
    const newTotalPrice = calculateTotalPrice(cart.items);

    // Update the totalPrice field in the cart
    cart.totalPrice = newTotalPrice;

    // Save the cart with the updated total price
    await cart.save();

    return "/user/products/checkout"; // Adjust the path as needed
  } catch (error) {
    console.error(
      "Error updating total price during continue shopping:",
      error
    );
    throw error;
  }
};

function calculateTotalPrice(items) {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

module.exports = continueShoppingController;
