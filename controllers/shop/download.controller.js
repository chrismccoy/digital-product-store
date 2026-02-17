/**
 * Controller for handling all post purchase actions in SHOP mode.
 * This includes rendering the success page, verifying credentials for redownloads,
 * and securely serving the digital product file using session-based authorization.
 */

const path = require("path");
const config = require("../../config/config");
const transactionService = require("../../services/transaction.service");

/**
 * Renders the success page after a valid purchase and authorizes a download
 * for the specific product that was purchased by setting its ID in the user's session.
 */
async function renderSuccessPage(req, res) {
  // Get the transaction ID from the URL query string (e.g., /purchase/success?transactionId=...).
  const { transactionId } = req.query;
  // If no ID is provided, the user likely navigated here directly. Redirect them away.
  if (!transactionId) return res.redirect("/");
  try {
    // Find the transaction in our database using the provided ID to verify it's legitimate.
    const transaction = await transactionService.findTransactionById(
      transactionId,
    );
    // If a matching, valid transaction is found...
    if (transaction && transaction.product) {
      // Authorize a download ONLY for the product ID found in the verified transaction record.
      // This prevents a user with a valid transaction for one product from accessing another.
      // This stores this authorization in the user's session.
      req.session.authorizedProduct = transaction.product.id;
      // Render the success page and pass the transaction data to the template.
      res.render("shop/success", {
        transaction,
        siteTitle: config.site.siteTitle,
        homeURL: config.site.homeURL,
        homeText: config.site.homeText,
        footerDomain: config.site.footerDomain,
      });
    } else {
      // If no transaction is found, the ID is invalid. Redirect away.
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error rendering success page:", error);
    res.redirect("/");
  }
}

/**
 * Verifies user credentials (transaction ID or email) and authorizes a redownload.
 * This is an API endpoint called by the client-side fetch request from the redownload form.
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
    // Prioritize searching by the unique Transaction ID if provided.
    if (transactionId) {
      transaction = await transactionService.findTransactionById(
        transactionId.trim(),
      );
    } else if (email) {
      // If no ID, search by email to find the user's most recent purchase.
      transaction = await transactionService.findLatestTransactionByEmail(email);
    }
    if (transaction && transaction.product) {
      // If a valid transaction is found, authorize a download for
      // the specific product ID associated with that transaction in the user's session.
      req.session.authorizedProduct = transaction.product.id;
      // Respond to the client with success and the transaction details.
      req.session.save(() => {
        res.json({ success: true, transaction });
      });
    } else {
      // If no match was found, respond with a 404 Not Found status.
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
 * Securely serves the correct digital product file based on session authorization.
 * This endpoint is protected and requires the user to have been authorized by one
 * of the functions above.
 */
function serveProductFile(req, res) {
  // Check the user's session for an authorized product ID.
  const authorizedProductId = req.session.authorizedProduct;
  if (authorizedProductId) {
    // If authorized, find the corresponding product details in our config.
    const product = config.products.find((p) => p.id === authorizedProductId);

    // Invalidate the authorization immediately after the check passes.
    // This makes the download link a "one-time use" link per authorization grant.
    // It prevents a user from copying the `/download/product` link and sharing it.
    // To download again, they must go through the verification process on the redownload page.
    delete req.session.authorizedProduct;

    // A sanity check in case the product was removed from config since purchase.
    if (!product) {
      return res.status(404).send("Product configuration not found.");
    }
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "private_downloads",
      product.filename,
    );
    // Use `res.download()` to serve the file.
    res.download(filePath, product.filename, (err) => {
      // This callback function is executed after the file transfer is complete or fails.
      if (err) {
        console.error("File download error:", err);
        // If headers haven't been sent yet, send our own error response.
        if (!res.headersSent) {
          res.status(404).send("File not found or an error occurred.");
        }
      }
    });
  } else {
    // If the session is not authorized, send a 403 Forbidden status
    res.status(403).redirect("/redownload");
  }
}

module.exports = {
  renderSuccessPage,
  verifyAndAuthorizeRedownload,
  serveProductFile,
};
