/**
 * Product layer for by SQLite.
 */

const db = require("../db/database");

const SELECT_BASE = `
  SELECT p.*, c.name AS category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
`;

const ADMIN_ORDER = "ORDER BY p.sort_order ASC, p.rowid ASC";

const SHOP_ORDER = "ORDER BY p.sticky DESC, p.sort_order ASC, p.rowid ASC";
const WHERE_CATEGORY = "WHERE p.category_id = ?";
const WHERE_UNCATEGORIZED = "WHERE p.category_id IS NULL";

const WHERE_LISTED = "WHERE p.noindex = 0";
const WHERE_CATEGORY_LISTED = "WHERE p.category_id = ? AND p.noindex = 0";

const stmtGetAll = db.prepare(`${SELECT_BASE} ${ADMIN_ORDER}`);
const stmtGetAllByCategory = db.prepare(
  `${SELECT_BASE} ${WHERE_CATEGORY} ${ADMIN_ORDER}`,
);
const stmtGetAllUncategorized = db.prepare(
  `${SELECT_BASE} ${WHERE_UNCATEGORIZED} ${ADMIN_ORDER}`,
);
const stmtGetShop = db.prepare(`${SELECT_BASE} ${WHERE_LISTED} ${SHOP_ORDER}`);
const stmtGetShopByCategory = db.prepare(
  `${SELECT_BASE} ${WHERE_CATEGORY_LISTED} ${SHOP_ORDER}`,
);

const SEARCH = "(p.name LIKE @like ESCAPE '\\' OR p.id LIKE @like ESCAPE '\\')";
const stmtSearchAll = db.prepare(`${SELECT_BASE} WHERE ${SEARCH} ${ADMIN_ORDER}`);
const stmtSearchByCategory = db.prepare(
  `${SELECT_BASE} WHERE p.category_id = @category AND ${SEARCH} ${ADMIN_ORDER}`,
);
const stmtSearchUncategorized = db.prepare(
  `${SELECT_BASE} WHERE p.category_id IS NULL AND ${SEARCH} ${ADMIN_ORDER}`,
);

function makeLike(term) {
  return `%${term.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
}

const LIMIT = "LIMIT ? OFFSET ?";
const LIMIT_NAMED = "LIMIT @limit OFFSET @offset";

const stmtGetShopPage = db.prepare(`${SELECT_BASE} ${WHERE_LISTED} ${SHOP_ORDER} ${LIMIT}`);
const stmtGetShopByCategoryPage = db.prepare(
  `${SELECT_BASE} ${WHERE_CATEGORY_LISTED} ${SHOP_ORDER} ${LIMIT}`,
);
const stmtCountShop = db.prepare("SELECT COUNT(*) AS n FROM products p WHERE p.noindex = 0");
const stmtCountShopByCategory = db.prepare(
  "SELECT COUNT(*) AS n FROM products p WHERE p.category_id = ? AND p.noindex = 0",
);

const stmtGetAllPage = db.prepare(`${SELECT_BASE} ${ADMIN_ORDER} ${LIMIT}`);
const stmtGetAllByCategoryPage = db.prepare(
  `${SELECT_BASE} ${WHERE_CATEGORY} ${ADMIN_ORDER} ${LIMIT}`,
);
const stmtGetAllUncategorizedPage = db.prepare(
  `${SELECT_BASE} ${WHERE_UNCATEGORIZED} ${ADMIN_ORDER} ${LIMIT}`,
);
const stmtSearchAllPage = db.prepare(
  `${SELECT_BASE} WHERE ${SEARCH} ${ADMIN_ORDER} ${LIMIT_NAMED}`,
);
const stmtSearchByCategoryPage = db.prepare(
  `${SELECT_BASE} WHERE p.category_id = @category AND ${SEARCH} ${ADMIN_ORDER} ${LIMIT_NAMED}`,
);
const stmtSearchUncategorizedPage = db.prepare(
  `${SELECT_BASE} WHERE p.category_id IS NULL AND ${SEARCH} ${ADMIN_ORDER} ${LIMIT_NAMED}`,
);
const stmtCountAll = db.prepare("SELECT COUNT(*) AS n FROM products");
const stmtCountAllByCategory = db.prepare(
  "SELECT COUNT(*) AS n FROM products WHERE category_id = ?",
);
const stmtCountAllUncategorized = db.prepare(
  "SELECT COUNT(*) AS n FROM products WHERE category_id IS NULL",
);
const stmtCountSearchAll = db.prepare(`SELECT COUNT(*) AS n FROM products p WHERE ${SEARCH}`);
const stmtCountSearchByCategory = db.prepare(
  `SELECT COUNT(*) AS n FROM products p WHERE p.category_id = @category AND ${SEARCH}`,
);
const stmtCountSearchUncategorized = db.prepare(
  `SELECT COUNT(*) AS n FROM products p WHERE p.category_id IS NULL AND ${SEARCH}`,
);

const stmtGetById = db.prepare("SELECT * FROM products WHERE id = ?");

const stmtMinSortOrder = db.prepare("SELECT MIN(sort_order) AS min FROM products");

const stmtInsert = db.prepare(`
  INSERT INTO products (id, name, price, text, filename, image, description, sticky, sort_order, created_at, category_id, service_message, site_url, live_demo, noindex)
  VALUES (@id, @name, @price, @text, @filename, @image, @description, @sticky, @sort_order, @created_at, @category_id, @service_message, @site_url, @live_demo, @noindex)
`);

const stmtUpdate = db.prepare(`
  UPDATE products
  SET name = @name, price = @price, text = @text,
      filename = @filename, image = @image, description = @description,
      sticky = @sticky, category_id = @category_id, service_message = @service_message,
      site_url = @site_url, live_demo = @live_demo, noindex = @noindex
  WHERE id = @id
`);

const stmtSetSortOrder = db.prepare(
  "UPDATE products SET sort_order = ? WHERE id = ?",
);

const stmtDelete = db.prepare("DELETE FROM products WHERE id = ?");

function getAllProducts(categoryId, q) {
  const term = (q || "").trim();
  if (term) {
    const like = makeLike(term);
    if (categoryId === "uncategorized") return stmtSearchUncategorized.all({ like });
    if (categoryId) return stmtSearchByCategory.all({ category: categoryId, like });
    return stmtSearchAll.all({ like });
  }
  if (categoryId === "uncategorized") return stmtGetAllUncategorized.all();
  if (categoryId) return stmtGetAllByCategory.all(categoryId);
  return stmtGetAll.all();
}

function getAllProductsPage(categoryId, q, limit, offset) {
  const term = (q || "").trim();
  if (term) {
    const like = makeLike(term);
    if (categoryId === "uncategorized") {
      return stmtSearchUncategorizedPage.all({ like, limit, offset });
    }
    if (categoryId) {
      return stmtSearchByCategoryPage.all({ category: categoryId, like, limit, offset });
    }
    return stmtSearchAllPage.all({ like, limit, offset });
  }
  if (categoryId === "uncategorized") return stmtGetAllUncategorizedPage.all(limit, offset);
  if (categoryId) return stmtGetAllByCategoryPage.all(categoryId, limit, offset);
  return stmtGetAllPage.all(limit, offset);
}

function countAllProducts(categoryId, q) {
  const term = (q || "").trim();
  if (term) {
    const like = makeLike(term);
    if (categoryId === "uncategorized") return stmtCountSearchUncategorized.get({ like }).n;
    if (categoryId) return stmtCountSearchByCategory.get({ category: categoryId, like }).n;
    return stmtCountSearchAll.get({ like }).n;
  }
  if (categoryId === "uncategorized") return stmtCountAllUncategorized.get().n;
  if (categoryId) return stmtCountAllByCategory.get(categoryId).n;
  return stmtCountAll.get().n;
}

function getShopProducts(categoryId) {
  return categoryId
    ? stmtGetShopByCategory.all(categoryId)
    : stmtGetShop.all();
}

function getShopProductsPage(categoryId, limit, offset) {
  return categoryId
    ? stmtGetShopByCategoryPage.all(categoryId, limit, offset)
    : stmtGetShopPage.all(limit, offset);
}

function countShopProducts(categoryId) {
  return categoryId
    ? stmtCountShopByCategory.get(categoryId).n
    : stmtCountShop.get().n;
}

function getProductById(id) {
  return stmtGetById.get(id);
}

function createProduct(product) {
  const { min } = stmtMinSortOrder.get();
  const record = {
    sticky: 0,
    category_id: null,
    service_message: "",
    site_url: "",
    live_demo: "",
    noindex: 0,
    created_at: new Date().toISOString(),
    ...product,
    sort_order: min === null ? 0 : min - 1,
  };
  stmtInsert.run(record);
  return record;
}

function updateProduct(id, data) {
  const existing = getProductById(id);
  if (!existing) return null;

  const updated = { ...existing, ...data, id };

  stmtUpdate.run({
    id: updated.id,
    name: updated.name,
    price: updated.price,
    text: updated.text,
    filename: updated.filename,
    image: updated.image,
    description: updated.description,
    sticky: updated.sticky ? 1 : 0,
    category_id: updated.category_id || null,
    service_message: updated.service_message || "",
    site_url: updated.site_url || "",
    live_demo: updated.live_demo || "",
    noindex: updated.noindex ? 1 : 0,
  });
  return updated;
}

function deleteProduct(id) {
  const result = stmtDelete.run(id);
  return result.changes > 0;
}

const reorderProducts = db.transaction((orderedIds, startIndex = 0) => {
  const all = stmtGetAll.all().map((p) => p.id);
  all.splice(startIndex, orderedIds.length, ...orderedIds);
  all.forEach((id, index) => stmtSetSortOrder.run(index, id));
});

module.exports = {
  getAllProducts,
  getAllProductsPage,
  countAllProducts,
  getShopProducts,
  getShopProductsPage,
  countShopProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
};
