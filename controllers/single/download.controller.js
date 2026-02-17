/**
 * Controller for handling all post-purchase actions in SINGLE PRODUCT mode.
 */

const path = require("path");
const config = require("../../config/config");
const transactionService = require("../../services/transaction.service");

/**
 * Renders the success page and authorizes a download for the single product.
 */
async function renderSuccessPage(req, res) {
  const { transactionId } = req.query;
  if (!transactionId) return res.redirect("/purchase");
  try {
    const transaction = await transactionService.findTransactionById(
      transactionId,
    );
    if (transaction) {
      // Security: Authorize the download by setting a static, known identifier in the session.
      // This signifies that the user is allowed to download the one specific product.
      req.session.authorizedProduct = "single-product";
      res.render("single/success", {
        transaction,
        product: config.product,
        homeURL: config.site.homeURL,
        homeText: config.site.homeText,
        footerDomain: config.site.footerDomain,
      });
    } else {
      res.redirect("/purchase"); // Invalid transaction ID.
    }
  } catch (error) {
    console.error("Error rendering success page:", error);
    res.redirect("/purchase");
  }
}

/**
 * Verifies credentials and authorizes a redownload for the single product.
 */
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
      transaction = await transactionService.findTransactionById(
        transactionId.trim(),
      );
    } else if (email) {
      transaction =
        await transactionService.findLatestTransactionByEmail(email);
    }
    if (transaction) {
      // Security: If a valid transaction is found, authorize the download using the static identifier.
      req.session.authorizedProduct = "single-product";
      req.session.save(() => {
        res.json({ success: true, transaction });
      });
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

/**
 * Securely serves the single digital product file based on session authorization.
 */
function serveProductFile(req, res) {
  // Check if the session has the correct static identifier for single-product authorization.
  if (req.session.authorizedProduct === "single-product") {
    // Invalidate the authorization immediately to make the link single-use.
    delete req.session.authorizedProduct;

    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "private_downloads",
      config.product.filename,
    );
    // Serve the file for download.
    res.download(filePath, config.product.filename, (err) => {
      if (err) {
        console.error("File download error:", err);
        if (!res.headersSent) {
          res.status(404).send("File not found or an error occurred.");
        }
      }
    });
  } else {
    // ACCESS DENIED, If not authorized, redirect.
    res.status(403).redirect("/redownload");
  }
}

module.exports = {
  renderSuccessPage,
  verifyAndAuthorizeRedownload,
  serveProductFile,
};
