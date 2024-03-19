const { render } = require("ejs");
const { Product, Category, Subcategory } = require("../models/productModel");
const User = require("../models/userModel");
const OrderStatus = require("../models/orderStatusModel");
const bcrypt = require("bcrypt");
const { generateCouponCode } = require("../couponUtils");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");
const OrderDetail = require("../models/orderdetailsModel");
const cartController = require("../controlers/cartController"); // Import cart controller
const {
  calculateTotalRevenue,
  getTotalOrdersCount,
  calculateMonthlyEarning,
  calculateWeeklyEarning,
  calculateDailyEarning,
} = require("./ordersController");
const { getTotalProductsCount } = require("./pdtController");
const { getTotalUsersCount } = require("./userController");

const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
const loadAdmin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const adminValid = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email });

    if (!admin) {
      console.log("Admin not registered");
      return res.render("login", { message: "admin not registerd" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log("Incorrect password");
      return res.render("login", { message: "password is incorrect" });
    }
    if (admin.is_admin === 1) {
      console.log("Admin is logged in.");
      console.log("Admin ID:", admin._id);
      req.session.admin = admin._id;
      console.log("Redirecting to /admin/admin-dash");
      res.redirect("/admin/dash");
    } else {
      console.log("User is not an admin.");

      res.render("login", { message: "your not a admin" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  const totalRevenue = await calculateTotalRevenue();
  const totalOrder = await getTotalOrdersCount();
  const totalPdts = await getTotalProductsCount();
  const totalUsers = await getTotalUsersCount();
  const monthlyEarning = await calculateMonthlyEarning();
  const weeklyEarning = await calculateWeeklyEarning();
  const dailyEarning = await calculateDailyEarning();
  res.render("admin/dash", {
    totalRevenue,
    totalOrder,
    totalPdts,
    totalUsers,
    monthlyEarning,
    weeklyEarning,
    dailyEarning,
  });
};
const userDashboard = async (req, res) => {
  const { query } = req.query;
  try {
    let users;
    if (query) {
      users = await users.find({
        name: { $regex: ".*" + query + ".*" },
        is_admin: 0,
      });
    } else {
      users = await users.find({ is_admin: 0 });
    }
    return res.render("admin/dash", { users, query });
  } catch (error) {
    res.render("admin/dash");
  }
};

// const deleteUser = async (req,res)=>{
//     try{
//         const { userId } = req.query
//         const deleteUser = await User.findByIdAndDelete(userId)

//         if(!deleteUser){

//             res.render('admin/dashboad',{message:"user not found"})
//         }
//         if(deleteUser){

//             return res.redirect('/admin/dashboard')
//         }

//     } catch(error){
//         console.log(error)
//     }
// }

// const editerload = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const user = await user.findById(id);
//     res.render("admin/userEdit", { user });
//   } catch (error) {
//     console.log(error);
//   }
// };

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, is_varified } = req.body;
  try {
    await User.findByIdAndUpdate(id, {
      $set: {
        name,
        email,
        mobile,
        is_varified,
      },
    });

    res.redirect("/admin/dashboard");
  } catch (erro) {
    console.log(erro);
  }
};

const loadAdminViewProduct = async (req, res) => {
  try {
    res.redirect("/admin/view-product");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error loading admin view product");
  }
};

const getAdminViewProduct = async (req, res) => {
  try {
    console.log("reached getAdminviewpdt @ admincontroller");
    if (!req.session.admin) {
      return res.redirect("/login");
    }
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const perPage = 10;
    // Number of products per page

    const products = await Product.find({})
      .populate("product_category")
      .populate("subcategory")
      .skip((page - 1) * perPage) // Skip products based on current page
      .limit(perPage);

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    console.log("currentPage:", page);
    console.log("totalPages:", totalPages);

    const categories = await Category.find({});
    const subcategories = await Subcategory.find({});

    res.render("admin/view-product", {
      products,
      categories,
      subcategories,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching products from the database:", err);
    res.status(500).send("Error fetching products from the database");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id: productId } = req.params; // Retrieve the productId from URL parameters

    // Soft delete the product by updating a flag (e.g., isDeleted) instead of physically removing it
    const { deletedCount } = await Product.updateOne(
      { _id: productId },
      { $set: { isDeleted: true } }
    );

    if (deletedCount === 0) {
      return res.render("admin/view-product", {
        errorMessage: "Product not found",
      });
    }

    const totalProducts = await Product.countDocuments({
      isDeleted: { $ne: true },
    }); // Count only non-deleted products
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const perPage = 10;
    const totalPages = Math.ceil(totalProducts / perPage); // Assuming perPage is defined

    // Retrieve non-deleted products for the current page
    const products = await Product.find({ isDeleted: { $ne: true } })
      .skip((page - 1) * perPage)
      .limit(perPage);

    return res.render("admin/view-product", {
      currentPage: page,
      totalPages,
      products,
      successMessage: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadAdminAddProduct = async (req, res) => {
  try {
    if (req.session.admin) {
      const products = await Product.find({});
      const categories = await Category.find({});
      const subcategories = await Subcategory.find({});
      res.render("admin/add-product", { categories, products, subcategories });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    res.status(500).send("Error fetching data from the database");
  }
};

const addProduct = async (req, res) => {
  try {
    console.log("add product reached");
    const {
      product_title,
      product_category,
      subcategory,
      color,
      sizes,
      brand,
      description,
      price,
      images,
      mimages,
      stock,
    } = req.body;

    console.log(req.body);

    const existingProduct = await Product.findOne({ product_title });
    if (existingProduct) {
      const categories = await Category.find({});
      const subcategories = await Subcategory.find({});
      const errorMessage =
        "Product title already exists. Please use a different title.";
      return res.render("admin/add-product", {
        errorMessage,
        categories,
        subcategories,
      });
    }

    const newProduct = new Product({
      product_title,
      product_category,
      subcategory,
      color,
      sizes,
      brand,
      description,
      price,
      images,
      mimages,
      stock,
    });

    console.log(newProduct);
    await newProduct.save();
    const categories = await Category.find({});
    const subcategories = await Subcategory.find({});
    const successMessage = "Product added successfully!";
    return res.render("admin/add-product", {
      successMessage,
      categories,
      subcategories,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    const categories = await Category.find({});
    const subcategories = await Subcategory.find({});
    const errorMessage = "Failed to add product. Please try again.";
    return res.render("admin/add-product", {
      errorMessage,
      categories,
      subcategories,
    });
  }
};

const loadAdminEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const categories = await Category.find({});
    const subcategories = await Subcategory.find({});

    res.render("admin/edit-product", { product, categories, subcategories });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error loading admin edit product");
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log("edit pdt page : updatepdt @admincontroller");
    const {
      product_title,
      product_category,
      subcategory,
      color,
      sizes,
      brand,
      description,
      price,
      images,
      mimages,
      stock,
    } = req.body;

    const productId = req.params.id;

    // Find the existing product by ID
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.log("Received data:", req.body);

    // Update the fields
    existingProduct.product_title = product_title;

    existingProduct.color = color;
    existingProduct.sizes = sizes;
    existingProduct.brand = brand;
    existingProduct.description = description;
    existingProduct.price = price;
    existingProduct.images = images;
    existingProduct.mimages = mimages;
    existingProduct.stock = stock;

    const category = await Category.findById(product_category);
    const subCat = await Subcategory.findById(subcategory);

    if (!category || !subCat) {
      return res
        .status(404)
        .json({ message: "Category or Subcategory not found" });
    }

    existingProduct.product_category = category.name;
    existingProduct.subcategory = subCat.name;
    await existingProduct.save();

    res.redirect("/admin/view-product");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: error.message });
  }
};

const loadAdminViewCategory = async (req, res) => {
  try {
    res.redirect("/admin/view-category");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error loading admin view category");
  }
};

const loadAdminAddCategory = async (req, res) => {
  try {
    res.render("admin/add-category");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Error loading admin add category");
  }
};

const addCategory = async (req, res) => {
  try {
    const { categoryName } = req.body.toLowerCase(); // Convert the category name to lowercase
    console.log("Category Name:", categoryName);

    // Check if a category with a similar name (ignoring case) already exists
    const similarCategory = await Category.findOne({
      categoryName: { $regex: new RegExp(`^${categoryName}$`, "i") }, // Case-insensitive match
    });
    console.log("Similar Category:", similarCategory);

    if (similarCategory) {
      // If a similar category (different case) exists, return an error message
      const similarCategoryName = similarCategory.categoryName.toLowerCase();
      return res.render("admin/add-category", {
        error: `A similar category '${similarCategoryName}' already exists.`,
      });
    }

    // Create a new category if it doesn't already exist
    const newCategory = new Category({ categoryName });
    await newCategory.save();
    res.render("admin/add-category", {
      successMessage: "Category added successfully!",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/user/login");
  });
};
const deleteCategory = async (req, res) => {
  try {
    const { id: categoryId } = req.params; // Retrieve categoryId from URL params

    // Soft delete the category by updating the 'isDeleted' field to true
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { isDeleted: true },
      { new: true } // Return the updated document
    );

    // If the category doesn't exist or wasn't updated, return a 404 error
    if (!updatedCategory) {
      return res.status(404).render("admin/view-category", {
        message: "Category not found",
      });
    }

    // Fetch all active categories (not deleted)
    const activeCategories = await Category.find({ isDeleted: { $ne: true } });

    return res.render("admin/view-category", {
      categories: activeCategories,
      message: "Category soft deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addSubCategory = async (req, res) => {
  try {
    const { name } = req.body;
    console.log(name);
    const newSubCategory = new Subcategory({ name });
    await newSubCategory.save();
    res.render("admin/add-subcategory", {
      successMessage: "Sub Category added successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const { subcategoryId } = req.query;
    const deletedCategory = await Product.findByIdAndDelete(subcategoryId);

    if (!deletedCategory) {
      return res.render("admin/view-subcategory", {
        message: "sub category not found",
      });
    }
    return res.render("admin/view-subcategory", {
      subcategories: await Subcategory.find({}),
      message: " SubCategory deleted successfully",
    });
    // return res.redirect('/admin/view-category');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const loadCreateUser = async (req, res, next) => {
  try {
    res.render("admin/createUser");
  } catch (error) {
    console.log(error);
  }
};
const createUser = async (req, res) => {
  const { name, email, password, mno } = req.body;
  try {
    const existingUser = await user.findOne({ email });

    if (existingUser) {
      return res.render("admin/createUser", {
        message: "User already Exists.",
      });
    }
    const spassword = await securepassword(password);
    const user = new user({
      name,
      email,
      password: spassword,
      mobile: mno,
    });
    const userData = await user.save();
    if (userData) {
      res.render("user/registration", {
        message: "Create new user has been successfully.",
      });

      req.session.user = user._id;
    } else {
      res.render("user/registration", {
        message: "Create new use has been failed.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// const saveOrderStatus = async (req, res) => {
//   try {
//     console.log("saveorderstatus @ adminController");
//     const ordersData = req.body;
//     console.log("orderData:", ordersData);
//     // Check if ordersData is an array
//     if (!Array.isArray(ordersData)) {
//       return res.status(400).json({ message: "Invalid data format" });
//     }

//     // Loop through each order data
//     for (const orderData of ordersData) {
//       const { orderId, productId, status } = orderData;

//       // Find the order in the database
//       const existingOrder = await OrderStatus.findOneAndUpdate(
//         { orderId, productId },
//         { status }, // Update status
//         { new: true } // Return the updated document
//       );

//       if (!existingOrder) {
//         console.log(
//           `Order with orderId ${orderId} and productId ${productId} not found`
//         );
//         continue; // Skip if order not found
//       }

//       console.log(
//         `Order with orderId ${orderId} and productId ${productId} updated successfully`
//       );
//     }

//     // Send a success response
//     res.status(200).json({ message: "Order status updated successfully" });
//   } catch (error) {
//     console.error("Error updating order status:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const renderCreateCouponPage = (req, res) => {
  // Render the createCoupon.ejs page
  res.render("admin/createCoupon");
};
const saveOrderStatus = async (req, res) => {
  try {
    console.log("saveOrderStatus @ adminController");
    const ordersData = req.body;
    console.log("orderData:", ordersData);

    // Check if ordersData is an array
    if (!Array.isArray(ordersData)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    // Loop through each order data
    for (const orderData of ordersData) {
      const { orderId, productId, status } = orderData;

      // Find the order in the database
      const existingOrder = await OrderDetail.findOneAndUpdate(
        { _id: orderId, "items.product": productId },
        { $set: { orderStatus: status } }, // Update order status
        { new: true }
      );

      console.log(existingOrder);

      if (!existingOrder) {
        console.log(
          `Order with ID ${orderId} and product ID ${productId} not found`
        );
        continue; // Skip if order not found
      }

      console.log(
        `Order with ID ${orderId} and product ID ${productId} updated successfully`
      );
    }

    // Send a success response
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      purchaseAmount,
      discountPercentage,
      description,
      startDate,
      endDate,
      status,
    } = req.body;

    // Validation: Check if purchase amount and discount percentage are valid positive numbers
    if (
      isNaN(purchaseAmount) ||
      isNaN(discountPercentage) ||
      purchaseAmount < 0 ||
      discountPercentage < 0
    ) {
      return res
        .status(400)
        .send(
          "Purchase Amount and Discount Percentage must be valid positive numbers"
        );
    }

    // Validation: Check if description is not empty
    if (!description.trim()) {
      return res.status(400).send("Please enter a description");
    }

    // Validation: Ensure start date and end date are in the correct format and end date is after start date
    const parsedStartDate = Date.parse(startDate);
    const parsedEndDate = Date.parse(endDate);
    if (
      isNaN(parsedStartDate) ||
      isNaN(parsedEndDate) ||
      parsedStartDate >= parsedEndDate
    ) {
      return res.status(400).send("Invalid start or end date");
    }

    // Validation: Check if status is not empty
    if (!status.trim()) {
      return res.status(400).send("Please enter a status");
    }

    // Generate coupon code
    const couponCode = generateCouponCode(8); // Generate a coupon code with 8 characters

    // Use the generated coupon code as part of the coupon name
    const couponName = `GLAMOUR-${couponCode}`;

    // Create a new coupon object
    const coupon = new Coupon({
      couponCode,
      purchaseAmount,
      discountPercentage,
      description,
      startDate,
      endDate,
      status,
      couponName,
      // Other coupon details you want to save
    });

    // Save coupon to database
    await coupon.save();

    // Respond with a success message
    res.render("admin/createCoupon", {
      message: "Coupon created successfully",
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const renderCreateMgtPage = async (req, res) => {
  try {
    // Fetch coupon details from the database or any other source
    const couponDetails = await Coupon.find();
    console.log("fetchedddd");
    console.log(typeof couponDetails);

    // Render the couponmgt.ejs page and pass the couponDetails object to the template
    res.render("admin/couponmgt", { couponDetails });
  } catch (error) {
    // Handle error
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const updateCouponStatus = async (req, res) => {
  const { couponId } = req.params;
  const { status } = req.body;

  try {
    // Find the coupon by its ID
    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { status },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    console.log(`Status of coupon ${couponId} updated to ${status}`);
    res.json({ message: "Coupon status updated successfully", coupon });
  } catch (error) {
    console.error("Error updating coupon status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    console.log("reached getallcoupons");
    const coupons = await Coupon.find();
    console.log("getallcoupons:", coupons);
    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCouponByCode = async (req, res) => {
  const { couponCode } = req.params;

  try {
    console.log("reached getcouponby code");

    const coupon = await Coupon.findOne({ couponCode });
    console.log("getcouponby code:", coupon);
    if (coupon) {
      res.json(coupon);
    } else {
      res.status(404).json({ error: "Coupon not found." });
    }
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ error: "Failed to fetch coupon." });
  }
};

// Server-side code
const applyCoupon = async (req, res) => {
  const { couponCode, cartSubtotal } = req.body;
  console.log(req.body);
  try {
    // Assuming you have a Coupon model
    console.log("reached apply coupon");

    const userId = req.session.user;
    console.log("userid:", userId);
    const cart = await cartController.getUserCart(userId);

    const coupon = await Coupon.findOne({ couponName: couponCode });
    console.log(coupon);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found." });
    }

    // Check if cartSubtotal is a valid number
    if (isNaN(cartSubtotal)) {
      return res.status(400).json({ error: "Invalid cart subtotal." });
    }
    console.log("CART-SUBTOTAL:", cartSubtotal);
    // Logic to calculate the discounted total
    const discountPercentage = coupon.discountPercentage;
    console.log("DISCOUNT-PERCENTAGE:", discountPercentage);

    const discountedTotal =
      cartSubtotal - (cartSubtotal * discountPercentage) / 100;

    console.log("DISCOUNTED-TOTAL:", discountedTotal);
    const amountDiscounted = cartSubtotal - discountedTotal;
    console.log("DISCOUNTED -AMOUNT:", amountDiscounted);

    cart.discountPercentage = discountPercentage;
    cart.discountedTotal = discountedTotal;
    cart.discountedAmount = amountDiscounted;
    cart.totalPrice = discountedTotal;
    cart.couponCode = couponCode;
    console.log("updated cart  after coupon apply:", cart);
    // Save the updated cart document back to the database
    await cart.save();
    res.json({
      totalPrice: discountedTotal,
      cartSubtotal: discountedTotal,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ error: "Failed to apply coupon." });
  }
};

// const fetchAllUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.render('admin/users', { users });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };
const fetchAllUsers = async (req, res) => {
  try {
    const PAGE_SIZE = 10; // Number of users per page
    const page = parseInt(req.query.page) || 1; // Get the requested page, default to page 1
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

    const users = await User.find()
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    res.render("admin/users", { users, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};
const fetchUserDetails = async (req, res) => {
  const perPage = 10; // Number of users per page
  const page = req.query.page || 1; // Current page, default is 1

  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Pagination logic to calculate skip and limit
    const totalCount = await User.countDocuments();
    const totalPages = Math.ceil(totalCount / perPage);
    const skip = (page - 1) * perPage;

    const users = await User.find().skip(skip).limit(perPage);

    res.render("admin/userdetails", {
      user,
      users,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).send("Internal Server Error");
  }
};
const editUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("admin/edituser", { user });
  } catch (error) {
    console.error("Error rendering edituser:", error);
    res.status(500).send("Internal Server Error");
  }
};
const updatingeUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.redirect("/admin/users"); // Redirect to user list page after updating
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
  }
};
const toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Toggle the blocked status
    user.blocked = !user.blocked;

    // Save the updated user
    await user.save();

    // Log the action
    if (user.blocked) {
      console.log(`User ${user.name} (${user.email}) has been blocked`);
    } else {
      console.log(`User ${user.name} (${user.email}) has been unblocked`);
    }

    // Redirect to user list or any other appropriate page
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error toggling user block status:", error);
    res.status(500).send("Internal Server Error");
  }
};
const toggleUnblockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.blocked = false; // Unblock the user
    await user.save();
    console.log(`User ${user.name} (${user.email}) has been unblocked`);
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error toggling user unblock status:", error);
    res.status(500).send("Internal Server Error");
  }
};
async function getOrderDetails(req, res) {
  try {
      const orderId = req.params.orderId;
      const order = await OrderDetail.findById(orderId).populate('items.product');
      res.render('admin/detailorder', { order }); // Render the EJS template with the order data
  } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  adminValid,
  adminDashboard,
  loadAdminViewProduct,
  getAdminViewProduct,
  loadAdminAddProduct,
  loadAdminEditProduct,
  addProduct,
  updateProduct,
  loadAdmin,
  loadAdminViewCategory,
  loadAdminAddCategory,
  addCategory,
  addSubCategory,
  userDashboard,
  deleteProduct,
  deleteCategory,
  deleteSubCategory,
  logout,
  updateUser,
  // editerload,
  loadCreateUser,
  createUser,
  saveOrderStatus,
  renderCreateCouponPage,
  renderCreateMgtPage,
  createCoupon,
  updateCouponStatus,
  getAllCoupons,
  getCouponByCode,
  applyCoupon,
  fetchAllUsers,
  fetchUserDetails,
  editUser,
  updatingeUser,
  toggleBlockUser,
  toggleUnblockUser,
  getOrderDetails,
};
