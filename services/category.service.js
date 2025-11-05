/**
 * Category layer over SQLite.
 */

const db = require("../db/database");

const stmtGetAll = db.prepare("SELECT * FROM categories ORDER BY name ASC");

const stmtGetAllWithCounts = db.prepare(`
  SELECT c.*, COUNT(p.id) AS productCount
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id
  GROUP BY c.id
  ORDER BY c.name ASC
`);

const stmtGetNonEmpty = db.prepare(`
  SELECT c.*, COUNT(p.id) AS productCount
  FROM categories c
  JOIN products p ON p.category_id = c.id AND p.noindex = 0
  GROUP BY c.id
  ORDER BY c.name ASC
`);

const stmtGetById = db.prepare("SELECT * FROM categories WHERE id = ?");
const stmtInsert = db.prepare(
  "INSERT INTO categories (id, name, created_at) VALUES (@id, @name, @created_at)",
);
const stmtUpdate = db.prepare(
  "UPDATE categories SET name = @name WHERE id = @id",
);
const stmtDelete = db.prepare("DELETE FROM categories WHERE id = ?");

function getAllCategories() {
  return stmtGetAll.all();
}

function getAllCategoriesWithCounts() {
  return stmtGetAllWithCounts.all();
}

function getNonEmptyCategories() {
  return stmtGetNonEmpty.all();
}

function getCategoryById(id) {
  return stmtGetById.get(id);
}

function createCategory(category) {
  stmtInsert.run(category);
  return category;
}

function updateCategory(id, data) {
  const existing = getCategoryById(id);
  if (!existing) return null;
  const updated = { id, name: data.name };
  stmtUpdate.run(updated);
  return { ...existing, ...updated };
}

function deleteCategory(id) {
  return stmtDelete.run(id).changes > 0;
}

module.exports = {
  getAllCategories,
  getAllCategoriesWithCounts,
  getNonEmptyCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
