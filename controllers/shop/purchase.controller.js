/**
 * PayPal order capture controller for Shop mode.
 */

const paypalService = require("../../services/paypal.service");
const productService = require("../../services/product.service");
const completeSale = require("../../services/sale.service");
const { pricesMatch } = require("../../lib/pricing");

async function captureOrder(req, res) {
  const { orderID, productID } = req.body;

  if (!orderID || !productID) {
    return res
      .status(400)
      .json({ success: false, message: "Order ID and Product ID are required." });
  }

  const product = productService.getProductById(productID);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  }

  try {
    const captureData = await paypalService.captureOrder(orderID);

    if (captureData.status !== "COMPLETED") {
      throw new Error("Transaction not completed.");
    }

    const capture = captureData.purchase_units[0].payments.captures[0];
    const amountPaid = capture.amount.value;

    if (!pricesMatch(amountPaid, product.price)) {
      console.warn(
        `SECURITY ALERT: Price mismatch! Product: ${product.id}, ` +
          `Expected: ${product.price}, Paid: ${amountPaid}. OrderID: ${orderID}`,
      );
      throw new Error("Invalid payment amount.");
    }

    const newTransaction = {
      id: capture.id,
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

    completeSale(req, newTransaction);

    return res.json({ success: true, transactionId: newTransaction.id });
  } catch (err) {
    console.error("Capture Order Error:", err);
    const message = err.message || "Failed to capture payment.";
    return res.status(500).json({ success: false, message });
  }
}

module.exports = { captureOrder };
