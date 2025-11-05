/**
 * Tag layer over SQLite.
 */

const db = require("../db/database");
const { slugify } = require("../lib/slug");

const stmtGetAll = db.prepare("SELECT * FROM tags ORDER BY name ASC");
const stmtGetBySlug = db.prepare("SELECT * FROM tags WHERE id = ?");
const stmtInsertTag = db.prepare(
  "INSERT OR IGNORE INTO tags (id, name, created_at) VALUES (@id, @name, @created_at)",
);

const stmtGetForProduct = db.prepare(`
  SELECT t.* FROM tags t
  JOIN product_tags pt ON pt.tag_id = t.id
  WHERE pt.product_id = ?
  ORDER BY t.name ASC
`);

const stmtDeleteJoins = db.prepare("DELETE FROM product_tags WHERE product_id = ?");
const stmtInsertJoin = db.prepare(
  "INSERT OR IGNORE INTO product_tags (product_id, tag_id) VALUES (?, ?)",
);

const TAG_SELECT = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  JOIN product_tags pt ON pt.product_id = p.id
  WHERE pt.tag_id = ? AND p.noindex = 0
  ORDER BY p.sticky DESC, p.sort_order ASC, p.rowid ASC
`;
const stmtGetProductsByTag = db.prepare(TAG_SELECT);
const stmtGetProductsByTagPage = db.prepare(`${TAG_SELECT} LIMIT ? OFFSET ?`);
const stmtCountProductsByTag = db.prepare(`
  SELECT COUNT(*) AS n
  FROM products p
  JOIN product_tags pt ON pt.product_id = p.id
  WHERE pt.tag_id = ? AND p.noindex = 0
`);

function parseNames(rawNames) {
  const list = Array.isArray(rawNames) ? rawNames : String(rawNames || "").split(",");
  return list.map((n) => n.trim()).filter(Boolean);
}

function getAllTags() {
  return stmtGetAll.all();
}

function getTagBySlug(slug) {
  return stmtGetBySlug.get(slug);
}

function getTagsForProduct(productId) {
  return stmtGetForProduct.all(productId);
}

function getTagsForProducts(productIds) {
  if (!productIds || productIds.length === 0) return {};
  const placeholders = productIds.map(() => "?").join(",");
  const rows = db
    .prepare(`
      SELECT pt.product_id AS productId, t.*
      FROM product_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.product_id IN (${placeholders})
      ORDER BY t.name ASC
    `)
    .all(...productIds);
  const map = {};
  for (const row of rows) {
    const { productId, ...tag } = row;
    (map[productId] = map[productId] || []).push(tag);
  }
  return map;
}

const setProductTags = db.transaction((productId, rawNames) => {
  const names = parseNames(rawNames);
  const now = new Date().toISOString();
  const seen = new Set();
  stmtDeleteJoins.run(productId);
  for (const name of names) {
    const id = slugify(name);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    stmtInsertTag.run({ id, name, created_at: now });
    stmtInsertJoin.run(productId, id);
  }
});

function getProductsByTag(tagId) {
  return stmtGetProductsByTag.all(tagId);
}

function getProductsByTagPage(tagId, limit, offset) {
  return stmtGetProductsByTagPage.all(tagId, limit, offset);
}

function countProductsByTag(tagId) {
  return stmtCountProductsByTag.get(tagId).n;
}

module.exports = {
  getAllTags,
  getTagBySlug,
  getTagsForProduct,
  getTagsForProducts,
  setProductTags,
  getProductsByTag,
  getProductsByTagPage,
  countProductsByTag,
};
