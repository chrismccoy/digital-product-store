/**
 * Contact form controller. Renders the page and handles AJAX submissions
 */

const config = require("../config/config");
const emailService = require("../services/email.service");
const seo = require("../lib/seo");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

function renderContactPage(req, res) {
  res.render("contact", {
    eyebrow: config.site.contactEyebrow,
    heading: config.site.contactHeading,
    highlight: config.site.contactHighlight,
    subtitle: config.site.contactSubtitle,
    seo: seo.buildSeo({
      req,
      path: "/contact",
      title: "Contact us",
      description: `Get in touch with ${config.site.siteTitle}.`,
    }),
  });
}

async function submitContact(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const message =
    typeof req.body.message === "string" ? req.body.message.trim() : "";

  const errors = {};
  if (!name) errors.name = "Please enter your name.";
  else if (name.length > MAX_NAME) errors.name = "Name is too long.";

  if (!email) errors.email = "Please enter your email address.";
  else if (email.length > MAX_EMAIL || !EMAIL_RE.test(email))
    errors.email = "Please enter a valid email address.";

  if (!message) errors.message = "Please enter a message.";
  else if (message.length > MAX_MESSAGE) errors.message = "Message is too long.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please correct the highlighted fields.",
      errors,
    });
  }

  const sent = await emailService.sendContactMessage({ name, email, message });

  if (!sent) {
    return res.status(500).json({
      success: false,
      message: "Sorry, your message could not be sent. Please try again later.",
    });
  }

  return res.json({
    success: true,
    message: "Thanks for reaching out! We'll get back to you soon.",
  });
}

module.exports = { renderContactPage, submitContact };
