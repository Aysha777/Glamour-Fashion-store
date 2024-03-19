const Cart = require("../models/cartModel");
const { itemsPerPage } = require("./placeOrderController");

const renderPlaceOrderPage = async (req, res) => {
  try {
    const userId = req.session.user;

    // Fetch the cart data
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    // Assuming cart is defined and contains items
    const allItems =
      cart && cart.items && Array.isArray(cart.items) ? cart.items : [];
    const totalPrice =
      cart && typeof cart.totalPrice === "number" ? cart.totalPrice : 0;

    const currentPage = req.query.page || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedItems = allItems.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allItems.length / itemsPerPage);

    res.render("user/products/placeorder", {
      cart: { items: allItems },
      currentPage,
      totalPages,
      totalPrice,
    });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).send("Internal Server Error");
  }
};
