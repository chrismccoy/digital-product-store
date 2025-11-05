/**
 * Admin transactions controller (list, detail, resend receipt).
 */

const productService = require("../../services/product.service");
const transactionService = require("../../services/transaction.service");
const emailService = require("../../services/email.service");
const config = require("../../config/config");
const { paginate } = require("../../lib/paginate");

function renderTransactionsPage(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const perPage = config.transactionsPerPage;
    const total = transactionService.countTransactions(q);

    const queryString = q ? `?q=${encodeURIComponent(q)}` : "";

    const page = paginate({ total, perPage, page: req.params.page });

    if (page.outOfRange) {
      const target =
        page.totalPages === 1
          ? `/admin/transactions${queryString}`
          : `/admin/transactions/page/${page.totalPages}${queryString}`;
      return res.redirect(target);
    }

    const offset = page.startIndex;
    const transactions = transactionService.getTransactionsPage({
      q,
      limit: perPage,
      offset,
    });

    res.render("admin/transactions", {
      transactions,
      total,
      query: q,
      queryString,
      pagination: {
        currentPage: page.currentPage,
        totalPages: page.totalPages,
        hasPreviousPage: page.hasPreviousPage,
        hasNextPage: page.hasNextPage,
      },
    });
  } catch (error) {
    res.status(500).send("Error reading transaction data.");
  }
}

function renderTransactionDetail(req, res) {
  try {
    const transaction = transactionService.findTransactionById(req.params.id);
    if (!transaction) {
      return res
        .status(404)
        .render("admin/transaction-detail", { transaction: null, product: null });
    }
    const product = productService.getProductById(transaction.product.id);
    res.render("admin/transaction-detail", { transaction, product });
  } catch (error) {
    res.status(500).send("Error reading transaction data.");
  }
}

async function resendReceipt(req, res) {
  try {
    const transaction = transactionService.findTransactionById(req.params.id);
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
    }

    const redownloadUrl = `${req.protocol}://${req.get("host")}/redownload`;
    const sent = await emailService.sendPurchaseReceipt(
      transaction,
      redownloadUrl,
    );

    if (!sent) {
      return res.status(502).json({
        success: false,
        message: "Email failed to send. Check your mail settings.",
      });
    }

    transactionService.markEmailSent(transaction.id);
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error resending the receipt." });
  }
}

module.exports = {
  renderTransactionsPage,
  renderTransactionDetail,
  resendReceipt,
};
