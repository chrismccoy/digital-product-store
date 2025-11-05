/**
 * Completing a sale
 */

const transactionService = require("./transaction.service");
const emailService = require("./email.service");

function completeSale(req, transaction) {
  transactionService.appendTransaction(transaction);

  const redownloadUrl = `${req.protocol}://${req.get("host")}/redownload`;
  emailService
    .sendPurchaseReceipt(transaction, redownloadUrl)
    .then((sent) => {
      if (sent) transactionService.markEmailSent(transaction.id);
    })
    .catch((err) => console.error("Receipt email error:", err));
}

module.exports = completeSale;
