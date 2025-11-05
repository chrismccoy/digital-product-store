/**
 * Initializes and exports a single shared SQLite database connection.
 */

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "store.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS tags (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS products (
    id              TEXT PRIMARY KEY,       -- URL-friendly slug (e.g. "my-product")
    name            TEXT NOT NULL,          -- Display name shown to buyers
    price           TEXT NOT NULL,          -- Decimal string in "XX.XX" format
    text            TEXT NOT NULL DEFAULT '',       -- Short tagline on the shop grid
    filename        TEXT NOT NULL DEFAULT '',       -- File in /private_downloads/
    image           TEXT NOT NULL DEFAULT '',       -- Product card image URL
    description     TEXT NOT NULL DEFAULT '',       -- Long description on the product page
    sticky          INTEGER NOT NULL DEFAULT 0,     -- 1 pins to the top of the shop grid
    sort_order      INTEGER NOT NULL DEFAULT 0,     -- Manual display order (lower first)
    service_message TEXT NOT NULL DEFAULT '',       -- Post-purchase note for no-file products
    category_id     TEXT REFERENCES categories(id) ON DELETE SET NULL,
    site_url        TEXT NOT NULL DEFAULT '',       -- Optional product website link
    live_demo       TEXT NOT NULL DEFAULT '',       -- Optional live demo link
    noindex         INTEGER NOT NULL DEFAULT 0,     -- 1 = unlisted/private (direct URL only)
    created_at      TEXT NOT NULL DEFAULT ''        -- ISO-8601 creation timestamp
  );

  CREATE TABLE IF NOT EXISTS product_tags (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id     TEXT NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id         TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    path       TEXT NOT NULL,
    thumb_path TEXT NOT NULL DEFAULT '',   -- Pre-generated thumbnail (when sharp is enabled)
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id             TEXT PRIMARY KEY,        -- PayPal capture ID
    orderId        TEXT NOT NULL,           -- PayPal order ID from the client
    purchaseDate   TEXT NOT NULL,           -- ISO-8601 purchase timestamp
    productId      TEXT NOT NULL,           -- Purchased product ID
    productName    TEXT NOT NULL,           -- Snapshot of the name at purchase time
    productPrice   TEXT NOT NULL,           -- Snapshot of the price at purchase time
    payerEmail     TEXT NOT NULL,
    payerFirstName TEXT NOT NULL,
    payerLastName  TEXT NOT NULL,
    email_sent     INTEGER NOT NULL DEFAULT 0  -- 1 once the receipt email has been sent
  );
`);

const existingColumns = new Set(
  db.prepare("PRAGMA table_info(products)").all().map((col) => col.name),
);

if (!existingColumns.has("sticky")) {
  db.exec("ALTER TABLE products ADD COLUMN sticky INTEGER NOT NULL DEFAULT 0");
}

if (!existingColumns.has("sort_order")) {
  db.exec("ALTER TABLE products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0");
  db.exec("UPDATE products SET sort_order = rowid");
}

if (!existingColumns.has("service_message")) {
  db.exec(
    "ALTER TABLE products ADD COLUMN service_message TEXT NOT NULL DEFAULT ''",
  );
}

if (!existingColumns.has("category_id")) {
  db.exec(
    "ALTER TABLE products ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL",
  );
}

if (!existingColumns.has("site_url")) {
  db.exec("ALTER TABLE products ADD COLUMN site_url TEXT NOT NULL DEFAULT ''");
}

if (!existingColumns.has("live_demo")) {
  db.exec("ALTER TABLE products ADD COLUMN live_demo TEXT NOT NULL DEFAULT ''");
}

if (!existingColumns.has("noindex")) {
  db.exec("ALTER TABLE products ADD COLUMN noindex INTEGER NOT NULL DEFAULT 0");
}

if (!existingColumns.has("created_at")) {
  db.exec("ALTER TABLE products ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
  const rows = db.prepare("SELECT id FROM products").all();
  const setCreatedAt = db.prepare("UPDATE products SET created_at = ? WHERE id = ?");
  const backfill = db.transaction(() => {
    for (const { id } of rows) {
      const match = /-(\d{10,})$/.exec(id);
      if (match) {
        setCreatedAt.run(new Date(Number(match[1])).toISOString(), id);
      }
    }
  });
  backfill();
}

const productImageColumns = new Set(
  db.prepare("PRAGMA table_info(product_images)").all().map((col) => col.name),
);
if (!productImageColumns.has("thumb_path")) {
  db.exec("ALTER TABLE product_images ADD COLUMN thumb_path TEXT NOT NULL DEFAULT ''");
}

const transactionColumns = new Set(
  db.prepare("PRAGMA table_info(transactions)").all().map((col) => col.name),
);

if (!transactionColumns.has("email_sent")) {
  db.exec(
    "ALTER TABLE transactions ADD COLUMN email_sent INTEGER NOT NULL DEFAULT 0",
  );
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
  CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_noindex ON products(noindex);
  CREATE INDEX IF NOT EXISTS idx_product_tags_tag_id ON product_tags(tag_id);
`);

module.exports = db;
