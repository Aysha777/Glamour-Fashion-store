const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_title: {
    type: String,
    require: true,
  },
  product_category: {
    type: String,
    require: true,
  },
  subcategory: {
    type: String,
    required: true,
  },
  
  color: {
    type: String,
    require: true,
  },
  sizes: {
    type: [String],
    require: true,
  },
  brand: {
    type: String,
    require: true,
  },
  description: {
    type: String,

    require: true,
  },
  price: {
    type: Number,
  },
  images: {
    type: [String],
  },
  mimages: [
    {
      type: String, 
    },
  ],
  stock: {


    type: Number,
    required: true,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false, // Set default value to false, indicating the product is not deleted by default
  },
});

productSchema.index({
  product_title: "text",
  brand: "text",
  subcategory: "text",
  color: "text",

  description: "text",
});

const Product = mongoose.model("products", productSchema);

async function findById(productId) {
  try {
    const product = await Product.findById(productId);
    return product;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    throw error;
  }
}

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  subcategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false, // Set default value to false, indicating the product is not deleted by default
  },
  // Add other relevant fields as needed
});

categorySchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });

const Category = mongoose.model("Category", categorySchema);

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // Add other relevant fields as needed
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = { Product, Category, Subcategory, findById };

// module.exports = mongoose.model('products',productSchema)
