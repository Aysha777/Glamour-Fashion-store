const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  purchaseAmount: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value >= 0,
      message: "Purchase amount must be a non-negative number",
    },
  },
  discountPercentage: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value >= 0,
      message: "Discount percentage must be a non-negative number",
    },
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (endDate) {
        return endDate > this.startDate;
      },
      message: "End date must be after start date",
    },
  },
  status: {
    type: String,
    required: true,
    trim: true,
  },
  couponName: {
    type: String,
    required: true,
  },
  // Other coupon fields...
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
