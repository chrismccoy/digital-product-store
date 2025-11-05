/**
 * This loads all environment variables from the .env file,
 * processes them, and exports a single, structured configuration object.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const isShopMode = process.env.APP_MODE === "shop";

let products = [];
let singleProduct = null;

// Load products.json
try {
  const productsPath = path.join(__dirname, "..", "db", "products.json");
  products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
} catch (err) {
  console.error(
    "Fatal: Could not load products.json. Ensure the file exists and is valid JSON. Exiting.",
    err,
  );
  process.exit(1);
}

// If in single product mode, find the specific product to use.
if (!isShopMode) {
  const productId = process.env.SINGLE_PRODUCT_ID;

  if (!productId) {
    console.error(
      "Fatal: APP_MODE is 'single' but SINGLE_PRODUCT_ID is not set in .env. Exiting.",
    );
    process.exit(1);
  }

  singleProduct = products.find((p) => p.id === productId);

  if (!singleProduct) {
    console.error(
      `Fatal: Product with ID "${productId}" not found in products.json. Exiting.`,
    );
    process.exit(1);
  }
}

const config = {
  isShopMode,
  port: process.env.PORT || 3002,
  isProduction: process.env.PAYPAL_API_MODE === "live",
  sessionSecret: process.env.SESSION_SECRET,
  itemsPerPage: parseInt(process.env.ITEMS_PER_PAGE, 10) || 6,

  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },

  // The full catalog, used by shop mode and for lookup in single mode.
  products: products,

  // The specific product object for single mode. Will be null in shop mode.
  product: singleProduct,

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    apiBase:
      process.env.PAYPAL_API_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  },

  site: {
    homeURL: process.env.HOME_URL,
    homeText: process.env.HOME_TEXT,
    siteTitle: process.env.SITE_TITLE,
    contactURL: process.env.CONTACT_URL,
    footerDomain: process.env.FOOTER_DOMAIN,
  },

  email: {
    useSendmail: process.env.EMAIL_USE_SENDMAIL === "true",
    sendmailPath: process.env.SENDMAIL_PATH || "/usr/sbin/sendmail",
    from: process.env.EMAIL_FROM,
    subject: process.env.EMAIL_SUBJECT,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

module.exports = config;
