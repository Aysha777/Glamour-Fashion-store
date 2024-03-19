const express = require("express");
const router = express.Router();
const { checkinguseroradmin } = require("../middleware/Auth");
const cartController = require("../controlers/cartController");
const continueShoppingController = require("../controlers/continueShoppingController"); // Import the continueShoppingController

// Route to get cart by ID
router.get("/user/products/cart/:cartId", async (req, res) => {
  const cartId = req.params.cartId;

  try {
    const populatedCart = await cartController.getCartById(cartId);
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get user's cart
router.get("/user/products/cart", async (req, res) => {
  try {
    const userId = req.session.user;
    const cart = await cartController.getUserCart(userId);
    res.render("user/products/cart", { cart });
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.post(
  "/user/cart/continue-shopping",
  checkinguseroradmin,
  async (req, res) => {
    try {
      const userId = req.session.user;
      const redirectPath =
        await continueShoppingController.updateCartAndRedirect(userId); // Call the function from continueShoppingController
      res.redirect("/user/products/checkout"); // Redirect to the checkout page
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

module.exports = router;
