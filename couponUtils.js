function generateCouponCode(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let couponCode = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    couponCode += charset[randomIndex];
  }
  return couponCode;
}

module.exports = {
  generateCouponCode,
};
