const express = require("express");
const router = express.Router();
const { checkinguseroradmin } = require("../middleware/Auth");
const continueShoppingController = require("../controlers/continueShoppingController");

// Route for updating cart and redirecting to continue shopping page
router.post(
  "/user/cart/continue-shopping",
  checkinguseroradmin,
  async (req, res) => {
    try {
      const userId = req.session.user;
      const redirectPath =
        await continueShoppingController.updateCartAndRedirect(userId);
      res.redirect("/user/products/checkout");
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

module.exports = router;
