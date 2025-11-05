/**
 * Product gallery image layer over SQLite (one product has many images).
 */

const db = require("../db/database");

const stmtGetForProduct = db.prepare(
  "SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, rowid ASC",
);
const stmtMaxSort = db.prepare(
  "SELECT MAX(sort_order) AS max FROM product_images WHERE product_id = ?",
);
const stmtInsert = db.prepare(`
  INSERT INTO product_images (id, product_id, path, thumb_path, sort_order, created_at)
  VALUES (@id, @product_id, @path, @thumb_path, @sort_order, @created_at)
`);
const stmtGetById = db.prepare("SELECT * FROM product_images WHERE id = ?");
const stmtDelete = db.prepare("DELETE FROM product_images WHERE id = ?");

function getImagesForProduct(productId) {
  return stmtGetForProduct.all(productId);
}

const addImages = db.transaction((productId, paths, thumbPaths = []) => {
  const { max } = stmtMaxSort.get(productId);
  let next = max === null ? 0 : max + 1;
  const now = new Date().toISOString();
  const rows = [];
  paths.forEach((path, i) => {
    const row = {
      id: `img-${Date.now()}-${next}-${Math.round(Math.random() * 1e9)}`,
      product_id: productId,
      path,
      thumb_path: thumbPaths[i] || "",
      sort_order: next,
      created_at: now,
    };
    stmtInsert.run(row);
    rows.push(row);
    next += 1;
  });
  return rows;
});

function deleteImage(id) {
  const row = stmtGetById.get(id);
  if (!row) return null;
  stmtDelete.run(id);
  return { path: row.path, thumb_path: row.thumb_path || "" };
}

module.exports = { getImagesForProduct, addImages, deleteImage };
