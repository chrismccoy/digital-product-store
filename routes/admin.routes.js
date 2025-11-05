/**
 * Defines all URL routes for the Admin Dashboard.
 */

const express = require("express");
const requireAuth = require("../middleware/auth");
const adminIpAllowlist = require("../middleware/ipAllowlist");
const { authLimiter } = require("../middleware/rateLimiter");
const account = require("../controllers/admin/account.controller");
const products = require("../controllers/admin/products.controller");
const categories = require("../controllers/admin/categories.controller");
const transactions = require("../controllers/admin/transactions.controller");
const settings = require("../controllers/admin/settings.controller");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(adminIpAllowlist);

router.get("/login", account.renderLoginPage);

router.post("/login", authLimiter, account.handleLogin);

router.post("/logout", account.handleLogout);
router.get("/dashboard", requireAuth, products.renderDashboard);
router.get("/dashboard/page/:page", requireAuth, products.renderDashboard);
router.get("/products/add", requireAuth, products.renderAddProductPage);
router.get("/products/:id/edit", requireAuth, products.renderEditProductPage);

router.get("/transactions", requireAuth, transactions.renderTransactionsPage);
router.get("/transactions/page/:page", requireAuth, transactions.renderTransactionsPage);
router.get("/transactions/:id", requireAuth, transactions.renderTransactionDetail);
router.post("/transactions/:id/resend", requireAuth, transactions.resendReceipt);

router.get("/categories", requireAuth, categories.renderCategoriesPage);
router.post("/api/categories", requireAuth, categories.createCategory);
router.put("/api/categories/:id", requireAuth, categories.updateCategory);
router.delete("/api/categories/:id", requireAuth, categories.deleteCategory);

router.get("/settings", requireAuth, settings.renderSettingsPage);
router.post("/api/settings", requireAuth, settings.updateSettings);
router.post(
  "/api/settings/default-thumbnail",
  requireAuth,
  upload.fields([{ name: "image", maxCount: 1 }]),
  settings.updateDefaultThumbnail,
);
router.post(
  "/api/settings/default-thumbnail/remove",
  requireAuth,
  settings.removeDefaultThumbnail,
);
router.post(
  "/api/settings/og-image",
  requireAuth,
  upload.fields([{ name: "image", maxCount: 1 }]),
  settings.updateOgImage,
);
router.post(
  "/api/settings/og-image/remove",
  requireAuth,
  settings.removeOgImage,
);
router.post("/api/account", requireAuth, account.updateAdminCredentials);

router.get("/api/products/:id", requireAuth, products.getProductById);

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "productfile", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);

router.post("/api/products", requireAuth, uploadFields, products.createProduct);
router.post("/api/products/reorder", requireAuth, products.reorderProducts);
router.put("/api/products/:id", requireAuth, uploadFields, products.updateProduct);
router.delete("/api/products/:id", requireAuth, products.deleteProduct);

module.exports = router;
