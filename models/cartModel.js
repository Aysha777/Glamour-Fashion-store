const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Assuming you have a User model
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1, // Default quantity is 1, adjust as needed
      },
      subtotal: {
        type: Number, // Change to Number
        required: true,
        default: 0, // Default subtotal is 0
      },
      productDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products", // Reference to the products collection
      },
      productImage: {
        type: String, // Assuming the product image is stored as a URL
      },
      // You can add more fields for each item if needed
    },
  ],
  totalPrice: {
    type: Number,
    default: 0, // Default total price is 0
  },
  discountPercentage: {
    type: Number,
    required: true,
    default: 0,
  },
  discountedTotal: {
    type: Number,
    required: true,
    default: 0,
  },
  discountedAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  couponCode: {
    type: String,
  },
  
});

cartSchema.path("items.product").ref("products");

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
