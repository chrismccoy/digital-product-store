/**
 * Page rendering controller for Single Product Mode
 */

const config = require("../../config/config");
const mode = require("../../services/mode.service");
const productImageService = require("../../services/productImage.service");
const seo = require("../../lib/seo");

function redirectToPurchase(req, res) {
  res.redirect("/purchase");
}

function renderPurchasePage(req, res) {
  const product = mode.product();
  const pageSeo = product
    ? seo.buildSeo({
        req,
        path: "/purchase",
        title: product.name,
        description: product.description || product.text,
        image: product.image,
        type: "product",
        product,
        noindex: !!product.noindex,
      })
    : seo.buildSeo({ req, path: "/purchase", title: config.site.siteTitle });
  res.render("single/purchase", {
    product,
    seo: pageSeo,
    images: product ? productImageService.getImagesForProduct(product.id) : [],
    paypalClientId: config.paypal.clientId,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
  });
}

function renderCancelPage(req, res) {
  res.render("single/cancel", {
    product: mode.product(),
    seo: seo.buildSeo({ req, path: "/cancel", title: "Order canceled", noindex: true }),
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    contactURL: config.site.contactURL,
    footerDomain: config.site.footerDomain,
  });
}

function renderRedownloadPage(req, res) {
  res.render("single/redownload", {
    product: mode.product(),
    seo: seo.buildSeo({ req, path: "/redownload", title: "Redownload your purchase", noindex: true }),
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
