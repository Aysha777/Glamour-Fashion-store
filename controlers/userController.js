const bcrypt = require("bcrypt");
const { render } = require("ejs");
const session = require("express-session");
const { message } = require("prompt");
const { Product, Category, Subcategory } = require("../models/productModel");
const path = require("path");
const nodemailer = require("nodemailer");
const OTPModel = require("../models/otpModel");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const OrderDetail = require("../models/orderdetailsModel");
const { formatDate } = require("../helpers");
const OrderStatus = require("../models/orderStatusModel");

const generateOTP = (length) => {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

const sendOTPByEmail = async (receiverEmail, OTP, userId, callback) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.email) {
      console.error("User not found or email not provided");
      return;
    }

    const email = user.email;

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ayshamottayil@gmail.com",
        pass: "oief jexq dczu yxsp",
      },
    });

    const expirationTimeInSeconds = 60; // 1 minute

    const mailOptions = {
      from: "ayshamottayil@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: `
            <p>Your OTP for registration is: ${OTP}. This OTP will expire in 1 minute.</p>
            `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Set a timer for 1 minute (60,000 milliseconds) to invoke the callback
    setTimeout(() => {
      if (typeof callback === "function") {
        callback(); // Invoke the callback function after the timer expires
      }
    }, expirationTimeInSeconds * 1000);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const setEmailReceived = (userId) => {
  // Your implementation here
  console.log(`Email received for user ${userId}`);
};

const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    console.log("Reached the registration page");
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const loadForgetpassword = async (req, res) => {
  try {
    console.log("reached forget password");
    res.render("forgetpassword");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .render("registration", { message: "User already exists." });
    }

    const spassword = await securepassword(password);
    const user = new User({
      name,
      email,
      password: spassword,
      mobile,
    });

    const userData = await user.save();
    console.log(userData);

    if (userData) {
      // Set user session after successful registration
      req.session.user = userData._id;
      const OTP = generateOTP(6);
      const otpData = new OTPModel({
        userId: userData._id,
        otp: OTP,
      });

      // Store the OTP in the database or session (for comparison later)
      await otpData.save();

      // Send OTP via email
      await sendOTPByEmail(email, OTP, userData._id);

      // Proceed to render OTP entry page after successful registration
      return res.render("otpEntryPage", { email, userId: userData._id });
    } else {
      return res
        .status(500)
        .render("registration", { message: "Registration failed." });
    }
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .render("registration", { message: "Internal server error." });
  }
};

const loadlogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const userValid = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    // console.log(user)
    if (!user) {
      return res.render("login", { message: "user not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", { message: "wrong password" });
    }

    req.session.user = user._id;
    res.redirect("/home");
  } catch (error) {
    console.log("uservalid");
    console.log(error.message);
  }
};

const renderOTPVerification = (req, res) => {
  const email = req.params.email;
  const userId = req.query.userId; // or retrieve email from request body or session
  res.render("otpEntryPage", { email, userId }); // Render the OTP verification page
};

const loadHome = async (req, res) => {
  try {
    const user = await User.findById(req.session.user); // Assuming the user ID is stored in req.session.user

    if (!user) {
      return res.render("user/home", { error: "User not found", user: null });
    }

    if (user.is_admin === 1) {
      req.session.admin = user._id;

      // Redirect to admin dashboard if user is an admin
      return res.render("admin/dash");
    } else {
      req.session.user = user._id;

      // Render the regular user home page
      return res.render("user/home", { user, error: null });
    }
  } catch (error) {
    res.render("user/home", { error: "Something went wrong", user: null });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error logging out");
    } else {
      res.redirect("/user/login");
    }
  });
};

const addToCart = async (req, res, next) => {
  try {
    console.log("addToCart reached");

    const { productId, quantityDisplay } = req.body;
    console.log(req.body);
    const userId = req.session.user;

    console.log("userid:", userId);
    console.log("quantity", quantityDisplay);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    console.log("Product details:", product);
    console.log("Stock of product with ID", productId, "is", product.stock);

    // Check if the product is in stock
    if (product.stock <= 0) {
      console.log("Product is out of stock");
      req.flash("addToCartSuccessMessage", "Product is out of stock");
      // Render the view with the error message
      return res.render("user/products/pdtview", {
        product,
        quantityDisplay: product.quantity,
        cart: null,
        addToCartErrorMessage: null,
        addToCartSuccessMessage: req.flash("addToCartSuccessMessage")[0],
      });
    }

    // Calculate total quantity of the product already in the cart
    const totalQuantityInCart = user.cart
      ? user.cart.reduce((total, cartItem) => {
          if (cartItem.productId === productId) {
            return total + cartItem.quantity;
          }
          return total;
        }, 0)
      : 0;

    console.log("total quantity in cart:", totalQuantityInCart);

    // Calculate the remaining stock after deducting the quantity in the cart
    const remainingStock = product.stock - totalQuantityInCart;

    if (parseInt(quantityDisplay) <= remainingStock) {
      // If selected quantity is less than or equal to remaining stock, add to cart
      // Check if user.cart is defined
      if (!user.cart) {
        user.cart = [];
      }

      // Check if the product is already in the user's cart
      const isProductInCart = user.cart
        ? user.cart.some((item) => item.productId === productId)
        : false;
      if (isProductInCart) {
        return res.status(400).send("Product is already in the cart");
      }

      // Add the product to the user's cart
      user.cart.push({ productId, quantity: parseInt(quantityDisplay) });
      await user.save();

      // Subtract the quantity from the stock
      product.stock -= parseInt(quantityDisplay);
      await product.save();

      // Create or update the cart document
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
        });
      }

      // Check if the product is already in the cart items
      const existingItem = cart.items.find((item) =>
        item.product.equals(productId)
      );
      if (existingItem) {
        existingItem.quantity += parseInt(quantityDisplay);
      } else {
        // Calculate subtotal
        const subtotal = product.price * parseInt(quantityDisplay);

        cart.items.push({
          product: productId,
          quantity: parseInt(quantityDisplay),
          productImage: product.images[0], // Assuming product.images is an array and you want the first image URL
          productTitle: product.product_title,
          price: product.price,
          subtotal: subtotal,
        });
      }

      // Calculate total price
      cart.totalPrice = calculateTotalPrice(cart.items);

      await cart.save();
      console.log("cart item:", cart);
      req.flash(
        "addToCartSuccessMessage",
        "Product added to cart successfully"
      );

      // Render the view with the updated data
      return res.render("user/products/pdtview", {
        product,
        quantityDisplay: product.quantity,
        cart,
        addToCartSuccessMessage: req.flash("addToCartSuccessMessage")[0],
        addToCartErrorMessage: null,
      });
    } else {
      // If selected quantity exceeds remaining stock, show error message
      req.flash(
        "addToCartSuccessMessage",
        "Selected quantity exceeds available stock"
      );
      // Render the view with the error message
      return res.render("user/products/pdtview", {
        product,
        quantityDisplay: product.quantity,
        cart: null,
        addToCartErrorMessage: null,
        addToCartSuccessMessage: req.flash("addToCartSuccessMessage")[0],
      });
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).send(`Internal Server Error: ${error.message}`);
  }
};


function calculateTotalPrice(items) {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

// const removeFromCart = async (req, res, next) => {
//   try {
//     console.log("removepdt @ usercontrolelr");
//     const itemId = req.body.itemId; // Get the item ID from the request body
//     if (!itemId) {
//       throw new Error("Item ID is missing in the request body");
//     }

//     const userId = req.session.user; // Get the user ID from the session
//     console.log("userid:", userId);
//     // Query the cart using the user ID
//     const cart = await Cart.findOne({ user: userId });

//     if (!cart) {
//       throw new Error("Cart not found for the user");
//     }

//     // Find the index of the item to remove
//     const itemIndex = cart.items.findIndex(
//       (item) => item._id.toString() === itemId
//     );

//     if (itemIndex === -1) {
//       throw new Error("Item not found in the cart");
//     }

//     // Remove the item from the cart's items array
//     cart.items.splice(itemIndex, 1);

//     // Recalculate the total price based on the remaining items
//     cart.totalPrice = calculateTotalPrice(cart.items);

//     // Save the updated cart
//     await cart.save();

//     // Send a success response
//     res.status(200).send("Item removed from cart successfully");
//   } catch (error) {
//     console.error("Error removing item from cart:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

const removeFromCart = async (req, res, next) => {
  try {
    console.log("removepdt @ usercontrolelr");
    const itemId = req.body.itemId; // Get the item ID from the request body
    if (!itemId) {
      throw new Error("Item ID is missing in the request body");
    }

    const userId = req.session.user; // Get the user ID from the session
    console.log("userid:", userId);
    // Query the cart using the user ID
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      throw new Error("Cart not found for the user");
    }

    // Find the item to remove
    const item = cart.items.find((item) => item._id.toString() === itemId);

    if (!item) {
      throw new Error("Item not found in the cart");
    }

    // Restore the stock quantity of the product
    if (item.product) {
      item.product.stock += item.quantity;
      await item.product.save();
    }

    // Find the index of the item to remove
    const itemIndex = cart.items.findIndex(
      (cartItem) => cartItem._id.toString() === itemId
    );

    if (itemIndex === -1) {
      throw new Error("Item not found in the cart");
    }

    // Remove the item from the cart's items array
    cart.items.splice(itemIndex, 1);

    // Recalculate the total price based on the remaining items
    cart.totalPrice = calculateTotalPrice(cart.items);

    // Save the updated cart
    await cart.save();

    // Send a success response
    res.status(200).send("Item removed from cart successfully");
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).send("Internal Server Error");
  }
};

// const updateQuantity = async (req, res) => {
//   console.log("Reached @ usercontroller for updating quantity");

//   // Get itemId, productId, and quantity from the request body
//   const { itemId, productId, quantity } = req.body;
//   console.log(req.body);
//   console.log("Updating quantity for product:", productId, "to", quantity);

//   try {
//     // Perform user authentication check
//     // if (!req.session.user) {
//     //   console.error("User not authenticated or user ID not found in request");
//     //   return res.status(401).json({
//     //     error: "User not authenticated or user ID not found in request",
//     //   });
//     // }

//     // Update the quantity of the item in the cart for the user
//     const userId = req.session?.user?._id;
//     // const updatedCart = await Cart.findOne(
//     //   { user: new ObjectId(userId), "items._id": new ObjectId(itemId) } // Find the cart with the user ID and the specified item ID
//     // );

//     const updatedCart = await Cart.findOneAndUpdate(
//       { user: userId, "items.product": productId }, // Find the cart with the user ID and the specified item ID
//       { $set: { "items.$.quantity": quantity } }, // Update the quantity of the matching item
//       { new: true } // Return the updated cart
//     );

//     // const updatedCart = await Cart.findOneAndUpdate(
//     //   { user: userId, "items._id": itemId }, // Find the cart with the user ID and the specified item ID
//     //   { $set: { "items.$.quantity": quantity } }, // Update the quantity of the specified item
//     //   { new: true } // Return the updated cart document
//     // );

//     console.log(updatedCart, "cart data from cart controller");
//     if (!updatedCart) {
//       console.error("Cart or item not found");
//       return res.status(404).json({ error: "Cart or item not found" });
//     }

//     console.log("Updated cart saved successfully:", updatedCart);

//     // Respond with the updated cart data
//     res.json(updatedCart);
//   } catch (error) {
//     console.error("Error updating quantity in cart:", error);
//     res.status(500).json({ error: "Unable to update quantity in cart" });
//   }
// };

// Function to calculate total price

// const updateQuantity = async (req, res) => {
//   console.log("Reached @ usercontroller for updating quantity");

//   // Get productId and quantity from the request body
//   const { productId, quantity, subtotal } = req.body;
//   console.log(
//     "Updating quantity for product:",
//     productId,
//     "to",
//     quantity,
//     "subtotal:",
//     subtotal
//   );

//   try {
//     // Retrieve the user ID from the session
//     const user = await User.findOne();
//     const userId = (req.session.user = { _id: user._id });

//     console.log("Session:", req.session);

//     console.log("User ID:", userId);

//     const userCart = await Cart.findOne({ user: userId });

//     console.log("usercart", userCart);

//     const result = await Cart.aggregate([
//       // Match the cart with the specified user ID
//       { $match: { user: userId } },
//       // Unwind the items array to access each item individually
//       { $unwind: "$items" },
//       // Match the item with the specified product ID
//       { $match: { "items.product": productId } },
//       // Project only the product price
//       { $project: { _id: 0, price: "$items.product.price" } },
//     ]);

//     console.log(result);
//     // Update the quantity of the specified product in the user's cart
//     const updatedCart = await Cart.findOneAndUpdate(
//       // Find the cart for the user and the specified product
//       { user: userId, "items.product": productId },
//       // Update the quantity of the matched product
//       { $set: { "items.$.quantity": quantity } },
//       // Options to return the updated cart document
//       { new: true }
//     );

//     // Check if the cart or item was not found
//     if (!updatedCart) {
//       console.error("Cart or item not found");
//       return res.status(404).json({ error: "Cart or item not found" });
//     }

//     console.log("Updated cart saved successfully:", updatedCart);

//     // Respond with the updated cart data
//     res.json(updatedCart);
//   } catch (error) {
//     console.error("Error updating quantity in cart:", error);
//     res.status(500).json({ error: "Unable to update quantity in cart" });
//   }
// };

const updateQuantity = async (req, res) => {
  console.log("Reached @ usercontroller for updating quantity");

  // Get productId and quantity from the request body
  const { itemId, productId, quantity, subtotal } = req.body;
  console.log(
    "Updating quantity for product:",
    productId,
    "to",
    quantity,
    "subtotal:",
    subtotal
  );

  try {
    const userId = req.session.user; // Get the user ID from the session

    console.log("User ID:", userId);

    // Find the user's cart
    const userCart = await Cart.findOne({ user: userId });

    if (!userCart) {
      console.error("User cart not found");
      return res.status(404).json({ error: "User cart not found" });
    }

    // Check if the item exists in the cart
    const item = userCart.items.find((item) => item._id.toString() === itemId);

    if (!item) {
      console.error("Item not found in cart");
      return res.status(404).json({ error: "Item not found in cart" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      console.error("Product not found");
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if the updated quantity exceeds available stock
    if (quantity > product.stock) {
      console.error("Quantity exceeds available stock");
      return res
        .status(400)
        .json({ error: "Quantity exceeds available stock" });
    }
    // Update the quantity of the specified product in the user's cart
    // userCart.items[itemIndex].quantity = quantity;

    item.quantity = quantity;

    if (subtotal !== undefined && !isNaN(subtotal)) {
      item.subtotal = parseFloat(subtotal);
    } else {
      // Calculate subtotal based on product price and quantity
      const product = await Product.findById(productId);
      if (!product || !product.price) {
        console.error("Product or product price not found");
        return res
          .status(404)
          .json({ error: "Product or product price not found" });
      }
      item.subtotal = parseFloat(product.price) * quantity;
    }

    await userCart.save();

    console.log("Updated cart saved successfully:", userCart);

    const totalPrice = userCart.items.reduce(
      (total, currentItem) => total + currentItem.subtotal,
      0
    );

    userCart.totalPrice = totalPrice;
    await userCart.save();

    // Respond with the updated cart data
    res.json({
      success: true,
      message: "Quantity updated successfully",
      cart: userCart,
    });
  } catch (error) {
    console.error("Error updating quantity in cart:", error);
    res.status(500).json({ error: "Unable to update quantity in cart" });
  }
};

const renderTshirtPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6;

    const totalCount = await Product.countDocuments({
      product_category:"Men",
      subcategory:"T-shirts",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const tshirtsProducts = await Product.find({
      product_category: "Men",
      subcategory: "T-shirts",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/Tshirts", {
      products: tshirtsProducts || [],
      category: "Men",
      pagination:{
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const rendershirtPage = async (req, res) => {
  try {
    const page = req.query.page || 1; 
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Men",
      subcategory: "Shirts",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Men",
      subcategory: "Shirts",
    })
    .skip((page - 1) * perPage) 
    .limit(perPage);

    res.render("user/products/Shirts", {
      products: shirtsProducts || [],
      category: "Men",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderjeansPage = async (req, res) => {
  try {
    const page = req.query.page || 1; 
    const perPage = 6; 


    const totalCount = await Product.countDocuments({
      product_category: "Men",
      subcategory: "Jeans",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Men",
      subcategory: "Jeans",
    })
    .skip((page - 1) * perPage)
    .limit(perPage); 

    res.render("user/products/Jeans", {
      products: shirtsProducts || [],
      category: "Men",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderwomenjeansPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Women",
      subcategory: "Jeans-women",
    });
    console.log("count of jw:",totalCount);
    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Women",
      subcategory: "Jeans-women",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/jeansw", {
      products: shirtsProducts || [],
      category: "Women",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderkurtiesPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Women",
      subcategory: "Kurties ",
    });

    console.log("count:",totalCount);
    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Women",
      subcategory: "Kurties ",
    })
    .skip((page - 1) * perPage)
    .limit(perPage); 

    res.render("user/products/Kurties", {
      products: shirtsProducts || [],
      category: "Women",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },

    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderwomentshirtsPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Women",
      subcategory: "Tshirts-women",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Women",
      subcategory: "Tshirts-women",
    })
    .skip((page - 1) * perPage)
    .limit(perPage); 

    res.render("user/products/Tshirtw", {
      products: shirtsProducts || [],
      category: "Women",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderkidstshirtsPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Kids",
      subcategory: "Tshirts-kids",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Kids",
      subcategory: "Tshirts-kids",
    })
    .skip((page - 1) * perPage)
    .limit(perPage); 

    res.render("user/products/Tshirtk", {
      products: shirtsProducts || [],
      category: "Kids",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderSweatshirtsPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Kids",
      subcategory: "Tshirts-kids",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Kids",
      subcategory: "Sweatshirts",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/Sweatshirts", {
      products: shirtsProducts || [],
      category: "Kids",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderkidsjeanssPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "Kids",
      subcategory: "Jeans-kids",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "Kids",
      subcategory: "Jeans-kids",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/jeansk", {
      products: shirtsProducts || [],
      category: "Kids",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderbedsheetPage = async (req, res) => {
  try {
    const page = req.query.page || 1; 
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "home",
      subcategory: "Bedsheets",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "home",
      subcategory: "Bedsheets",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/bedsheets", {
      products: shirtsProducts || [],
      category: "home",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const rendercarpetstPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "home",
      subcategory: "carpets",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "home",
      subcategory: "carpets ",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/carpets", {
      products: shirtsProducts || [],
      category: "home",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderdoormatesPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "home",
      subcategory: "Doormates",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "home",
      subcategory: "Doormates",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/doormates", {
      products: shirtsProducts || [],
      category: "home",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const rendernailpolishsPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "beauty",
      subcategory: "nail",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "beauty",
      subcategory: "nail ",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/nailpolish", {
      products: shirtsProducts || [],
      category: "beauty",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const renderlipstickPage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = 6; 

    const totalCount = await Product.countDocuments({
      product_category: "beauty",
      subcategory: "Lipstick",
    });

    const totalPages = Math.ceil(totalCount / perPage);

    const shirtsProducts = await Product.find({
      product_category: "beauty",
      subcategory: "Lipstick ",
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.render("user/products/lipstick", {
      products: shirtsProducts || [],
      category: "Lipstick ",
      pagination: {
        page,
        totalPages,
        itemCount: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.render("error");
  }
};

const filterProducts = async (req, res) => {
  const { color, brand, price } = req.query;

  try {
    let filter = {};

    if (color) {
      filter.color = color;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (price) {
      // Assuming price is a single value, modify it according to your schema
      filter.price = parseInt(price);
    }

    const filteredProducts = await Product.find(filter);

    if (!filteredProducts || filteredProducts.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.json({ products: filteredProducts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchUserDetails = async (req, res, next) => {
  try {
    // Retrieve the user ID from the request parameters
    const userId = req.params.userId;

    if (!userId) {
      throw new Error("User ID not provided");
    }

    // Fetch user details from the database
    const user = await User.findById(userId);

    if (!user) {
      // If user not found, throw an error
      throw new Error("User not found");
    }

    // Attach the user object to the request object for later use
    req.user = user;

    // Call the next middleware or route handler
    next();
  } catch (error) {
    // Pass the error to the error handler middleware
    next(error);
  }
};
const renderUserProfile = async (req, res) => {
  try {
    console.log("renderUserprofiel @ usercontroller");
    // Define the formatDate function
    function formatDate(date) {
      // Convert the date to a JavaScript Date object
      const formattedDate = new Date(date);

      const options = { year: "numeric", month: "long", day: "numeric" };
      return formattedDate.toLocaleDateString("en-US", options);
    }

    const userId = req.session.user;
    console.log("User ID from session:", userId); // Assuming user ID is stored in session
    const user = await User.findById(userId);

    if (!user) {
      // Handle the case where user is null or undefined
      return res.status(404).send("User not found");
    }

    const order = await OrderDetail.findOne({ user: userId }); // Example code to fetch order details
    if (!order) {
      console.log("No order found for this user");
      // Handle the case where no order is found, maybe render a message to the user
      // You may need to customize this part based on your application's requirements
    }

    const ordersList = await OrderDetail.find({ user: userId });
    const orderStatus = await OrderStatus.find();

    console.log("status in renderuserprofile:", orderStatus);
    // Render the user profile page and pass the user object and formatDate function
    res.render("user/products/user-profile", {
      user,
      order,
      formatDate,
      ordersList,
      orderStatus: orderStatus,
      orderStatuses: orderStatus, // Not sure if you need this, but I'm including it for consistency
      message,
    });
  } catch (error) {
    // Handle any errors
    console.error("Error rendering user profile:", error);
    res.status(500).send("Internal Server Error");
  }
};

// const renderUserDetails = async (req, res) => {
//   try {
//     console.log("renderUserDetails @ usercontroller");
//     const user = req.user;

//     // Assuming you fetch orderStatus from somewhere
//     const orderId = req.params.orderId; // Assuming orderId is passed through the URL
//     const order = await OrderDetail.findById(orderId); // Fetch the order details
//     const orderStatus = await OrderStatus.find({ orderId: orderId }); // Fetch the order status    console.log("orderdetails status:",orderStatus);
//     res.render("user/products/user-details", { user, orderStatus,order });
//   } catch (error) {
//     console.error("Error rendering user details:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

const getTotalUsersCount = async () => {
  try {
    // Fetch total number of users from the database
    const totalUsersCount = await User.countDocuments();

    return totalUsersCount;
  } catch (error) {
    console.error("Error fetching total users count:", error);
    throw error;
  }
};

module.exports = {
  loadRegister,
  insertUser,
  loadlogin,
  userValid,
  setEmailReceived,
  loadHome,
  addToCart,
  removeFromCart,
  updateQuantity,
  renderTshirtPage,
  rendershirtPage,
  renderjeansPage,
  filterProducts,
  renderkurtiesPage,
  renderwomentshirtsPage,
  renderwomenjeansPage,
  renderSweatshirtsPage,
  renderkidsjeanssPage,
  renderkidstshirtsPage,
  renderbedsheetPage,
  rendercarpetstPage,
  renderdoormatesPage,
  rendernailpolishsPage,
  renderlipstickPage,
  renderUserProfile,
  // renderUserDetails,
  fetchUserDetails,
  generateOTP,
  sendOTPByEmail,
  renderOTPVerification,
  loadForgetpassword,
  logout,
  securepassword,
  getTotalUsersCount,
};
