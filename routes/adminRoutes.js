const express = require("express");
const admin_route = express.Router();
const adminController = require("../controlers/adminController");
const Auth = require("../middleware/Auth");
// const Product = require("../models/productModel")
// const Category = require("../models/categoryModel");
const { Product, Category, Subcategory } = require("../models/productModel");
const reportController = require("../controlers/reportController");
const { getOrderDetails } = require('../controlers/adminController'); // Assuming your controller file is named orderController.js

admin_route.get("/login", Auth.logoutAdmin, adminController.loadAdmin);

admin_route.post("/login", Auth.logoutAdmin, adminController.adminValid);

admin_route.get("/dash", Auth.loggedadmin, adminController.adminDashboard);
// admin_route.get('/dash', Auth.loggedadmin, (req, res) => {
//     console.log("Accessed /dash route"); // Add this line
//     res.render('admin/dash');
// });

admin_route.get(
  "/add-product",
  Auth.loggedadmin,
  adminController.loadAdminAddProduct
);

admin_route.post("/add-product", Auth.loggedadmin, adminController.addProduct);

admin_route.get(
  "/view-product",
  Auth.loggedadmin,
  adminController.getAdminViewProduct
);

admin_route.get(
  "/products/edit/:id",
  Auth.loggedadmin,
  adminController.loadAdminEditProduct
);

admin_route.post(
  "/products/edit/:id",
  Auth.loggedadmin,
  adminController.updateProduct
);

admin_route.delete(
  "/products/:id",
  Auth.loggedadmin,
  adminController.deleteProduct
);

admin_route.get("/products/view/:id", Auth.loggedadmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate("product_category")
      .populate("subcategory");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("admin/view-product", { product });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).send("Error fetching product");
  }
});

// admin_route.get('/edit-product', async (req, res) => {
//     try {
//         const subcategories = await Subcategory.find({});

//         res.render('admin/edit-product', { subcategories });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error rendering edit-product view');
//     }
// });

admin_route.get("/add-category", Auth.loggedadmin, (req, res) => {
  res.render("admin/add-category"); // Render the form to add a category
});

admin_route.post("/add-category", Auth.loggedadmin, async (req, res) => {
  try {
    console.log(req.body); // Check if the categoryName field is present in req.body
    const { categoryName } = req.body;
    const newCategory = await Category.create({ name: categoryName });
    res.redirect("/admin/add-product");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating category");
  }
});

admin_route.get("/add-subcategory", Auth.loggedadmin, async (req, res) => {
  try {
    if (req.session.admin) {
      const categories = await Category.find({});
      const subcategories = await Subcategory.find({});
      res.render("admin/add-subcategory", { categories, subcategories });
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    res.status(500).send("Error fetching data from the database");
  }
});

// Add a route to create subcategories
admin_route.post("/add-subcategory", Auth.loggedadmin, async (req, res) => {
  try {
    const { name, category } = req.body;
    const newSubcategory = await Subcategory.create({ name, category });
    res.redirect("/admin/add-product");
  } catch (err) {
    res.status(500).send("Error creating subcategory");
  }
});

// admin_route.get('/add-category',Auth.loggedadmin,adminController.loadAdminAddCategory);

// admin_route.post('/add-category',Auth.loggedadmin, adminController.addCategory);

admin_route.get("/view-category", Auth.loggedadmin, async (req, res) => {
  if (req.session.admin) {
    try {
      const categories = await Category.find({});

      res.render("admin/view-category", { categories });
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).send("Error fetching category from the database");
    }
  } else {
    res.redirect("/login");
  }
});

admin_route.post(
  "/categories/:id",
  Auth.loggedadmin,
  adminController.deleteCategory
);

admin_route.get("/categories/edit/:id", Auth.loggedadmin, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    res.render("admin/edit-category", { category });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

admin_route.post("/categories/edit/:id", Auth.loggedadmin, async (req, res) => {
  console.log("Edit category route accessed");
  try {
    console.log("POST request to edit category received");

    const categoryId = req.params.id;
    console.log("Category ID:", categoryId);

    const updatedDetails = req.body;
    console.log("Updated Details:", updatedDetails);

    await Category.findByIdAndUpdate(categoryId, updatedDetails);

    res.redirect("/admin/view-category");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

admin_route.get("/view-subcategory", Auth.loggedadmin, async (req, res) => {
  if (req.session.admin) {
    try {
      const subcategories = await Subcategory.find({});

      res.render("admin/view-subcategory", { subcategories });
    } catch (err) {
      console.error("Error fetching sub categories:", err);
      res.status(500).send("Error fetching sub category from the database");
    }
  } else {
    res.redirect("/login");
  }
});

admin_route.post("/subcategories/:id", Auth.loggedadmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubCategory = await Subcategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return res.status(404).json({ message: "Sub Category not found" });
    }

    return res
      .status(200)
      .json({ message: " Sub Category deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

admin_route.get(
  "/subcategories/edit/:id",
  Auth.loggedadmin,
  async (req, res) => {
    try {
      const subcategoryId = req.params.id;
      const subcategory = await Subcategory.findById(subcategoryId);
      res.render("admin/edit-subcategory", { subcategory });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

admin_route.post(
  "/subcategories/edit/:id",
  Auth.loggedadmin,
  async (req, res) => {
    console.log("Edit sub category route accessed");
    try {
      console.log("POST request to edit sub category received");

      const subcategoryId = req.params.id;
      console.log("Subcategory ID:", subcategoryId);

      const updatedDetails = req.body;
      console.log("Updated Details:", updatedDetails);

      await Subcategory.findByIdAndUpdate(subcategoryId, updatedDetails);

      res.redirect("/admin/view-subcategory");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// admin_route.get(
//   "/users/:id/Edit",
//   Auth.loggedadmin,
//   adminController.editerload
// );

admin_route.post("/users/:id", Auth.loggedadmin, adminController.updateUser);

admin_route.post("/logout", Auth.loggedadmin, adminController.logout);

admin_route.post("/createUser", Auth.loggedadmin, adminController.createUser);

admin_route.get(
  "/dashboard/createUser",
  Auth.loggedadmin,
  adminController.loadCreateUser
);

admin_route.get("/logout", Auth.logouting, adminController.logout);
admin_route.get("/createCoupon", adminController.renderCreateCouponPage);
admin_route.post("/createCoupon", adminController.createCoupon);
admin_route.get("/couponmgt", adminController.renderCreateMgtPage);
admin_route.post(
  "/update-coupon-status/:couponId",
  adminController.updateCouponStatus
);
admin_route.get("/coupons/all", adminController.getAllCoupons);
admin_route.post("/coupon/apply", adminController.applyCoupon);
admin_route.get("/coupons/:couponCode", adminController.getCouponByCode);
admin_route.post("/sales/report", reportController.generateSalesReport);
admin_route.get("/users", adminController.fetchAllUsers);
admin_route.get("/users/:userId", adminController.fetchUserDetails);
admin_route.get("/users/:userId/edit", adminController.editUser);
admin_route.post("/users/:userId/edit", adminController.updatingeUser);
admin_route.post("/users/:userId/block", adminController.toggleBlockUser);
admin_route.post("/users/:userId/unblock", adminController.toggleUnblockUser);
admin_route.get('/orders/:orderId', getOrderDetails);
admin_route.get('/edit-category/:categoryId', adminController.renderEditCategoryForm);
admin_route.post('/update-category/:categoryId', adminController.updateCategoryName);

module.exports = admin_route;
