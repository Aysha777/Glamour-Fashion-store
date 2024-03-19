const Wishlist = require('../models/wishlistModel');

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        const existingWishlistItem = await Wishlist.findOne({ user: userId, productId });

        if (existingWishlistItem) {
            req.session.wishlistErrorMessage = 'Item is already in the wishlist';
        } else {
            await Wishlist.create({ productId, user: userId });
            req.session.wishlistSuccessMessage = 'Product added to wishlist successfully';
        }

        res.redirect(`/pdtview/${productId}`);
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        req.session.wishlistErrorMessage = 'Failed to add product to wishlist';
        res.redirect(`/pdtview/${productId}`);
    }
};

const removeFromWishlist = async (req, res) => {
    console.log("Remove from wishlist method called");

    try {
        const { itemId } = req.body; // Assuming itemId is the _id of the wishlist item
        const userId = req.session.user;

        // Check if the item exists in the wishlist
        const existingWishlistItem = await Wishlist.findById(itemId);

        if (!existingWishlistItem) {
            console.log('Item not found in wishlist', itemId);
            return res.status(404).json({ success: false, message: 'Product not found in wishlist', itemId });
        }

        // If the item exists and belongs to the current user, remove it
        if (existingWishlistItem.user.toString() === userId) {
            await Wishlist.findByIdAndDelete(itemId);
            console.log('Item removed from wishlist:', existingWishlistItem);
            return res.status(200).json({ success: true, message: 'Product removed from wishlist successfully' });
        } else {
            console.log('Unauthorized to delete this item from wishlist');
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this item from wishlist' });
        }
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to remove product from wishlist' });
    }
};
const getWishlistPage = async (req, res) => {
    try {
        const wishlistItems = await Wishlist.find({ user: req.session.user }).populate('productId');
        res.render('user/products/wishlist', { wishlistItems });
    } catch (error) {
        console.error('Error fetching wishlist items:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    addToWishlist,
    removeFromWishlist,
    getWishlistPage,
};
