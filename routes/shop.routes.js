/**
 * Defines all the URL routes for the shop mode.
 */
const express = require("express");
const pageController = require("../controllers/shop/page.controller");
const purchaseController = require("../controllers/shop/purchase.controller");
const downloadController = require("../controllers/shop/download.controller");
const { downloadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/page/:page", pageController.renderShopPage);
router.get("/category/:categoryId/page/:page", pageController.renderShopPage);
router.get("/category/:categoryId", pageController.renderShopPage);
router.get("/browse/:categoryId/page/:page", pageController.renderShopPage);
router.get("/browse/:categoryId", pageController.renderShopPage);
router.get("/tag/:tagSlug/page/:page", pageController.renderTagPage);
router.get("/tag/:tagSlug", pageController.renderTagPage);
router.get("/", pageController.renderShopPage);
router.get("/product/:productId", pageController.renderProductPage);
router.get("/cancel", pageController.renderCancelPage);
router.get("/redownload", pageController.renderRedownloadPage);

router.post("/api/capture-order", purchaseController.captureOrder);
router.post("/api/verify-transaction", downloadLimiter, downloadController.verifyAndAuthorizeRedownload);

router.get("/purchase/success", downloadController.renderSuccessPage);
router.get("/download/product", downloadController.serveProductFile);

module.exports = router;
