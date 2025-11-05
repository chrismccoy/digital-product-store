/**
 * Manages payment processing and verification for SINGLE PRODUCT mode.
 */

const paypalService = require("../../services/paypal.service");
const transactionService = require("../../services/transaction.service");
const emailService = require("../../services/email.service");
const config = require("../../config/config");

/**
 * Handles the server-side capture of a PayPal order in single product mode.
 */
async function captureOrder(req, res) {
  const { orderID } = req.body;
  if (!orderID) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID is required." });
  }
  try {
    // Capture the payment via the PayPal service.
    const captureData = await paypalService.captureOrder(orderID);
    if (captureData.status !== "COMPLETED") {
      throw new Error("Transaction not completed.");
    }
    const capture = captureData.purchase_units[0].payments.captures[0];
    const amountPaid = capture.amount.value;

    // Compare the amount paid with the single product's price from our secure server-side config.
    if (amountPaid !== config.product.price) {
      console.warn(
        `Price mismatch! Expected ${config.product.price}, but received ${amountPaid}. OrderID: ${orderID}`,
      );
      throw new Error("Invalid payment amount.");
    }

    // Create a standardized transaction record. Include a `product` object
    // with a static ID to maintain a consistent data schema with shop mode.
    const newTransaction = {
      id: capture.id,
      orderId: orderID,
      purchaseDate: new Date().toISOString(),
      product: {
        id: "single-product", // Use a static ID for the single product.
        name: config.product.name,
        price: config.product.price,
      },
      payer: {
        email: captureData.payer.email_address,
        firstName: captureData.payer.name.given_name,
        lastName: captureData.payer.name.surname,
      },
    };

    // Save the transaction and send the receipt email.
    await transactionService.appendTransaction(newTransaction);
    const redownloadUrl = `${req.protocol}://${req.get("host")}/redownload`;
    emailService.sendPurchaseReceipt(newTransaction, redownloadUrl);

    // Respond to the client with success.
    return res.json({ success: true, transactionId: newTransaction.id });
  } catch (err) {
    console.error("Capture Order Error:", err);

    const message = err.message || "Failed to capture payment.";
    return res.status(500).json({ success: false, message });
  }
}

module.exports = { captureOrder };
