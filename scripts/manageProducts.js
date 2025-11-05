#!/usr/bin/env node

/**
 * A script for managing a product catalog in a JSON file.
 *
 * To ADD a product:
 * 1. Interactive Mode: Run `node manageProducts.js` to be prompted for each detail.
 * 2. CLI Argument Mode: Pass arguments like `node manageProducts.js --name="My Product" --price="19.99"`
 *
 * To DELETE a product:
 * `node manageProducts.js --delete <product-id>`
 *
 * To see HELP:
 * `node manageProducts.js --help`
 */

const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

const PRODUCTS_PATH = path.join(__dirname, "..", "db" , "products.json");

/**
 * Creates a reusable for handling prompts.
 */
function createPrompter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    /**
     * Asks the user a question and returns their answer as a promise.
     */
    question: (query) => new Promise((resolve) => rl.question(query, resolve)),

    /**
     * Asks the user a yes/no question.
     */
    confirm: async (query) => {
      const answer = await new Promise((resolve) =>
        rl.question(`${query} (y/N) `, resolve),
      );
      // Returns true only for 'y' or 'yes'
      return ["y", "yes"].includes(answer.toLowerCase().trim());
    },

    close: () => rl.close(),
  };
}

/**
 * Reads and parses the products.json file.
 */
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, it's a fresh start, so return an empty array.
    if (error.code === "ENOENT") {
      return [];
    }
    throw new Error(`Error reading or parsing products.json: ${error.message}`);
  }
}

/**
 * Writes an array of products to the products.json file.
 */
async function writeProducts(products) {
  const data = JSON.stringify(products, null, 2);
  await fs.writeFile(PRODUCTS_PATH, data, "utf8");
}

/**
 * Generates a URL-friendly "slug" (ID) from a product name.
 */
function generateIdFromName(name) {
  return name
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Validates that a price is a string in the "XX.XX" format.
 */
function validateAndFormatPrice(price) {
  const priceString = String(price);
  if (!/^\d+(\.\d{2})$/.test(priceString)) {
    throw new Error(
      `Invalid price format: "${price}". Please use the format "XX.XX" (e.g., "49.00").`,
    );
  }
  return priceString;
}

/**
 * Handles the adding a new product.
 */
async function handleAddProduct(argv) {
  let newProductData;

  // If core arguments are provided, use CLI mode. Otherwise, switch to interactive mode.
  if (argv.name && argv.price) {
    console.log("Adding product from command-line arguments...");
    newProductData = { ...argv };
  } else {
    console.log(
      "Welcome to the interactive product creator! Please provide the following details:",
    );
    const prompter = createPrompter();
    try {
      newProductData = {};
      do {
        newProductData.name = await prompter.question("Product Name: ");
        if (!newProductData.name)
          console.log("Product name cannot be empty.");
      } while (!newProductData.name);

      do {
        newProductData.price = await prompter.question(
          'Price (e.g., "49.00"): ',
        );
        if (!/^\d+(\.\d{2})$/.test(newProductData.price)) {
          console.log('Invalid format. Please use "XX.XX".');
        }
      } while (!/^\d+(\.\d{2})$/.test(newProductData.price));

      newProductData.id = await prompter.question(
        "Product ID (optional, press Enter to auto-generate): ",
      );
      newProductData.text = await prompter.question(
        "Short description/tagline: ",
      );
      newProductData.filename = await prompter.question(
        "Downloadable filename (e.g., product-v1.zip): ",
      );
      newProductData.image = await prompter.question("Image URL: ");
      newProductData.description = await prompter.question(
        "Longer description (for shop page): ",
      );
    } finally {
      prompter.close();
    }
  }

  const products = await readProducts();

  // If the user did not provide an ID, generate one from the product name.
  if (!newProductData.id) {
    newProductData.id = generateIdFromName(newProductData.name);
    console.log(`Auto-generated Product ID: ${newProductData.id}`);
  }

  // Ensure the product ID is unique before proceeding.
  if (products.some((p) => p.id === newProductData.id)) {
    throw new Error(
      `❌ Error: A product with the ID "${newProductData.id}" already exists. Please choose a unique ID.`,
    );
  }

  // Validate the price format.
  newProductData.price = validateAndFormatPrice(newProductData.price);

  // Construct the final product object with a consistent key order and default values.
  const newProduct = {
    id: newProductData.id,
    name: newProductData.name,
    price: newProductData.price,
    text: newProductData.text || "",
    filename: newProductData.filename || "",
    image: newProductData.image || "",
    description: newProductData.description || "",
  };

  products.push(newProduct);
  await writeProducts(products);

  console.log("\n✅ Success! Product has been added to products.json:");
  console.log(JSON.stringify(newProduct, null, 2));
}

/**
 * Handles the deleting a product by its ID.
 */
async function handleDeleteProduct(productIdToDelete) {
  const products = await readProducts();
  const productIndex = products.findIndex((p) => p.id === productIdToDelete);

  // Verify that the product exists before attempting to delete.
  if (productIndex === -1) {
    throw new Error(
      `❌ Error: Product with ID "${productIdToDelete}" not found.`,
    );
  }

  const productToDelete = products[productIndex];
  console.log("\nFound product to delete:");
  console.log(JSON.stringify(productToDelete, null, 2));

  // Ask the user for confirmation before proceeding.
  const prompter = createPrompter();
  try {
    const confirmed = await prompter.confirm(
      `Are you sure you want to permanently delete "${productToDelete.name}" (ID: ${productIdToDelete})?`,
    );

    if (confirmed) {
      // Remove the product from the array using its index.
      products.splice(productIndex, 1);
      await writeProducts(products);
      console.log(
        `\n✅ Success! Product "${productIdToDelete}" has been deleted.`,
      );
    } else {
      console.log("\nDeletion cancelled by user.");
    }
  } finally {
    prompter.close();
  }
}

/**
 * Parses command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const argv = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.substring(2).split("=");

      if (value !== undefined) {
        // Handles `--key=value` format.
        argv[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        // Handles `--key value` format.
        argv[key] = args[i + 1];
        i++; // Skip the next element, as it has been consumed as the value.
      } else {
        // Handles boolean flags like `--help`.
        argv[key] = true;
      }
    } else if (arg === "-h") {
      // Alias for help.
      argv.help = true;
    }
  }
  return argv;
}

/**
 * Displays the help message with usage instructions and available options.
 */
function showHelp() {
  console.log(`
  Product Catalog Management Script

  A standalone CLI tool to manage a products.json file.

  Usage:
    node manageProducts.js [options]

  Options:
    --name="<name>"       Product display name.
    --price="<price>"     Product price in "XX.XX" format.
    --id="<id>"           (Optional) Unique product ID. Auto-generated if omitted.
    --text="..."          Short product description or tagline.
    --filename="..."      Downloadable filename (e.g., product-v1.zip).
    --image="..."         URL for the product image.
    --description="..."   Longer product description.

    --delete <id>         Deletes the product with the specified ID.

    -h, --help            Show this help message.

  Examples:
    # Add a product using interactive prompts:
    node manageProducts.js

    # Add a product using command-line arguments:
    node manageProducts.js --name="New Gadget" --price="49.99"

    # Delete a product:
    node manageProducts.js --delete new-gadget
  `);
}

/**
 * Parses arguments and executes the functions
 */
async function addProducts() {
  const argv = parseArgs();

  if (argv.help) {
    showHelp();
    return;
  }

  if (argv.delete) {
    if (typeof argv.delete !== "string" || argv.delete.trim() === "") {
      throw new Error("Error: --delete flag requires a valid product ID.");
    }
    await handleDeleteProduct(argv.delete);
  } else {
    await handleAddProduct(argv);
  }
}

// Run the main function and handle any errors
addProducts().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
