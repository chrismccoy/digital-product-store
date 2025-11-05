/**
 * Serves robots.txt and sitemap.xml for the public storefront.
 */

const config = require("../config/config");
const seo = require("../lib/seo");
const mode = require("../services/mode.service");
const productService = require("../services/product.service");
const categoryService = require("../services/category.service");
const tagService = require("../services/tag.service");

function robots(req, res) {
  res.type("text/plain");
  if (config.seo.discourage) {
    return res.send("User-agent: *\nDisallow: /\n");
  }
  const sitemapUrl = `${seo.baseUrl(req)}/sitemap.xml`;
  res.send(`User-agent: *\nDisallow: /admin\n\nSitemap: ${sitemapUrl}\n`);
}

function sitemap(req, res) {
  const urls = [];
  const add = (path) => urls.push(seo.absoluteUrl(req, path));

  add("/");
  if (mode.isShopMode()) {
    for (const p of productService.getShopProducts()) add(`/product/${p.id}`);
    for (const c of categoryService.getNonEmptyCategories()) add(`/category/${c.id}`);
    for (const t of tagService.getAllTags()) add(`/tag/${t.id}`);
  } else {
    add("/purchase");
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    "\n</urlset>\n";

  res.type("application/xml").send(body);
}

module.exports = { robots, sitemap };
