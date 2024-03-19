const OrderDetails = require("../models/orderdetailsModel");
const { Product } = require("../models/productModel");
const OrderStatus = require("../models/orderStatusModel");
const { formatDate } = require("../helpers");

exports.getTotalProductsCount = async () => {
  try {
    // Fetch total number of products from the database
    const totalProductsCount = await Product.countDocuments();

    return totalProductsCount;
  } catch (error) {
    console.error("Error fetching total products count:", error);
    throw error;
  }
};

exports.getProductDetails = async (req, res) => {
  const orderId = req.params.orderId;
  const itemId = req.params.itemId;

  try {
    // Fetch order details from the "orderdetails" collection based on orderId
    const orderDetails = await OrderDetails.findOne({ _id: orderId });

    if (!orderDetails) {
      return res.status(404).send("Order not found");
    }

    // Find the item with the specified itemId
    const item = orderDetails.items.find((item) => String(item._id) === itemId);

    if (!item) {
      return res.status(404).send("Item not found in order");
    }

    const product = await Product.findOne({ _id: item.product });

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const orderStatus = await OrderStatus.findOne({ orderId: orderId });
    const orderStatuses = await OrderStatus.find({ orderId: orderId });
    function formatDate(date) {
      const formattedDate = new Date(date);
      const options = { year: "numeric", month: "long", day: "numeric" };
      return formattedDate.toLocaleDateString("en-US", options);
    }
    // Render the order details page with fetched product details
    res.render("user/products/orderdetails", {
      product: {
        product_title: product.product_title,
        size: product.size,
        price: product.price,
        productImage: item.productImage, // Assuming this is already available in the item
      },
      billingDetails: orderDetails.billingDetails,
      formatDate: formatDate,
      orderStatus: orderStatus,
      orderStatuses: orderStatuses,
      orderId: orderId,
      productId: item.product,
      products: product,
      order: orderDetails,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).send("Internal Server Error");
  }
};
