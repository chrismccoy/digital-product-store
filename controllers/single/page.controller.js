/**
 * Controller for rendering all pages in SINGLE PRODUCT mode.
 * Each function renders a template from `/views/single/` and passes it the necessary
 * product and site data from the main configuration file.
 */

const config = require("../../config/config");

/**
 * Redirects the root URL ('/') to the main purchase page ('/purchase').
 * This provides a better user experience by taking them directly to the main content.
 */
function redirectToPurchase(req, res) {
  res.redirect("/purchase");
}

/**
 * Renders the main purchase page using data from the single product config.
 */
function renderPurchasePage(req, res) {
  // Renders the 'purchase.ejs' template from the 'views/single/' directory.
  // It passes all the product and site details needed to populate the page.
  res.render("single/purchase", {
    product: config.product,
    paypalClientId: config.paypal.clientId,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
  });
}

/**
 * Renders the transaction cancellation page.
 */
function renderCancelPage(req, res) {
  // Renders the 'cancel.ejs' template, passing product and site details.
  res.render("single/cancel", {
    product: config.product,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    contactURL: config.site.contactURL,
    footerDomain: config.site.footerDomain,
  });
}

/**
 * Renders the redownload request page.
 */
function renderRedownloadPage(req, res) {
  // Renders the 'redownload.ejs' template, passing product and site details.
  res.render("single/redownload", {
    product: config.product,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
  });
}

module.exports = {
  redirectToPurchase,
  renderPurchasePage,
  renderCancelPage,
  renderRedownloadPage,
};
