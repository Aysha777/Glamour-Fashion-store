const express = require("express");
const user_route = express.Router();
const Auth = require("../middleware/Auth");
const userController = require("../controlers/userController");
const { isLogedout, isLogged } = require("../middleware/Auth");
const { Product } = require("../models/productModel");
const { fetchUserDetails } = require("../controlers/userController");
const { checkinguseroradmin } = require("../middleware/Auth");
const CartItem = require("../models/cartModel");

user_route.get("/registration", isLogedout, userController.loadRegister);

user_route.post("/registration", isLogedout, userController.insertUser);

user_route.get("/login", isLogedout, userController.loadlogin);

user_route.post("/login", isLogedout, userController.userValid);

user_route.get(
  "/forgetpassword",
  isLogedout,
  userController.loadForgetpassword
);

user_route.get("/home", Auth.isLogged, (req, res) => {
  let success_messages = ["Message 1", "Message 2"];
  let error_messages = ["Error 1", "Error 2"];
  res.render("user/home", {
    success_messages: success_messages,
    error_messages: error_messages,
  });
});

user_route.get("/login", Auth.checkinguseroradmin);

user_route.post("/logout", Auth.logouting, userController.logout);

// user_route.get('/user/home',Auth.isLogged,(req,res) =>{
//     let success_messages = ["Message 1" ,"Message 2"];
//     let error_messages = ["Error 1", "Error 2"];
//     res.render('user/home',{
//         success_messages:success_messages,
//         error_messages: error_messages
//     });
// });

user_route.get("/user/home", Auth.isLogged, userController.loadHome);

user_route.get(
  "/products/Tshirts",
  Auth.isLogged,
  userController.renderTshirtPage
);
user_route.get(
  "/products/Shirts",
  Auth.isLogged,
  userController.rendershirtPage
);
user_route.get(
  "/products/Jeans",
  Auth.isLogged,
  userController.renderjeansPage
);
user_route.get(
  "/products/Tshirtw",
  Auth.isLogged,
  userController.renderwomentshirtsPage
);
user_route.get(
  "/products/Kurties",
  Auth.isLogged,
  userController.renderkurtiesPage
);
user_route.get(
  "/products/jeansw",
  Auth.isLogged,
  userController.renderwomenjeansPage
);
user_route.get(
  "/products/Tshirtk",
  Auth.isLogged,
  userController.renderkidstshirtsPage
);
user_route.get(
  "/products/Sweatshirts",
  Auth.isLogged,
  userController.renderSweatshirtsPage
);
user_route.get(
  "/products/jeansk",
  Auth.isLogged,
  userController.renderkidsjeanssPage
);
user_route.get(
  "/products/bedsheets",
  Auth.isLogged,
  userController.renderbedsheetPage
);
user_route.get(
  "/products/carpets",
  Auth.isLogged,
  userController.rendercarpetstPage
);
user_route.get(
  "/products/doormates",
  Auth.isLogged,
  userController.renderdoormatesPage
);
user_route.get(
  "/products/nailpolish",
  Auth.isLogged,
  userController.rendernailpolishsPage
);
user_route.get(
  "/products/lipstick",
  Auth.isLogged,
  userController.renderlipstickPage
);

user_route.get("/partials/filters", async (req, res) => {
  const { color, brand, price, subcategory } = req.query;
  console.log("Received color:", color);
  console.log("Received brand:", brand);
  console.log("Received price:", price);
  console.log("Received subcategory:", subcategory);

  try {
    let filter = {};

    if (color) {
      filter.color = { $in: color.split(",") };
    }

    if (brand) {
      filter.brand = brand; // Assuming brand is a direct match
    }

    if (price) {
      const priceRanges = {
        one: { $gte: 100, $lte: 999 },
        two: { $gte: 999, $lte: 1999 },
        // Add more ranges as needed
      };

      if (priceRanges[price]) {
        filter.price = priceRanges[price];
      }
      // Assuming price is within a range, modify the filter condition accordingly
      // filter.price = { $lte: parseInt(price) }; // Less than or equal to the selected price
    }

    if (subcategory) {
      filter.subcategory = subcategory; // Assuming subcategory is a direct match
    }

    // Fetch products based on the applied filters
    const filteredProducts = await Product.find(filter);

    res.json({ products: filteredProducts });
    console.log("Filtered Products:", filteredProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

user_route.get("/products/search", async (req, res) => {
  const searchQuery = req.query.query;

  try {
    const searchResults = await Product.find(
      { $text: { $search: searchQuery } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    console.log("Search Results:", searchResults);

    res.json({ products: searchResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// user_route.get('/products/:productId', userController.renderProductDetailsPage);

// user_route.get('/order/:orderId', userController.renderUserDetails);
// user_route.get('/order/:orderId', (req, res, next) => {
//   console.log("Reached /order/:orderId route");
//   next(); // Pass control to the next middleware/route handler
// }, userController.renderUserDetails);

user_route.get(
  "/products/user-profile/",
  Auth.isLogged,
  userController.renderUserProfile
);

user_route.get("/reset-password/:token", (req, res) => {
  const { token } = req.params;
  // Render the reset password page with a form to set a new password
  res.render("resetPassword", { token });
});

user_route.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  // Validate the token and update the user's password in the database
  // Redirect to the login page or show a success message
});

user_route.post("/cart/add", userController.addToCart);

// user_route.post("/cart/add", userController.addToCart, async (req, res) => {
//   try {
//     console.log("/cart/add route reached @ usrroute");
//     const productId = req.body.productId;
//     const quantityDisplay = req.body.quantityDisplay;
//     console.log(productId);

//     console.log(quantityDisplay);
//     // Fetch the product data based on productId
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).send("Product not found");
//     }

//     if (res.locals.addToCartSuccess) {
//       req.flash("cartSuccessMessage", "Product added to cart successfully");
//     } else {
//       req.flash("cartErrorMessage", "Error adding product to cart");
//     }
//     res.render("user/products/pdtview", {
//       product,
//       quantityDisplay: quantityDisplay,
//       cart:res.locals.cart,
//       addToCartSuccessMessage: req.flash("addToCartSuccessMessage")[0],
//       addToCartErrorMessage: req.flash("addToCartErrorMessage")[0],
//     });
//   } catch (error) {
//     console.error("Error fetching product data:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

user_route.post(
  "/cart/remove",
  userController.removeFromCart,
  async (req, res) => {
    try {
      const userId = req.session.user;
      const { itemId } = req.body; // Destructuring to extract itemId from req.body

      // Call the controller function to remove the item from the cart
      const message = await userController.removeFromCart(userId, itemId);

      // Send a success response to indicate that the item was removed
      res.status(200).send(message);
    } catch (error) {
      console.error("Error removing item from cart:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

user_route.post("/cart/updateQuantity", userController.updateQuantity);
user_route.get("/products/order-profile", (req, res) => {
  res.redirect("/user/products/user-profile");
});
user_route.get("/user/products/failure", (req, res) => {
  res.render("user/products/failure");
});

module.exports = user_route;
