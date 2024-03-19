// productService.js

const Product = require('../models/productModel');

async function getProductDetails(productId) {
  try {
    const productDetails = await Product.findById(productId);
    return productDetails;
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
}

module.exports = {
  getProductDetails,
};
