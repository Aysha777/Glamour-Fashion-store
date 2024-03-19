const Cart = require("../models/cartModel");

const cartController = {};

cartController.getCartById = async (cartId) => {
  try {
    const populatedCart = await Cart.findById(cartId).populate("items.product");
    return populatedCart;
  } catch (error) {
    console.error("Error fetching cart:", error);
    throw new Error("Internal Server Error");
  }
};

cartController.getUserCart = async (userId) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    return cart;
  } catch (error) {
    console.error("Error fetching cart data:", error);
    throw new Error("Internal Server Error");
  }
};

cartController.removeFromCart = async (itemId) => {
  try {
    console.log("reached ");
    // Remove the item from the cart based on itemId
    await Cart.updateOne({}, { $pull: { items: { _id: itemId } } });
    console.log("Item removed from cart:", itemId);
    return { success: true, message: "Item removed from cart successfully" };
  } catch (error) {
    console.error("Error removing item from cart:", error);
    throw new Error("Internal Server Error");
  }
};

cartController.updateQuantity = async (productId, newQuantity) => {
  try {
    console.log("cartcontroler updateqty");
    const cart = await Cart.findOne({ "items.product": productId });
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Find the item in the cart and update its quantity
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) {
      throw new Error("Item not found in the cart");
    }

    // Update the quantity of the item
    item.quantity = newQuantity;

    // Save the updated cart
    await cart.save();

    console.log("Item quantity updated:", productId, newQuantity);
    return { success: true, message: "Item quantity updated successfully" };
  } catch (error) {
    console.error("Error updating item quantity:", error);
    throw new Error("Internal Server Error");
  }
};

module.exports = cartController;
