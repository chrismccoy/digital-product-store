/**
 * Page-rendering controller for Shop mode.
 */

const config = require("../../config/config");
const productService = require("../../services/product.service");
const categoryService = require("../../services/category.service");
const tagService = require("../../services/tag.service");
const productImageService = require("../../services/productImage.service");
const grant = require("../../lib/downloadGrant");
const downloadInfo = require("../../lib/downloadInfo");
const seo = require("../../lib/seo");
const { paginate } = require("../../lib/paginate");

function renderProductGrid(req, res, opts) {
  const { total, fetchPage, basePath, activeCategory, showCategoryFilter, heroOverride } = opts;
  const itemsPerPage = config.itemsPerPage;

  const page = paginate({
    total,
    perPage: itemsPerPage,
    page: req.params.page,
  });

  if (page.outOfRange) {
    const lastValidPageUrl =
      page.totalPages === 1
        ? basePath || "/"
        : `${basePath}/page/${page.totalPages}/`;
    return res.redirect(lastValidPageUrl);
  }

  const paginatedProducts = fetchPage(itemsPerPage, page.startIndex);

  const tagMap = tagService.getTagsForProducts(paginatedProducts.map((p) => p.id));
  paginatedProducts.forEach((p) => {
    p.tags = tagMap[p.id] || [];
  });

  const categoryFilterEnabled = config.site.categoryFilterEnabled;

  const pageSeo = seo.buildSeo({
    req,
    path: req.originalUrl.split("?")[0],
    title: opts.seoTitle,
    description: opts.seoDescription,
    type: "website",
    breadcrumbs: opts.breadcrumbs,
    noindex: !opts.isArchive && !!activeCategory,
  });

  res.render("shop/shop", {
    seo: pageSeo,
    breadcrumbs: opts.breadcrumbs || [],
    products: paginatedProducts,
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    contactURL: config.site.contactURL,
    footerDomain: config.site.footerDomain,
    heroIcon: heroOverride?.heroIcon ?? "",
    heroBadge: heroOverride?.heroBadge ?? config.site.heroBadge,
    heroHeadingIcon: heroOverride?.heroHeadingIcon ?? "",
    heroHeading: heroOverride?.heroHeading ?? config.site.heroHeading,
    heroHighlight: heroOverride?.heroHighlight ?? config.site.heroHighlight,
    heroSubtitle: heroOverride?.heroSubtitle ?? config.site.heroSubtitle,
    defaultThumbnail: config.site.defaultThumbnail,
    categoryFilterEnabled,
    showCategoryFilter: showCategoryFilter && categoryFilterEnabled,
    filterCategories:
      showCategoryFilter && categoryFilterEnabled
        ? categoryService.getNonEmptyCategories()
        : [],
    activeCategory,
    isArchive: opts.isArchive || false,
    basePath,
    pagination: {
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      hasPreviousPage: page.hasPreviousPage,
      hasNextPage: page.hasNextPage,
    },
  });
}

function renderShopPage(req, res) {
  const categoryId = req.params.categoryId;
  const isArchive = !!categoryId && !req.path.startsWith("/browse");

  let activeCategory = null;
  if (categoryId) {
    activeCategory = categoryService.getCategoryById(categoryId);
    if (!activeCategory) return res.redirect("/");
  }

  const basePath = !categoryId
    ? ""
    : isArchive
      ? `/category/${categoryId}`
      : `/browse/${categoryId}`;

  return renderProductGrid(req, res, {
    total: productService.countShopProducts(categoryId),
    fetchPage: (limit, offset) =>
      productService.getShopProductsPage(categoryId, limit, offset),
    basePath,
    isArchive,
    activeCategory,
    showCategoryFilter: true,
    seoTitle: activeCategory ? activeCategory.name : config.site.siteTitle,
    seoDescription: activeCategory
      ? `Products in ${activeCategory.name}.`
      : config.seo.defaultDescription,
    breadcrumbs: isArchive && activeCategory
      ? [
          { name: "Home", url: "/" },
          { name: activeCategory.name, url: `/category/${activeCategory.id}` },
        ]
      : undefined,
    heroOverride: isArchive && activeCategory
      ? {
          heroIcon:
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>',
          heroBadge: activeCategory.name,
          heroHeadingIcon:
            '<svg width="0.85em" height="0.85em" class="inline-block align-middle" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z"/></svg>',
          heroHeading: "",
          heroHighlight: activeCategory.name,
          heroSubtitle: `Products in "${activeCategory.name}".`,
        }
      : undefined,
  });
}

function renderTagPage(req, res) {
  const tag = tagService.getTagBySlug(req.params.tagSlug);
  if (!tag) return res.redirect("/");

  return renderProductGrid(req, res, {
    total: tagService.countProductsByTag(tag.id),
    fetchPage: (limit, offset) =>
      tagService.getProductsByTagPage(tag.id, limit, offset),
    basePath: `/tag/${tag.id}`,
    activeCategory: null,
    showCategoryFilter: false,
    seoTitle: `#${tag.name}`,
    seoDescription: `Products tagged ${tag.name}.`,
    breadcrumbs: [
      { name: "Home", url: "/" },
      { name: `#${tag.name}`, url: `/tag/${tag.id}` },
    ],
    heroOverride: {
      heroBadge: `#${tag.name}`,
      heroHeading: "#",
      heroHighlight: tag.name,
      heroSubtitle: `Products tagged "${tag.name}".`,
    },
  });
}

function renderProductPage(req, res) {
  const { productId } = req.params;

  const product = productService.getProductById(productId);

  if (!product) {
    return res.redirect("/");
  }

  if (parseFloat(product.price) === 0) {
    grant.issue(req.session, product.id);
    const { hasFile, serviceMessage } = downloadInfo(
      product,
      config.site.defaultServiceMessage,
    );

    const freeTransaction = {
      id: "FREE-GIFT",
      orderId: "N/A",
      purchaseDate: new Date().toISOString(),
      product: {
        id: product.id,
        name: product.name,
        price: "0.00",
      },
      payer: {
        firstName: "Valued",
        lastName: "Guest",
        email: "No email required",
      },
    };

    return res.render("shop/success", {
      transaction: freeTransaction,
      hasFile,
      serviceMessage,
      seo: seo.buildSeo({ req, path: `/product/${product.id}`, title: product.name, noindex: true }),
      siteTitle: config.site.siteTitle,
      homeURL: config.site.homeURL,
      homeText: config.site.homeText,
      footerDomain: config.site.footerDomain,
    });
  }

  const category = product.category_id
    ? categoryService.getCategoryById(product.category_id)
    : null;

  const crumbs = [{ name: "Home", url: "/" }];
  if (category) crumbs.push({ name: category.name, url: `/category/${category.id}` });
  crumbs.push({ name: product.name, url: `/product/${product.id}` });

  res.render("shop/product", {
    product,
    paypalClientId: config.paypal.clientId,
    seo: seo.buildSeo({
      req,
      path: `/product/${product.id}`,
      title: product.name,
      description: product.description || product.text,
      image: product.image,
      type: "product",
      product,
      breadcrumbs: crumbs,
      noindex: !!product.noindex,
    }),
    breadcrumbs: crumbs,
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
    category,
    tags: tagService.getTagsForProduct(product.id),
    images: productImageService.getImagesForProduct(product.id),
  });
}

function renderCancelPage(req, res) {
  const { productId } = req.query;

  let product = productId ? productService.getProductById(productId) : null;
  if (!product) {
    product = { id: "", name: "Your Item", price: "0.00" };
  }

  res.render("shop/cancel", {
    product,
    seo: seo.buildSeo({ req, path: "/cancel", title: "Order canceled", noindex: true }),
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    contactURL: config.site.contactURL,
    footerDomain: config.site.footerDomain,
  });
}

function renderRedownloadPage(req, res) {
  res.render("shop/redownload", {
    seo: seo.buildSeo({ req, path: "/redownload", title: "Redownload your purchase", noindex: true }),
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
  });
}

module.exports = {
  renderShopPage,
  renderTagPage,
  renderProductPage,
  renderCancelPage,
  renderRedownloadPage,
};
