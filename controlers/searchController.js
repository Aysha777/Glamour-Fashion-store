const { Product } = require("../models/productModel");

const searchProducts = async (req, res) => {
  const query = req.query.query;
  console.log(query);
  try {
    let products;
    if (query) {
      products = await Product.find({
        $or: [
          { product_title: { $regex: ".*" + query + ".*", $options: "i" } },
          { brand: { $regex: ".*" + query + ".*", $options: "i" } },
          { description: { $regex: ".*" + query + ".*", $options: "i" } },
        ],
      });
    } else {
      products = await Product.find({});
    }
    res.render("user/products/searchResults", { products, query });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { searchProducts };
