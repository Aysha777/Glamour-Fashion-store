// models/OrderStatus.js

const mongoose = require("mongoose");
const Order = require("./orderdetailsModel");

const orderStatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Assuming you have a User model
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming orderId is of type ObjectId
    ref: "Order", // Reference the Order model
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
  },
  productTitle: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

orderStatusSchema.pre("save", async function (next) {
  try {
    // Assuming orderId is related to the order
    const order = await Order.findOne({ orderId: this.orderId });
    if (order) {
      
      this.total = order.totalPrice;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const OrderStatus = mongoose.model("OrderStatus", orderStatusSchema);

module.exports = OrderStatus;
