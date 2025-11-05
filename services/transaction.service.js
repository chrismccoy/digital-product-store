/**
 * This handles all reading from and writing to the `transactions.json` file.
 */

const fs = require("fs").promises;
const path = require("path");

// Define a path to our JSON database file.
const TRANSACTIONS_PATH = path.join(
  __dirname,
  "..",
  "data",
  "transactions.json",
);

/**
 * Ensures the data directory and transactions.json file exist.
 * If the file doesn't exist, it creates an empty one to prevent crashes on first run.
 */
async function initializeDatabase() {
  try {
    const dataDirPath = path.dirname(TRANSACTIONS_PATH);
    // Ensure the 'data' directory exists. `recursive: true` prevents errors if it already exists.
    await fs.mkdir(dataDirPath, { recursive: true });
    // Check if the transactions.json file itself exists. This will throw an error if not found.
    await fs.access(TRANSACTIONS_PATH);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("transactions.json not found. Creating a new one...");
      // Create the file and initialize it with an empty array `[]` to be valid JSON.
      await fs.writeFile(TRANSACTIONS_PATH, "[]", "utf8");
      console.log("transactions.json created successfully.");
    } else {
      // Re-throw any other errors like permissions issues
      throw error;
    }
  }
}

/**
 * Reads and parses all transactions from the JSON database file.
 */
async function readTransactions() {
  const data = await fs.readFile(TRANSACTIONS_PATH, "utf8");
  return JSON.parse(data);
}

/**
 * Appends a new transaction to the JSON database file
 */
async function appendTransaction(newTransaction) {
  // Read all existing transactions from the file into memory.
  const transactions = await readTransactions();
  // Add the new transaction to the array in memory.
  transactions.push(newTransaction);
  // Write the entire, updated array back to the file, overwriting the old content.
  await fs.writeFile(
    TRANSACTIONS_PATH,
    JSON.stringify(transactions, null, 2),
    "utf8",
  );
}

/**
 * Finds a transaction by its unique PayPal transaction ID.
 */
async function findTransactionById(transactionId) {
  const transactions = await readTransactions();
  // Use the Array.find method to efficiently search for the first transaction with a matching ID.
  return transactions.find((t) => t.id === transactionId) || null;
}

/**
 * Finds the most recent transaction for a given email address.
 * Useful for redownload requests where the user only remembers their email.
 */
async function findLatestTransactionByEmail(email) {
  const transactions = await readTransactions();
  // Filter all transactions to find only those matching the provided email.
  // This will convert both emails to lower case and trim whitespace for a case-insensitive match.
  const userTransactions = transactions.filter(
    (t) => t.payer.email.toLowerCase() === email.toLowerCase().trim(),
  );

  // If the user has no transactions, return null immediately.
  if (userTransactions.length === 0) {
    return null;
  }

  // Sort the user's transactions by date in descending order (newest first).
  userTransactions.sort(
    (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate),
  );
  // Return the first element of the sorted array, which is the most recent transaction.
  return userTransactions[0];
}

module.exports = {
  initializeDatabase,
  appendTransaction,
  findTransactionById,
  findLatestTransactionByEmail,
};
