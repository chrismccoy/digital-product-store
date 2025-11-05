/**
 * Defines all the URL routes for the single application mode.
 */

const express = require("express");
const pageController = require("../controllers/single/page.controller");
const purchaseController = require("../controllers/single/purchase.controller");
const downloadController = require("../controllers/single/download.controller");
const { downloadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", pageController.redirectToPurchase);
router.get("/purchase", pageController.renderPurchasePage);
router.get("/cancel", pageController.renderCancelPage);
router.get("/redownload", pageController.renderRedownloadPage);

router.post("/api/capture-order", purchaseController.captureOrder);
router.post("/api/verify-transaction", downloadLimiter, downloadController.verifyAndAuthorizeRedownload);

router.get("/purchase/success", downloadController.renderSuccessPage);
router.get("/download/product", downloadController.serveProductFile);

module.exports = router;
