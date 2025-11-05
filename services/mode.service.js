/**
 * Resolves the live application mode and the active single-mode product.
 */

const settings = require("./settings.service");
const productService = require("./product.service");

function isShopMode() {
  if (settings.getString("app_mode", "shop") !== "single") return true;
  const id = settings.getString("single_product_id", "");
  return !(id && productService.getProductById(id));
}

function product() {
  if (isShopMode()) return null;
  const id = settings.getString("single_product_id", "");
  return productService.getProductById(id) || null;
}

module.exports = { isShopMode, product };
