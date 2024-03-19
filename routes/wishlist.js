const express = require('express');
const router = express.Router();
const wishlistController = require('../controlers/wishlistController');
const { isLogged } = require('../middleware/Auth');

router.post('/add', isLogged, wishlistController.addToWishlist);
router.post('/user/wishlist/remove', (req, res) => {
    const { productId } = req.body;
    console.log("Product ID received:", productId); // Add this line to debug
    // Your logic to remove the item from the wishlist based on the productId
});
router.get('/', isLogged, wishlistController.getWishlistPage);


module.exports = router;
