const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  mobile: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  is_admin: {
    type: Number,
    default: 0,
  },
  is_varified: {
    type: Number,
    default: 0,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiration: {
    type: Date,
  },
  blocked: {
    type: Boolean,
    default: false ,
  }
});

userSchema.statics.findByUseremail = async function (email) {
  return this.findOne({ email });
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("users", userSchema);
