/**
 * Public SEO routes (robots.txt, sitemap.xml), available in both modes.
 */

const express = require("express");
const seoController = require("../controllers/seo.controller");

const router = express.Router();

router.get("/robots.txt", seoController.robots);
router.get("/sitemap.xml", seoController.sitemap);

module.exports = router;
