const express = require("express");
const Razorpay = require("razorpay");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("express-flash");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const nocache = require("nocache");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const OTPModel = require("./models/otpModel");
const Auth = require("./middleware/Auth");
const userController = require("./controlers/userController");
const routeController = require("./controlers/routeController");
const cartController = require("./controlers/cartController");
const adminController = require("./controlers/adminController");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const placeOrderController = require("./controlers/placeOrderController");
const Cart = require("./models/cartModel");
const User = require("./models/userModel");
const OrderDetail = require("./models/orderdetailsModel");
const { Product } = require("./models/productModel");

const userRoute = require("./routes/userRoutes");
const adminRoute = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const productRoute = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const placeOrderRoutes = require("./routes/placeOrderRoutes");
const searchRoute = require("./routes/searchRoutes");
const resetPasswordRoute = require("./routes/resetPasswordRoutes");
const forgetpasswordRoutes = require("./routes/forgetPasswordRoutes");
const cartRoute = require("./routes/cartRoute");
const checkoutRoutes = require("./routes/checkoutRoutes");
const continueShoppingRoutes = require("./routes/continueShoppingRoutes");
const pwdRoutes = require("./routes/pwdRoutes");
const razorpayRouter = require("./routes/placeOrderRoutes");
const rzrroutes = require("./routes/rzrroutes");

const {
  generateOTP,
  sendOTPByEmail,
  setEmailReceived,
} = require("./controlers/userController");
const productService = require("./services/getProductDetails");
const { addToCart } = require("./controlers/userController");

const app = express();

const mongoUrl = "mongodb://127.0.0.1:27017/user_managment_system";

const store = MongoStore.create({
  mongoUrl: mongoUrl,
});

app.use(cookieParser());
exports.app = app;
const { constants } = require("fs/promises");
const tokenDB = {};

const wishlistController = require("./controlers/wishlistController");
const { formatDate } = require("./helpers");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ayshamottayil@gmail.com",
    pass: "mchy klik lesk qygu",
  },
});

const razorpay = new Razorpay({
  key_id: "rzp_test_U1JmNHMDoFIk7I",
  key_secret: "SQdRLJ9KflIyllvVawyBPotm",
});

app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(nocache());

app.use(
  session({
    secret: "asdfghjkloiuyyjdsh",
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //   maxAge: 3600000,
    //   httpOnly: true,
    //   secure: true,
    // },
    store: store,
  })
);

app.use(flash());
app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.use("/user/products", cartRoutes);
app.use(orderRoutes);
app.use(routeController);
app.use("/webhook", razorpayRouter);

const wishlistRoutes = require("./routes/wishlist");
app.use("/user/products/wishlist", wishlistRoutes);
app.use("/", productRoute);
app.use("/", placeOrderRoutes);
app.use("/search", searchRoute);
app.use("/", resetPasswordRoute);
app.use("/", forgetpasswordRoutes);
app.use("/", cartRoute);
app.use("/", checkoutRoutes);
app.use("/", continueShoppingRoutes);
app.use("/", pwdRoutes);
app.use("user/products/",rzrroutes);
app.get("/", (req, res) => {
  res.render("login");
});

// // Handle Razorpay payment completion callback
// app.post("/user/products/razorpay/callback", placeOrderController.handleRazorpayPayment);

// app.get("/products/user-details", userController.renderUserDetails);

app.get("/otpEntryPage", (req, res) => {
  const successMessage = req.query.successMessage || "";
  const userId = req.query.userId || "";

  res.render("otpEntryPage", { successMessage, userId });
});

app.post("/user/cart/remove", async (req, res) => {
  try {
    console.log("ith index l ave");
    const userId = req.session.user;
    const productIdToRemove = req.body.productId;

    const user = await User.findById(userId).populate({
      path: "items.product",
      options: { strictPopulate: false },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.cart.items = user.cart.items.filter(
      (item) => item.product._id.toString() !== productIdToRemove
    );

    await user.save();

    return res.status(200).json({ message: "Item removed from the cart" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/update-quantity", async (req, res) => {
  try {
    const { productId, change } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const cartItem = cart.items.find((item) => item.product.equals(productId));

    if (!cartItem) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    cartItem.quantity += change;
    cartItem.subtotal = cartItem.quantity * cartItem.product.price;

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    await cart.save();

    res.json({
      newQuantity: cartItem.quantity,
      newSubtotal: cartItem.subtotal,
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function calculateSubtotal(price, quantity) {
  return price * quantity;
}

function calculateTotalPrice(items) {
  return items.reduce((total, item) => {
    // Ensure that each item's subtotal is added to the total
    item.subtotal = calculateSubtotal(item.product.price, item.quantity);
    return total + item.subtotal;
  }, 0);
}

app.post("/user/cart/update-subtotal", async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, subtotal } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    const cartItem = cart.items.find((item) => item.product.equals(productId));

    if (cartItem) {
      cartItem.subtotal = parseFloat(subtotal); // Convert subtotal to a number if needed
      cart.totalPrice = calculateTotalPrice(cart.items); // Update total price if needed
      await cart.save();

      res.status(200).send("Subtotal updated successfully");
    } else {
      res.status(404).send("Cart item not found");
    }
  } catch (error) {
    console.error("Error updating subtotal on the server:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/user/products/success", (req, res) => {
  const successMessage = "Order placed successfully!"; // Use the first message in the array or provide a default message

  res.render("user/products/success", { success: successMessage }); // Assuming you have a success.ejs file in your views folder
});

app.get("/pdtview/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const productDetails = await productService.getProductDetails(productId);

    if (!productDetails) {
      // Handle case where product details are not available
      return res.status(404).render("not-found");
    }

    // Success and error messages for adding to wishlist and cart
    const wishlistErrorMessage = req.session.wishlistErrorMessage;
    const wishlistSuccessMessage = req.session.wishlistSuccessMessage;
    const cartSuccessMessage = req.session.cartSuccessMessage;

    // Clear the session messages after retrieving them
    delete req.session.wishlistErrorMessage;
    delete req.session.wishlistSuccessMessage;
    delete req.session.cartSuccessMessage;

    res.render("user/products/pdtview", {
      product: productDetails,
      wishlistErrorMessage,
      wishlistSuccessMessage,
      cartSuccessMessage,
    });
  } catch (error) {
    // Handle errors, e.g., product not found or other issues
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route for accessing /pdtview with a product ID

app.post("/forgetpassword", async (req, res) => {
  try {
    const email = req.body.email;

    // Generate a unique reset token
    const token = crypto.randomBytes(20).toString("hex");

    // Store the token and expiration time in the user document
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          resetToken: token,
          resetTokenExpiration: new Date(Date.now() + 60 * 60 * 1000), // Set expiration time to 1 hour
        },
      },
      { new: true }
    );

    if (!user) {
      console.log("User not found.");
      return res
        .status(404)
        .render("forgetpassword", { message: "User not found." });
    }

    // Create a URL for the reset page, replace 'example.com' with your actual domain
    const resetURL = `http://localhost:3006/resetpassword?token=${token}&email=${email}`;

    // Send the reset email
    const mailOptions = {
      from: "ayshamottayil@gmail.com",
      to: email,
      subject: "Password Reset",
      html: `<p>Click the following link to reset your password:</p><p><a href="${resetURL}">${resetURL}</a></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .render("forgetpassword", { message: "Error sending reset email" });
      } else {
        console.log("Email sent: " + info.response);
        return res.render("forgetpassword", { email });
      }
    });
  } catch (error) {
    console.error("Error initiating password reset:", error);
    return res
      .status(500)
      .render("forgetpassword", { message: "Internal Server Error" });
  }
});
//
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.render("login", { message: "User not found" });
    }

    // Check if the user is blocked
    if (user.blocked) {
      console.log("User is blocked. Cannot login.");
      return res.render("login", { message: "User is blocked. Cannot login." });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Wrong password");
      return res.render("login", { message: "Wrong password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, "your_secret_key", {
      expiresIn: "1h",
    }); // Adjust expiration time as needed

    // Set JWT token in cookie
    res.cookie("token", token, { maxAge: 3600000, httpOnly: true }); // Adjust maxAge and other options as needed

    // Set user session
    req.session.user = { _id: user._id };
    console.log("User logged session in:", req.session.user);

    // Check if the user is an admin
    if (user.is_admin === 1) {
      req.session.admin = user._id;
      console.log("Admin logged in:", req.session.admin);
      return res.redirect("/admin/dash"); // Redirect to admin dashboard
    } else {
      // User is a regular user
      req.session.user = user._id;
      console.log("User logged in:", req.session.user);
      return res.redirect("/user/home"); // Redirect to user dashboard or home page
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/verifyOTP", async (req, res) => {
  const enteredOTP = req.body.otp;

  try {
    console.log("Entered OTP:", enteredOTP);

    const storedOTP = await OTPModel.findOne({ userId: req.session.user });

    console.log("Stored OTP:", storedOTP);

    if (!storedOTP || !("otp" in storedOTP)) {
      console.log(
        "Stored OTP not found or invalid structure for user:",
        req.session.user
      );
      return res.render("otpEntryPage", {
        errorMessage: "OTP expired or invalid. Please try again.",
      });
    }

    const storedOTPCode = storedOTP.otp;

    if (storedOTP.timestamp && Date.now() - storedOTP.timestamp > 60 * 1000) {
      // OTP expired, delete it from the database
      await OTPModel.deleteOne({ userId: req.session.user });
      console.log("OTP expired:", storedOTPCode);
      return res.render("otpEntryPage", {
        errorMessage: "OTP expired. Please request a new OTP.",
      });
    }

    // Log the nested 'code' value
    console.log("Stored OTP (code):", storedOTPCode);

    if (!isNaN(enteredOTP) && storedOTPCode === enteredOTP) {
      // OTP matches
      console.log("OTP matched. Redirecting...");
      // Remove the stored OTP from the database
      await OTPModel.deleteOne({ userId: req.session.user });
      // Redirect to the user's home page
      return res.redirect("/user/home");
    } else {
      // Invalid OTP
      console.log("Invalid OTP:", enteredOTP, storedOTPCode);
      // Show error message for both invalid and expired OTP
      return res.render("otpEntryPage", {
        errorMessage: "Invalid OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).render("errorPage", { error });
  }
});

app.get("/resendOTP", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).send("Missing userId parameter");
    }

    // Generate a new OTP
    const newOTP = generateOTP(6);

    // Update the existing OTP in the database or create a new one
    await OTPModel.findOneAndUpdate(
      { userId },
      { $set: { otp: newOTP, timestamp: Date.now() } },
      { upsert: true }
    );

    // Get user email based on userId
    const userEmail = await User.findById(userId).select("email");

    // Send the new OTP by email
    await sendOTPByEmail(userEmail, newOTP, userId, () => {
      // Callback function (optional): Implement any logic you need after sending the email
      setEmailReceived(userId);
    });

    // Redirect to the OTP entry page
    res.redirect(
      "/otpEntryPage?successMessage=OTP sent successfully&userId=" + userId
    );
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/logout", Auth.logouting, userController.logout);
app.post("/user/wishlist/remove", wishlistController.removeFromWishlist);

mongoose
  .connect("mongodb://127.0.0.1:27017/user_managment_system")
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.single("image"), (req, res) => {
  // Handle the uploaded file
  res.send("File uploaded successfully!");
});

// Define the route for applying the coupon
app.post("/admin/coupon/apply", adminController.applyCoupon);

app.listen(3006, function () {
  console.log("server runnng");
});
