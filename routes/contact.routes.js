/**
 * Contact form routes.
 */

const express = require("express");
const contactController = require("../controllers/contact.controller");
const { contactLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", contactController.renderContactPage);
router.post("/send", contactLimiter, contactController.submitContact);

module.exports = router;
