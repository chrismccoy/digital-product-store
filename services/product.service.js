/**
 * Provides functions for reading from and writing to the products.json file.
 */

const fs = require("fs").promises;
const path = require("path");

// Path to the product catalog file.
const PRODUCTS_PATH = path.join(__dirname, "..", "db", "products.json");

/**
 * Reads and parses the products.json file.
 */
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist (Error NO ENTity), it's a valid state.
    if (error.code === "ENOENT") {
      return []; // Return an empty array for a non-existent catalog.
    }
    // For any other error (e.g., malformed JSON), it's a critical failure.
    console.error("Fatal error reading or parsing products.json:", error);
    throw new Error(`Could not read products.json: ${error.message}`);
  }
}

/**
 * This function overwrites the existing file with the new data, formatting the
 * JSON with an indentation of 2 spaces for readability.
 */
async function writeProducts(products) {
  try {
    // Stringify the data with pretty-printing (null replacer, 2-space indent).
    const data = JSON.stringify(products, null, 2);
    await fs.writeFile(PRODUCTS_PATH, data, "utf8");
  } catch (error) {
    console.error("Fatal error writing to products.json:", error);
    throw new Error(`Could not write to products.json: ${error.message}`);
  }
}

module.exports = { readProducts, writeProducts };
