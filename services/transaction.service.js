/**
 * Transaction data layer for SQLite.
 */

const db = require("../db/database");

const stmtInsert = db.prepare(`
  INSERT INTO transactions
    (id, orderId, purchaseDate, productId, productName, productPrice,
     payerEmail, payerFirstName, payerLastName)
  VALUES
    (@id, @orderId, @purchaseDate, @productId, @productName, @productPrice,
     @payerEmail, @payerFirstName, @payerLastName)
`);

const stmtGetById = db.prepare("SELECT * FROM transactions WHERE id = ?");
const stmtMarkEmailSent = db.prepare(
  "UPDATE transactions SET email_sent = 1 WHERE id = ?",
);

const stmtGetPage = db.prepare(`
  SELECT * FROM transactions
  ORDER BY purchaseDate DESC
  LIMIT ? OFFSET ?
`);
const stmtCount = db.prepare("SELECT COUNT(*) AS n FROM transactions");

const SEARCH_WHERE = `
  WHERE id LIKE @like OR orderId LIKE @like OR payerEmail LIKE @like
     OR payerFirstName LIKE @like OR payerLastName LIKE @like
     OR productName LIKE @like
`;
const stmtSearchPage = db.prepare(`
  SELECT * FROM transactions
  ${SEARCH_WHERE}
  ORDER BY purchaseDate DESC
  LIMIT @limit OFFSET @offset
`);
const stmtSearchCount = db.prepare(
  `SELECT COUNT(*) AS n FROM transactions ${SEARCH_WHERE}`,
);

const stmtGetByEmail = db.prepare(`
  SELECT * FROM transactions
  WHERE LOWER(payerEmail) = LOWER(?)
  ORDER BY purchaseDate DESC
  LIMIT 1
`);

function rowToTransaction(row) {
  return {
    id: row.id,
    orderId: row.orderId,
    purchaseDate: row.purchaseDate,
    product: {
      id: row.productId,
      name: row.productName,
      price: row.productPrice,
    },
    payer: {
      email: row.payerEmail,
      firstName: row.payerFirstName,
      lastName: row.payerLastName,
    },
    emailSent: row.email_sent === 1,
  };
}

function markEmailSent(transactionId) {
  stmtMarkEmailSent.run(transactionId);
}

function appendTransaction(transaction) {
  stmtInsert.run({
    id: transaction.id,
    orderId: transaction.orderId,
    purchaseDate: transaction.purchaseDate,
    productId: transaction.product.id,
    productName: transaction.product.name,
    productPrice: transaction.product.price,
    payerEmail: transaction.payer.email,
    payerFirstName: transaction.payer.firstName,
    payerLastName: transaction.payer.lastName,
  });
}

function findTransactionById(transactionId) {
  const row = stmtGetById.get(transactionId);
  return row ? rowToTransaction(row) : null;
}

function findLatestTransactionByEmail(email) {
  const row = stmtGetByEmail.get(email.trim());
  return row ? rowToTransaction(row) : null;
}

function getTransactionsPage({ q = "", limit, offset }) {
  const rows = q
    ? stmtSearchPage.all({ like: `%${q}%`, limit, offset })
    : stmtGetPage.all(limit, offset);
  return rows.map(rowToTransaction);
}

function countTransactions(q = "") {
  return q ? stmtSearchCount.get({ like: `%${q}%` }).n : stmtCount.get().n;
}

module.exports = {
  appendTransaction,
  markEmailSent,
  findTransactionById,
  findLatestTransactionByEmail,
  getTransactionsPage,
  countTransactions,
};
