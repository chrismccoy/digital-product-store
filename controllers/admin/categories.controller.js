/**
 * Admin category management controller.
 */

const categoryService = require("../../services/category.service");
const { slugify } = require("../../lib/slug");

function renderCategoriesPage(req, res) {
  try {
    res.render("admin/categories", {
      categories: categoryService.getAllCategoriesWithCounts(),
    });
  } catch (error) {
    res.status(500).send("Error reading category data.");
  }
}

function createCategory(req, res) {
  try {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required." });
    }
    const category = categoryService.createCategory({
      id: (slugify(name) || "category") + "-" + Date.now(),
      name,
      created_at: new Date().toISOString(),
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving category." });
  }
}

function updateCategory(req, res) {
  try {
    const name = (req.body.name || "").trim();
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required." });
    }
    const updated = categoryService.updateCategory(req.params.id, { name });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, category: updated });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating category." });
  }
}

function deleteCategory(req, res) {
  try {
    const deleted = categoryService.deleteCategory(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting category." });
  }
}

module.exports = {
  renderCategoriesPage,
  createCategory,
  updateCategory,
  deleteCategory,
};
