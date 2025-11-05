/**
 * This contains capturing a PayPal payment, validating its amount
 * against the server's product catalog, saving a verified transaction
 * record, and sending a receipt email.
 */

const paypalService = require("../../services/paypal.service");
const transactionService = require("../../services/transaction.service");
const emailService = require("../../services/email.service");
const config = require("../../config/config");

/**
 * Handles the server-side capture of a PayPal order.
 */
async function captureOrder(req, res) {
  // Extract IDs from the client request.
  const { orderID, productID } = req.body;
  if (!orderID || !productID) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID and Product ID are required." });
  }

  // Find the product in our SECURE, server-side configuration.
  // This gets the product's price, preventing a malicious user
  // from altering the price on the client side.
  const product = config.products.find((p) => p.id === productID);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  }

  try {
    // Securely capture the payment on the server via the PayPal service.
    // This communicates with PayPal's API to finalize the transaction.
    const captureData = await paypalService.captureOrder(orderID);

    // Validate the response from PayPal.
    if (captureData.status !== "COMPLETED") {
      throw new Error("Transaction not completed.");
    }

    // Verify the payment amount.
    // Extract the amount paid from PayPal's official response and compare
    // it to the price stored in our server-side configuration.
    const capture = captureData.purchase_units[0].payments.captures[0];
    const amountPaid = capture.amount.value;

    if (amountPaid !== product.price) {
      // If the amounts do not match, log a security warning and reject the transaction.
      console.warn(
        `SECURITY ALERT: Price mismatch! Product: ${product.id}, Expected: ${product.price}, Paid: ${amountPaid}. OrderID: ${orderID}`,
      );
      throw new Error("Invalid payment amount.");
    }

    // All checks passed. Create a standardized transaction record.
    const newTransaction = {
      id: capture.id, // The unique PayPal transaction ID (e.g., 8A239974BN579244A)
      orderId: orderID,
      purchaseDate: new Date().toISOString(),
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
      payer: {
        email: captureData.payer.email_address,
        firstName: captureData.payer.name.given_name,
        lastName: captureData.payer.name.surname,
      },
    };

    // Save the verified transaction to our database.
    await transactionService.appendTransaction(newTransaction);

    // Send a receipt email.
    const redownloadUrl = `${req.protocol}://${req.get("host")}/redownload`;
    emailService.sendPurchaseReceipt(newTransaction, redownloadUrl);

    // Respond to the client with success. The client will use the transactionId
    // to redirect to the success page.
    return res.json({ success: true, transactionId: newTransaction.id });
  } catch (err) {
    console.error("Capture Order Error:", err);
    const message = err.message || "Failed to capture payment.";
    return res.status(500).json({ success: false, message });
  }
}

module.exports = { captureOrder };
