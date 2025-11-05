/**
 * PayPal order capture controller for Single Product Mode
 */

const paypalService = require("../../services/paypal.service");
const mode = require("../../services/mode.service");
const completeSale = require("../../services/sale.service");
const { pricesMatch } = require("../../lib/pricing");

async function captureOrder(req, res) {
  const { orderID } = req.body;

  if (!orderID) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID is required." });
  }

  try {
    const product = mode.product();

    const captureData = await paypalService.captureOrder(orderID);

    if (captureData.status !== "COMPLETED") {
      throw new Error("Transaction not completed.");
    }

    const capture = captureData.purchase_units[0].payments.captures[0];
    const amountPaid = capture.amount.value;

    if (!pricesMatch(amountPaid, product.price)) {
      console.warn(
        `Price mismatch! Expected ${product.price}, ` +
          `but received ${amountPaid}. OrderID: ${orderID}`,
      );
      throw new Error("Invalid payment amount.");
    }

    const newTransaction = {
      id: capture.id,
      orderId: orderID,
      purchaseDate: new Date().toISOString(),
      product: {
        id: "single-product",
        name: product.name,
        price: product.price,
      },
      payer: {
        email: captureData.payer.email_address,
        firstName: captureData.payer.name.given_name,
        lastName: captureData.payer.name.surname,
      },
    };

    completeSale(req, newTransaction);

    return res.json({ success: true, transactionId: newTransaction.id });
  } catch (err) {
    console.error("Capture Order Error:", err);
    const message = err.message || "Failed to capture payment.";
    return res.status(500).json({ success: false, message });
  }
}

module.exports = { captureOrder };
