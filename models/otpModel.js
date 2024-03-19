const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    userId: { type: String, ref: 'user', required: true }, // Assuming userId is the user's email
    otp: String,
    timestamp: { type: Date, default: Date.now, expires: '1m' }, // Set expiration time to 1 minute
    // other fields as needed
});

const OTPModel = mongoose.model('OTP', otpSchema);

module.exports = OTPModel;