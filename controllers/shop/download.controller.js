/**
 * Post purchase download controller for Shop Mode
 */

const path = require("path");
const config = require("../../config/config");
const transactionService = require("../../services/transaction.service");
const productService = require("../../services/product.service");
const grant = require("../../lib/downloadGrant");
const downloadInfo = require("../../lib/downloadInfo");
const { noFileDownloadPage } = require("../../lib/render");
const { saveSession } = require("../../lib/session");

async function renderSuccessPage(req, res) {
  const { transactionId } = req.query;
  if (!transactionId) return res.redirect("/");

  try {
    const transaction = transactionService.findTransactionById(transactionId);

    if (transaction && transaction.product) {
      grant.issue(req.session, transaction.product.id);

      const liveProduct = productService.getProductById(transaction.product.id);
      const { hasFile, serviceMessage } = downloadInfo(
        liveProduct,
        config.site.defaultServiceMessage,
      );

      res.render("shop/success", {
        transaction,
        hasFile,
        serviceMessage,
        seo: require("../../lib/seo").buildSeo({
          req,
          path: "/purchase/success",
          title: config.site.siteTitle,
          noindex: true,
        }),
        siteTitle: config.site.siteTitle,
        homeURL: config.site.homeURL,
        homeText: config.site.homeText,
        footerDomain: config.site.footerDomain,
      });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error rendering success page:", error);
    res.redirect("/");
  }
}

async function verifyAndAuthorizeRedownload(req, res) {
  const { transactionId, email } = req.body;

  if (!transactionId && !email) {
    return res.status(400).json({
      success: false,
      message: "A Transaction ID or Purchase Email is required.",
    });
  }

  try {
    let transaction = null;

    if (transactionId) {
      transaction = transactionService.findTransactionById(transactionId.trim());
    } else if (email) {
      transaction = transactionService.findLatestTransactionByEmail(email);
    }

    if (transaction && transaction.product) {
      grant.issue(req.session, transaction.product.id);

      const liveProduct = productService.getProductById(transaction.product.id);
      const { hasFile, serviceMessage } = downloadInfo(
        liveProduct,
        config.site.defaultServiceMessage,
      );

      await saveSession(req.session);
      res.json({ success: true, transaction, hasFile, serviceMessage });
    } else {
      res
        .status(404)
        .json({ success: false, message: "No matching purchase found." });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying your request." });
  }
}

function serveProductFile(req, res) {
  const authorizedId = grant.consume(req.session);
  if (!authorizedId) {
    return res.status(403).redirect("/redownload");
  }

  const product = productService.getProductById(authorizedId);
  if (!product) {
    return res.status(404).send("Product configuration not found.");
  }

  if (!product.filename) {
    const message = product.service_message || config.site.defaultServiceMessage;
    return res
      .status(200)
      .send(noFileDownloadPage(product.name, message, "/", "Return to the shop"));
  }

  const safeName = path.basename(product.filename);
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "private_downloads",
    safeName,
  );

  res.download(filePath, safeName, (err) => {
    if (err) {
      console.error("File download error:", err);
      if (!res.headersSent) {
        res.status(404).send("File not found or an error occurred.");
      }
    }
  });
}

module.exports = {
  renderSuccessPage,
  verifyAndAuthorizeRedownload,
  serveProductFile,
};
