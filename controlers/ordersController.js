// orderController.js

const Order = require("../models/orderdetailsModel"); // Assuming Order is your Mongoose model for orders
const { Product } = require("../models/productModel");

exports.calculateTotalRevenue = async () => {
  try {
    // Fetch all orders from the database
    const orders = await Order.find({});

    // Calculate total revenue by summing up the totalPrice of each order
    const totalRevenue = orders.reduce(
      (total, order) => total + order.totalPrice,
      0
    );

    return totalRevenue;
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    throw error;
  }
};

exports.getTotalOrdersCount = async () => {
  try {
    // Fetch total number of orders from the database
    const totalOrdersCount = await Order.countDocuments();

    return totalOrdersCount;
  } catch (error) {
    console.error("Error fetching total orders count:", error);
    throw error;
  }
};

exports.calculateMonthlyEarning = async () => {
  try {
    // Get the current date
    const currentDate = new Date();
    // Get the first day of the current month
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Find orders placed within the current month
    const orders = await Order.find({
      createdAt: { $gte: firstDayOfMonth },
    });

    // Calculate total earnings from these orders
    const monthlyEarning = orders.reduce(
      (total, order) => total + order.totalPrice,
      0
    );

    return monthlyEarning;
  } catch (error) {
    console.error("Error calculating monthly earning:", error);
    throw error;
  }
};

exports.calculateWeeklyEarning = async () => {
  try {
    // Get the current date
    const currentDate = new Date();
    // Calculate the date seven days ago
    const sevenDaysAgo = new Date(
      currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    // Find orders placed within the past seven days
    const orders = await Order.find({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Calculate total earnings from these orders
    const weeklyEarning = orders.reduce(
      (total, order) => total + order.totalPrice,
      0
    );

    return weeklyEarning;
  } catch (error) {
    console.error("Error calculating weekly earning:", error);
    throw error;
  }
};

exports.calculateDailyEarning = async () => {
  try {
    // Get the current date
    const currentDate = new Date();
    // Get the start and end of the current day
    const startOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
    const endOfDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1
    );

    // Find orders placed within the current day
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    // Calculate total earnings from these orders
    const dailyEarning = orders.reduce(
      (total, order) => total + order.totalPrice,
      0
    );

    return dailyEarning;
  } catch (error) {
    console.error("Error calculating daily earning:", error);
    throw error;
  }
};

exports.getOrders = async (req, res) => {
  try {
    // Fetch orders from the database
    const orders = await Order.find().populate("items.product");
    const products = await Product.find();

    // Pass the fetched orders data to the view template
    res.render("admin/orders", { orders, products });
  } catch (error) {
    // Handle errors
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check if orderId is valid
    if (!orderId) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    // Find the order by its ID and remove it
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    // If order not found, return error
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Respond with success message
    res
      .status(200)
      .json({ message: "Order cancelled successfully", deletedOrder });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
