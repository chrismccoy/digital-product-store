/**
 * Defines all URL routes for the Admin Dashboard.
 */

const express = require("express");
const requireAuth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const adminController = require("../controllers/admin/admin.controller");

const router = express.Router();

// Page and Authentication
router.get("/login", adminController.renderLoginPage);

// Apply the authLimiter middleware to the POST /login route
router.post("/login", authLimiter, adminController.handleLogin);

router.post("/logout", adminController.handleLogout);
router.get("/dashboard", requireAuth, adminController.renderDashboard);

// Products CRUD API
router.get("/api/products/:id", requireAuth, adminController.getProductById);
router.post("/api/products", requireAuth, adminController.createProduct);
router.put("/api/products/:id", requireAuth, adminController.updateProduct);
router.delete("/api/products/:id", requireAuth, adminController.deleteProduct);

module.exports = router;
