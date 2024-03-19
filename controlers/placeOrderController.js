const Cart = require("../models/cartModel");
const OrderDetail = require("../models/orderdetailsModel");

const Product = require("../models/productModel");
const Razorpay = require("razorpay");
require("dotenv").config();

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const itemsPerPage = 3;

const renderPlaceOrderPage = async (req, res) => {
  try {
    console.log("renderplaceorderpage @ placeordercontroller");
    const userId = req.session.user;
    console.log;
    // Fetch the cart data
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    console.log("after apply coupon cart:", cart);
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
    const subtotal = cart.totalPrice;
    console.log("subtotl @ rendrplaceorder @placeordercontroller :", subtotal);

    res.render("user/products/placeorder", {
      cart: { items: allItems },
      currentPage,
      totalPages: totalPages,
      totalPrice,
      subtotal,
      discountPercentage: cart.discountPercentage || 0,
      discountedAmount: cart.discountedAmount || 0,
      discountedTotal: cart.discountedTotal || 0,
      couponCode: cart.couponCode || "N/A",
    });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).send("Internal Server Error");
  }
};
const handleRazorpayPayment = async (req, res) => {
  try {
    console.log("handleRazorpayPayment @ placeordercontroller");
    const paymentData = req.body;
    console.log("Razorpay payment completed:", paymentData);

    // Add logging for the entire payment data
    console.log("Payment Data:", paymentData);
    if (
      !paymentData ||
      !paymentData.payload ||
      !paymentData.payload.payment ||
      !paymentData.payload.payment.entity
    ) {
      throw new Error("Invalid payment data received");
    }

    const razorpay_payment_id = paymentData.payload.payment.entity.id;
    console.log("Razorpay Payment ID:", razorpay_payment_id);

    if (!razorpay_payment_id) {
      throw new Error("Razorpay payment ID is missing in payment data");
    }

    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    if (payment.status == "captured") {
      const orderDetail = new OrderDetail({
        user: req.session.user,
        paymentOption: "online_payment",
        paymentId: razorpay_payment_id,
        paymentStatus: payment.status,
      });

      // Retrieve order details and populate the orderDetail object
      const userId = req.session.user;
      const items = await getOrderItems(userId);
      const cart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      orderDetail.items = items;
      orderDetail.totalPrice = cart.totalPrice;
      orderDetail.billingDetails = {
        // Add billing details here
      };

      await orderDetail.save(); // Save the order detail to the database
      res.status(200).send("Payment successful"); // Respond with success if payment is captured
    } else {
      return res.status(400).send("Payment failed"); // Send failure response if payment is not captured
    }
  } catch (error) {
    console.error("Error handling Razorpay payment:", error);
    res.status(500).send("Internal Server Error");
  }
};

const createRazorpayOrder = async (totalPrice) => {
  console.log("createRazorpayorder @ plavceorder");
  // Ensure totalPrice is at least 1.00 INR
  if (totalPrice < 1.0) {
    totalPrice = 1.0; // Set totalPrice to 1.00 if it's less than 1.00
  }

  return await new Promise((resolve, reject) => {
    const options = {
      amount: totalPrice * 100, // amount in paise
      currency: "INR",
      receipt: "order_receipt",
    };
    console.log("options:", options);
    razorpayInstance.orders.create(options, (err, order) => {
      if (err) {
        reject(err);
      } else {
        resolve(order);
      }
    });
  });
};

const getOrderItems = async (userId) => {
  try {
    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    if (!userCart) {
      return [];
    }

    return userCart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      // subtotal: item.product.price * item.quantity,
    }));
  } catch (error) {
    console.error("Error fetching order items:", error);
    throw error;
  }
};

const placeOrder = async (req, res) => {
  try {
    console.log("Order placement route reached");
    console.log("Request Body:", req.body);

    // Extract billing details from the request body
    const {
      fname,
      lname,
      cname,
      country,
      billing_address,
      billing_address2,
      city,
      state,
      zipcode,
      phone,
      email,
      payment_option,
    } = req.body;

    const userId = req.session.user;

    const items = await getOrderItems(userId);
    console.log("Order Items:", items);

    const itemsWithImage = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (product) {
          return {
            product: item.product,
            quantity: item.quantity,
            subtotal: item.subtotal,
            productImage: product.images, 
            price: product.price,
          };
        } else {
          console.error("Product not found for item:", item);
          return null;
        }
      })
    );

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    // Move this line before calculating totalPages
    const allItems =
      cart && cart.items && Array.isArray(cart.items) ? cart.items : [];

    // Filter out null items (if any)
    const validItemsWithImage = itemsWithImage.filter((item) => item !== null);
    const totalPages = Math.ceil(allItems.length / itemsPerPage);

    const carte = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );
    console.log("ith new cheythe cart:", carte);
    if (!cart) {
      throw new Error("Cart not found for user");
    }

    const totalPrice = carte.totalPrice;
    console.log("carte totlprce:", totalPrice);

    const {
      discountPercentage,
      discountedTotal,
      discountedAmount,
      couponCode,
    } = cart;

    if (payment_option === "online_payment") {
      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(totalPrice);
      const orderId = razorpayOrder.id;

      // Render the Razorpay payment option

      const orderDetail = await OrderDetail.create({
        user: userId,
        items: itemsWithImage,
        totalPrice: totalPrice,
        billingDetails: {
          firstName: fname,
          lastName: lname,
          companyName: cname,
          country: country,
          billingAddress: billing_address,
          billingAddress2: billing_address2,
          city: city,
          state: state,
          zipcode: zipcode,
          phone: phone,
          email: email,
          payment_option: payment_option,
        },
        discountPercentage: discountPercentage,
        discountedTotal: discountedTotal,
        discountedAmount: discountedAmount,
        couponCode: couponCode,
      });
      // Save the order detail to the

      res.render("user/products/razorpay_payment", {
        razorpayKeyId: "rzp_test_U1JmNHMDoFIk7I",
        orderCreatedId: orderDetail._id,
        orderId,
        totalPrice: totalPrice * 100,
        fname,
        lname,
        email,
        phone,
        userId,
        items: validItemsWithImage,
        currentPage: 1, // Assuming you want to reset currentPage to 1 when placing the order
        totalPages,
      });
      // if (cart) {
      //   cart.items = [];
      //   cart.totalPrice = 0; // Clear the items array
      //   await cart.save();
      //   console.log("Cart in online cleared successfully");
      // }
    } else {
      const orderDetail = new OrderDetail({
        user: userId,
        items: itemsWithImage,
        totalPrice: totalPrice,
        billingDetails: {
          firstName: fname,
          lastName: lname,
          companyName: cname,
          country: country,
          billingAddress: billing_address,
          billingAddress2: billing_address2,
          city: city,
          state: state,
          zipcode: zipcode,
          phone: phone,
          email: email,
          payment_option,
        },
        discountPercentage,
        discountedTotal,
        discountedAmount,
        couponCode,
        isPaid: true,
      });

      console.log("Order Detail:", orderDetail);

      // Save the order detail to the database
      await orderDetail.save();

      // Clear user's cart
      if (cart) {
        cart.items = [];
        cart.totalPrice = 0; // Clear the items array
        await cart.save();
        console.log("Cart cleared successfully");
      }

      console.log("Order placed successfully");

      res.redirect("/user/products/success");
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.redirect("/user/products/failure", {
      errorMessage: "Failed to place order. Please try again later.",
    });
  }
};



const confirmOnlinePayment = async (req, res) => {
  const { orderCreatedId } = req.body;
  console.log(orderCreatedId, "in confirm");

  try {
    // Find the order by its ID and mark it as paid
    await OrderDetail.findOneAndUpdate({ _id: orderCreatedId }, { isPaid: true });

    // Fetch the user's cart and clear it
    const userId = req.session.user;
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
      console.log("Cart cleared successfully");
    } else {
      console.log("Cart not found for user:", userId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error confirming online payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const rejectOnlinePayment = async (req, res) => {
  const { orderCreatedId } = req.body;
  console.log(orderCreatedId, "in reject");
  await OrderDetail.findByIdAndDelete({ _id: orderCreatedId });
  res.json({ deleted: "true" });
};

module.exports = {
  renderPlaceOrderPage,
  placeOrder,
  confirmOnlinePayment,
  rejectOnlinePayment,
  handleRazorpayPayment,
};
