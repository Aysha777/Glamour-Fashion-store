const mongoose = require("mongoose");

const orderDetailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Assuming you have a User model
    required: true,
  },
  items: {
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        subtotal: {
          type: Number,
          required: true,
          default: 0,
        },
        productImage: {
          ref: "products",
          type: [String],
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    default: [],
  },

  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  billingDetails: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    companyName: String,
    country: String,
    billingAddress: {
      type: String,
      required: true,
    },
    billingAddress2: String,
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    payment_option: {
      type: String,
      required: true,
    },
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
  orderStatus: {
    type: String,
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isPaid:{
    type: Boolean,
    default:false
  }
});

const OrderDetail = mongoose.model(
  "OrderDetail",
  orderDetailSchema,
  "orderdetas"
);

module.exports = OrderDetail;
