/**
 * Admin product controller (dashboard, CRUD, reorder).
 */

const path = require("path");
const productService = require("../../services/product.service");
const categoryService = require("../../services/category.service");
const tagService = require("../../services/tag.service");
const productImageService = require("../../services/productImage.service");
const config = require("../../config/config");
const { paginate } = require("../../lib/paginate");
const { slugify } = require("../../lib/slug");
const { isValidPriceFormat } = require("../../lib/pricing");

const {
  deletePublicUpload,
  moveGalleryFiles,
  deleteGalleryDir,
} = require("../../lib/files");

const thumbnails = require("../../lib/thumbnails");

function thumbnailsActive() {
  return config.site.galleryThumbnailsEnabled && thumbnails.isSharpAvailable();
}

function toIdArray(value) {
  return [].concat(value || []).filter((v) => typeof v === "string" && v.trim());
}

function renderDashboard(req, res) {
  try {
    const categories = categoryService.getAllCategories();

    let activeCategory = (req.query.category || "").trim();
    const validFilter =
      activeCategory === "uncategorized" ||
      categories.some((c) => c.id === activeCategory);
    if (!validFilter) activeCategory = "";

    const q = (req.query.q || "").trim();

    const reorderEnabled = !activeCategory && !q;

    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (q) params.set("q", q);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const category = activeCategory || undefined;
    const totalProducts = productService.countAllProducts(category, q);
    const itemsPerPage = config.adminItemsPerPage;

    const page = paginate({
      total: totalProducts,
      perPage: itemsPerPage,
      page: req.params.page,
    });

    if (page.outOfRange) {
      const target =
        page.totalPages === 1
          ? `/admin/dashboard${queryString}`
          : `/admin/dashboard/page/${page.totalPages}${queryString}`;
      return res.redirect(target);
    }

    const startIndex = page.startIndex;
    const products = productService.getAllProductsPage(
      category,
      q,
      itemsPerPage,
      startIndex,
    );

    const email = config.email;
    const emailReady =
      Boolean(email.from) &&
      (email.useSendmail ? Boolean(email.sendmailPath) : Boolean(email.host));

    res.render("admin/dashboard", {
      products,
      totalProducts,
      emailReady,
      startIndex,
      categories,
      activeCategory,
      q,
      reorderEnabled,
      queryString,
      pagination: {
        currentPage: page.currentPage,
        totalPages: page.totalPages,
        hasPreviousPage: page.hasPreviousPage,
        hasNextPage: page.hasNextPage,
      },
    });
  } catch (error) {
    res.status(500).send("Error reading product data.");
  }
}

function renderAddProductPage(req, res) {
  res.render("admin/add-product", {
    categories: categoryService.getAllCategories(),
    tagsValue: "",
    galleryImages: [],
  });
}

function renderEditProductPage(req, res) {
  try {
    const product = productService.getProductById(req.params.id);
    if (!product) return res.redirect("/admin/dashboard");
    res.render("admin/edit-product", {
      product,
      categories: categoryService.getAllCategories(),
      tagsValue: tagService.getTagsForProduct(product.id).map((t) => t.name).join(", "),
      galleryImages: productImageService.getImagesForProduct(product.id),
    });
  } catch (error) {
    res.redirect("/admin/dashboard");
  }
}

function getProductById(req, res) {
  try {
    const product = productService.getProductById(req.params.id);
    if (product) {
      res.json({ success: true, product });
    } else {
      res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error reading product data." });
  }
}

async function createProduct(req, res) {
  try {
    if (!isValidPriceFormat(req.body.price)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be in "XX.XX" format (e.g. "19.99").',
      });
    }

    const imageFile = req.files?.image?.[0];
    const productFile = req.files?.productfile?.[0];

    const newProduct = {
      id: (slugify(req.body.name) || "product") + "-" + Date.now(),
      name: req.body.name,
      price: req.body.price,
      text: req.body.text || "",
      filename: productFile ? path.basename(productFile.originalname) : (req.body.filename || ""),
      image: imageFile ? `/uploads/${imageFile.filename}` : "",
      description: req.body.description || "",
      sticky: req.body.sticky ? 1 : 0,
      category_id: req.body.category_id || null,
      service_message: req.body.service_message || "",
      site_url: req.body.site_url || "",
      live_demo: req.body.live_demo || "",
      noindex: req.body.noindex ? 1 : 0,
    };

    productService.createProduct(newProduct);

    tagService.setProductTags(newProduct.id, req.body.tags);

    const galleryFiles = req.files?.gallery || [];
    if (galleryFiles.length) {
      const paths = moveGalleryFiles(newProduct.id, galleryFiles);
      const thumbs = thumbnailsActive()
        ? await thumbnails.generateThumbs(paths)
        : [];
      productImageService.addImages(newProduct.id, paths, thumbs);
    }

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving product." });
  }
}

async function updateProduct(req, res) {
  try {
    const existing = productService.getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!isValidPriceFormat(req.body.price)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be in "XX.XX" format (e.g. "19.99").',
      });
    }

    const imageFile = req.files?.image?.[0];
    const productFile = req.files?.productfile?.[0];

    let imagePath;
    if (imageFile) {
      imagePath = `/uploads/${imageFile.filename}`;
      deletePublicUpload(existing.image);
    } else {
      imagePath = req.body.existing_image || existing.image;
    }

    const filename = productFile ? path.basename(productFile.originalname) : (req.body.existing_filename || existing.filename);

    const updatedProduct = productService.updateProduct(req.params.id, {
      ...req.body,
      image: imagePath,
      filename,
      sticky: req.body.sticky ? 1 : 0,
      category_id: req.body.category_id || null,
      service_message: req.body.service_message || "",
      site_url: req.body.site_url || "",
      live_demo: req.body.live_demo || "",
      noindex: req.body.noindex ? 1 : 0,
    });

    if (updatedProduct) {
      tagService.setProductTags(req.params.id, req.body.tags);

      for (const imageId of toIdArray(req.body.delete_images)) {
        const removed = productImageService.deleteImage(imageId);
        if (removed) {
          deletePublicUpload(removed.path);
          if (removed.thumb_path) deletePublicUpload(removed.thumb_path);
        }
      }

      const galleryFiles = req.files?.gallery || [];
      if (galleryFiles.length) {
        const paths = moveGalleryFiles(req.params.id, galleryFiles);
        const thumbs = thumbnailsActive()
          ? await thumbnails.generateThumbs(paths)
          : [];
        productImageService.addImages(req.params.id, paths, thumbs);
      }

      res.json({ success: true, product: updatedProduct });
    } else {
      res.status(404).json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating product." });
  }
}

function reorderProducts(req, res) {
  try {
    const { order } = req.body;

    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order payload." });
    }

    let startIndex = parseInt(req.body.startIndex, 10);
    if (Number.isNaN(startIndex) || startIndex < 0) startIndex = 0;

    productService.reorderProducts(order, startIndex);
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error saving product order." });
  }
}

function deleteProduct(req, res) {
  try {
    for (const img of productImageService.getImagesForProduct(req.params.id)) {
      if (img.path && img.path.startsWith("/uploads/")) deletePublicUpload(img.path);
    }
    deleteGalleryDir(req.params.id);

    const deleted = productService.deleteProduct(req.params.id);

    if (deleted) {
      res.json({ success: true, message: "Product deleted" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting product." });
  }
}

module.exports = {
  renderDashboard,
  renderAddProductPage,
  renderEditProductPage,
  getProductById,
  createProduct,
  updateProduct,
  reorderProducts,
  deleteProduct,
};
