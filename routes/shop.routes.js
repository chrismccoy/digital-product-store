/**
 * Defines all the URL routes for the SHOP application mode.
 */
const express = require("express");
const pageController = require("../controllers/shop/page.controller");
const purchaseController = require("../controllers/shop/purchase.controller");
const downloadController = require("../controllers/shop/download.controller");

const router = express.Router();

// Page Rendering
router.get("/page/:page", pageController.renderShopPage);
router.get("/", pageController.renderShopPage);
router.get("/product/:productId", pageController.renderProductPage);
router.get("/cancel", pageController.renderCancelPage);
router.get("/redownload", pageController.renderRedownloadPage);

// API
router.post("/api/capture-order", purchaseController.captureOrder);
router.post("/api/verify-transaction",downloadController.verifyAndAuthorizeRedownload);

// Download and Success
router.get("/purchase/success", downloadController.renderSuccessPage);
router.get("/download/product", downloadController.serveProductFile);

module.exports = router;
