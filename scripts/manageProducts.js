#!/usr/bin/env node

/**
 * CLI tool for managing the product catalog in the SQLite database.
 *
 * Add a product interactively (guided prompts):
 * ```
 * node manageProducts.js
 * ```
 *
 * Add a product via command-line arguments:
 * ```
 * node manageProducts.js --name="My Product" --price="19.99" --filename="/path/to/file.zip" --image="/path/to/thumb.png"
 * ```
 * Pass a full local path for --image or --filename to have the file copied into the
 * correct directory automatically. Pass a bare filename for --filename if the file is
 * already in private_downloads/, or a URL for --image if using an external image.
 *
 * Delete a product by its ID:
 * ```
 * node manageProducts.js --delete <product-id>
 * ```
 *
 * Grant a customer access to a product (creates a manual transaction record):
 * ```
 * node manageProducts.js --grant=<product-id> --email="jane@example.com" --first="Jane" --last="Doe"
 * ```
 *
 * Show help:
 * ```
 * node manageProducts.js --help
 * ```
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const productService = require("../services/product.service");
const transactionService = require("../services/transaction.service");
const categoryService = require("../services/category.service");
const tagService = require("../services/tag.service");
const productImageService = require("../services/productImage.service");
const thumbnails = require("../lib/thumbnails");
const config = require("../config/config");
const { deletePublicUpload, deleteGalleryDir } = require("../lib/files");
const { slugify } = require("../lib/slug");
const { validateAndFormatPrice, isValidPriceFormat } = require("../lib/pricing");

const UPLOADS_DIR = path.join(__dirname, "../public/uploads");
const DOWNLOADS_DIR = path.join(__dirname, "../private_downloads");
const GALLERIES_DIR = path.join(__dirname, "../public/galleries");

function copyImageFile(filePath) {
  const ext = path.extname(filePath);
  const destName = `product-${Date.now()}${ext}`;
  const destPath = path.join(UPLOADS_DIR, destName);
  fs.copyFileSync(filePath, destPath);
  return `/uploads/${destName}`;
}

function copyProductFile(filePath) {
  const destName = path.basename(filePath);
  const destPath = path.join(DOWNLOADS_DIR, destName);
  fs.copyFileSync(filePath, destPath);
  return destName;
}

function copyGalleryFile(filePath, productId) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Gallery image not found: "${filePath}"`);
  }
  const dir = path.join(GALLERIES_DIR, productId);
  fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(filePath);
  const destName = `gallery-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.copyFileSync(filePath, path.join(dir, destName));
  return `/galleries/${productId}/${destName}`;
}

async function addGalleryImages(productId, rawList) {
  const localPaths = String(rawList || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!localPaths.length) return 0;

  const webPaths = localPaths.map((p) => {
    const web = copyGalleryFile(p, productId);
    console.log(`Copied screenshot → ${web}`);
    return web;
  });

  const thumbs =
    config.site.galleryThumbnailsEnabled && thumbnails.isSharpAvailable()
      ? await thumbnails.generateThumbs(webPaths)
      : [];
  productImageService.addImages(productId, webPaths, thumbs);
  return webPaths.length;
}

function resolveImage(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (!fs.existsSync(value)) {
    throw new Error(`Image file not found: "${value}"`);
  }
  const result = copyImageFile(value);
  console.log(`Copied image → ${result}`);
  return result;
}

function resolveProductFile(value) {
  if (!value) return "";
  if (value.includes("/") || value.includes("\\")) {
    if (!fs.existsSync(value)) {
      throw new Error(`Product file not found: "${value}"`);
    }
    const result = copyProductFile(value);
    console.log(`Copied product file → private_downloads/${result}`);
    return result;
  }
  return value;
}

function createPrompter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    question: (query) => new Promise((resolve) => rl.question(query, resolve)),

    confirm: async (query) => {
      const answer = await new Promise((resolve) =>
        rl.question(`${query} (y/N) `, resolve),
      );
      return ["y", "yes"].includes(answer.toLowerCase().trim());
    },

    close: () => rl.close(),
  };
}

function toBool(value) {
  if (value === true) return true;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase().trim());
}

async function handleAddProduct(argv) {
  let newProductData;

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
        if (!newProductData.name) console.log("Product name cannot be empty.");
      } while (!newProductData.name);

      do {
        newProductData.price = await prompter.question('Price (e.g., "49.00"): ');
        if (!isValidPriceFormat(newProductData.price)) {
          console.log('Invalid format. Please use "XX.XX".');
        }
      } while (!isValidPriceFormat(newProductData.price));

      newProductData.id = await prompter.question(
        "Product ID (optional, press Enter to auto-generate): ",
      );
      newProductData.text = await prompter.question("Short description/tagline: ");
      newProductData.filename = await prompter.question(
        "Product file (filename if already in private_downloads/, or full path to copy): ",
      );
      newProductData.image = await prompter.question(
        "Image (URL or full path to a local image file): ",
      );
      newProductData.description = await prompter.question(
        "Longer description (for shop page): ",
      );

      newProductData.sticky = await prompter.confirm(
        "Pin this product to the top of the shop (sticky)?",
      );

      newProductData.private = await prompter.confirm(
        "Make this product private (unlisted, reachable only by its direct link)?",
      );

      const categories = categoryService.getAllCategories();
      if (categories.length) {
        console.log("Available categories:");
        categories.forEach((c) => console.log(`  ${c.id}  (${c.name})`));
        newProductData.category = await prompter.question(
          "Category ID (optional, press Enter for none): ",
        );
      } else {
        console.log(
          "No categories exist yet (create them in the admin panel). Leaving uncategorized.",
        );
        newProductData.category = "";
      }

      newProductData.serviceMessage = await prompter.question(
        "Message for buyers when there is no file (optional): ",
      );

      newProductData.tags = await prompter.question(
        "Tags (comma-separated, optional): ",
      );
      newProductData.site_url = await prompter.question(
        "Website URL (optional): ",
      );
      newProductData.live_demo = await prompter.question(
        "Live demo URL (optional): ",
      );
      newProductData.gallery = await prompter.question(
        "Screenshot image paths (comma-separated local files, optional): ",
      );
    } finally {
      prompter.close();
    }
  }

  if (!newProductData.id) {
    newProductData.id = slugify(newProductData.name);
    console.log(`Auto-generated Product ID: ${newProductData.id}`);
  }

  const existing = productService.getProductById(newProductData.id);
  if (existing) {
    throw new Error(
      `Error: A product with the ID "${newProductData.id}" already exists. Please choose a unique ID.`,
    );
  }

  newProductData.price = validateAndFormatPrice(newProductData.price);

  const sticky = toBool(newProductData.sticky) ? 1 : 0;

  const noindex =
    toBool(newProductData.private || newProductData.noindex) ? 1 : 0;

  const categoryId =
    (newProductData.category || "").toString().trim() || null;
  if (categoryId && !categoryService.getCategoryById(categoryId)) {
    throw new Error(
      `Error: Category "${categoryId}" not found. Leave it blank, or create the category in the admin panel first.`,
    );
  }

  const serviceMessage = (
    newProductData.serviceMessage ||
    newProductData["service-message"] ||
    ""
  ).toString();

  const siteUrl = (
    newProductData.site_url ||
    newProductData["site-url"] ||
    ""
  ).toString().trim();
  const liveDemo = (
    newProductData.live_demo ||
    newProductData["live-demo"] ||
    ""
  ).toString().trim();

  const tagsInput = (newProductData.tags || newProductData.tag || "").toString();
  const galleryInput = (newProductData.gallery || "").toString();

  const newProduct = {
    id: newProductData.id,
    name: newProductData.name,
    price: newProductData.price,
    text: newProductData.text || "",
    filename: resolveProductFile(newProductData.filename || ""),
    image: resolveImage(newProductData.image || ""),
    description: newProductData.description || "",
    sticky,
    noindex,
    category_id: categoryId,
    service_message: serviceMessage,
    site_url: siteUrl,
    live_demo: liveDemo,
  };

  productService.createProduct(newProduct);

  if (tagsInput.trim()) {
    tagService.setProductTags(newProduct.id, tagsInput);
    console.log(`  Tags set: ${tagsInput.trim()}`);
  }
  const galleryCount = await addGalleryImages(newProduct.id, galleryInput);
  if (galleryCount) {
    console.log(`  Screenshots added: ${galleryCount}`);
  }

  console.log("\nSuccess! Product has been added to the database:");
  console.log(JSON.stringify(newProduct, null, 2));
}

async function handleGrantAccess(argv) {
  let productId, email, firstName, lastName;

  if (argv.grant && argv.email && argv.first && argv.last) {
    productId = argv.grant;
    email = argv.email;
    firstName = argv.first;
    lastName = argv.last;
  } else {
    const prompter = createPrompter();
    try {
      do {
        productId = argv.grant && argv.grant !== true
          ? argv.grant
          : await prompter.question("Product ID to grant access to: ");
        if (!productId) console.log("Product ID cannot be empty.");
      } while (!productId);

      email = argv.email || await prompter.question("Customer email: ");
      firstName = argv.first || await prompter.question("Customer first name: ");
      lastName = argv.last || await prompter.question("Customer last name: ");
    } finally {
      prompter.close();
    }
  }

  const product = productService.getProductById(productId);
  if (!product) {
    throw new Error(`Error: Product with ID "${productId}" not found.`);
  }

  const transactionId = `MANUAL-${crypto.randomUUID()}`;

  transactionService.appendTransaction({
    id: transactionId,
    orderId: `MANUAL-ORDER-${crypto.randomUUID()}`,
    purchaseDate: new Date().toISOString(),
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
    },
    payer: {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    },
  });

  console.log(`\nAccess granted! Transaction record created:`);
  console.log(`   Transaction ID : ${transactionId}`);
  console.log(`   Product        : ${product.name} (${product.id})`);
  console.log(`   Customer       : ${firstName} ${lastName} <${email}>`);
  console.log(`\n   The customer can download their file from the Redownload page`);
  console.log(`   using this Transaction ID or their email address.`);
}

async function handleDeleteProduct(productIdToDelete, deleteFile = false) {
  const productToDelete = productService.getProductById(productIdToDelete);

  if (!productToDelete) {
    throw new Error(
      `Error: Product with ID "${productIdToDelete}" not found.`,
    );
  }

  console.log("\nFound product to delete:");
  console.log(JSON.stringify(productToDelete, null, 2));

  const prompter = createPrompter();
  try {
    const confirmed = await prompter.confirm(
      `Are you sure you want to permanently delete "${productToDelete.name}" (ID: ${productIdToDelete})?`,
    );

    if (confirmed) {
      for (const img of productImageService.getImagesForProduct(productIdToDelete)) {
        if (img.path && img.path.startsWith("/uploads/")) deletePublicUpload(img.path);
      }
      deleteGalleryDir(productIdToDelete);
      deletePublicUpload(productToDelete.image);

      if (deleteFile && productToDelete.filename) {
        const filePath = path.join(
          DOWNLOADS_DIR,
          path.basename(productToDelete.filename),
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`  Deleted downloadable file: private_downloads/${path.basename(filePath)}`);
        } else {
          console.log(`  Downloadable file not found on disk (nothing to delete): ${productToDelete.filename}`);
        }
      } else if (productToDelete.filename) {
        console.log(`  Kept downloadable file: private_downloads/${productToDelete.filename} (use --delete-file to remove it)`);
      }

      productService.deleteProduct(productIdToDelete);
      console.log(`\nSuccess! Product "${productIdToDelete}" has been deleted.`);
    } else {
      console.log("\nDeletion cancelled by user.");
    }
  } finally {
    prompter.close();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const argv = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.substring(2).split("=");
      if (value !== undefined) {
        argv[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        argv[key] = args[i + 1];
        i++;
      } else {
        argv[key] = true;
      }
    } else if (arg === "-h") {
      argv.help = true;
    }
  }

  return argv;
}

function showHelp() {
  console.log(`
  Product Catalog Management Script

  Reads from and writes to the SQLite database at db/store.db.
  Changes take effect immediately, with no server restart required.

  Usage:
    node manageProducts.js [options]

  Options:
    --name="<name>"       Product display name.
    --price="<price>"     Product price in "XX.XX" format.
    --id="<id>"           (Optional) Unique product slug ID. Auto-generated if omitted.
    --text="..."          Short product description or tagline.
    --filename="..."      Downloadable file. Pass a bare filename (e.g., product-v1.zip) if
                          the file is already in private_downloads/, or a full path to a local
                          file and it will be copied into private_downloads/ automatically.
    --image="..."         Product thumbnail. Pass a URL (https://...) or a full path to a
                          local image file and it will be copied into public/uploads/
                          automatically.
    --description="..."   Longer product description.
    --sticky              Pin the product to the top of the shop grid.
    --private             Hide the product from the shop grid, category and tag pages,
                          and the sitemap, and ask search engines not to list it. It stays
                          reachable only by its direct URL (a private product link).
    --category="<id>"     Assign the product to an existing category by its ID.
                          Must match a category created in the admin panel.
    --service-message="..." Message shown to buyers after purchase when the product
                          has no downloadable file (e.g. a service you deliver later).
    --tags="a, b, c"      Comma-separated tags. New tags are created automatically.
    --site-url="..."      Optional website link shown as a button on the product page.
    --live-demo="..."     Optional live-demo link shown as a button on the product page.
    --gallery="a.png,b.png" Comma-separated local screenshot paths. Each is copied into
                          public/galleries/<id>/. Thumbnails are generated when the
                          gallery-thumbnail setting and the sharp package are both enabled.

    --delete <id>         Permanently deletes the product with the specified ID. Also removes
                          its thumbnail image and gallery screenshots (with thumbnails) from
                          disk. The downloadable file is kept unless --delete-file is passed.
    --delete-file         Used with --delete: also delete the product's downloadable file
                          from private_downloads/. Off by default so the file is kept.

    --grant <id>          Grants a customer access to a product by creating a manual
                          transaction record. The customer can then use the Redownload
                          page with the generated Transaction ID or their email address.
      --email="..."         Customer's email address.
      --first="..."         Customer's first name.
      --last="..."          Customer's last name.

    -h, --help            Show this help message.

  Examples:
    # Add a product using interactive prompts:
    node manageProducts.js

    # Add a product using command-line arguments:
    node manageProducts.js --name="New Gadget" --price="49.99"

    # Add a sticky product in a category:
    node manageProducts.js --name="New Gadget" --price="49.99" --sticky --category="tools"

    # Add a private product (unlisted, shareable only by its direct link):
    node manageProducts.js --name="Secret Deal" --price="9.99" --private

    # Add a product with tags, links and screenshots:
    node manageProducts.js --name="New Gadget" --price="49.99" \\
      --tags="web, tailwind" --site-url="https://example.com" \\
      --live-demo="https://demo.example.com" --gallery="./a.png,./b.png"

    # Delete a product (keeps the downloadable file):
    node manageProducts.js --delete new-gadget

    # Delete a product and its downloadable file:
    node manageProducts.js --delete new-gadget --delete-file

    # Grant a customer access to a product (interactive):
    node manageProducts.js --grant

    # Grant a customer access to a product (one-liner):
    node manageProducts.js --grant=my-product --email="jane@example.com" --first="Jane" --last="Doe"
  `);
}

async function main() {
  const argv = parseArgs();

  if (argv.help) {
    showHelp();
    return;
  }

  if (argv.delete) {
    if (typeof argv.delete !== "string" || argv.delete.trim() === "") {
      throw new Error("Error: --delete flag requires a valid product ID.");
    }
    await handleDeleteProduct(argv.delete, toBool(argv["delete-file"]));
  } else if (argv.grant !== undefined) {
    await handleGrantAccess(argv);
  } else {
    await handleAddProduct(argv);
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
