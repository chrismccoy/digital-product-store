/**
 * Admin Dashboard
 * This contains the handling all requests related to the admin panel.
 * It also handles the rendering pages, authentication, and CRUD operations
 */

const { readProducts, writeProducts } = require("../../services/product.service");
const config = require("../../config/config");

/**
 * Renders the admin login page.
 */
function renderLoginPage(req, res) {
  res.render("admin/login");
}

/**
 * Renders the main product management dashboard.
 */
async function renderDashboard(req, res) {
  try {
    const products = await readProducts();
    res.render("admin/dashboard", { products });
  } catch (error) {
    res.status(500).send("Error reading product data.");
  }
}

/**
 * Handles an AJAX login request. Validates credentials and establishes an
 * authenticated session.
 */
function handleLogin(req, res) {
  const { username, password } = req.body;

  if (
    username === config.admin.username &&
    password === config.admin.password
  ) {
    req.session.isLoggedIn = true;
    req.session.save((err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Session error." });
      }
      res.status(200).json({ success: true });
    });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid username or password" });
  }
}

/**
 * Destroys the user's session to log them out.
 */
function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Failed to destroy session:", err);
    res.redirect("/admin/login");
  });
}

/**
 * Fetches data for a single product by its ID.
 */
async function getProductById(req, res) {
  try {
    const products = await readProducts();
    const product = products.find((p) => p.id === req.params.id);
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

/**
 * Creates a new product and adds it to the catalog.
 */
async function createProduct(req, res) {
  try {
    const products = await readProducts();
    const newProduct = {
      id: req.body.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: req.body.name,
      price: req.body.price,
      text: req.body.text || "",
      filename: req.body.filename || "",
      image: req.body.image || "",
      description: req.body.description || "",
    };
    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving product." });
  }
}

/**
 * Updates an existing product identified by its ID.
 */
async function updateProduct(req, res) {
  try {
    const products = await readProducts();
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index !== -1) {
      const updatedProduct = { ...products[index], ...req.body };
      products[index] = updatedProduct;
      await writeProducts(products);
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

/**
 * Deletes a product from the catalog by its ID.
 */
async function deleteProduct(req, res) {
  try {
    let products = await readProducts();
    const initialLength = products.length;
    products = products.filter((p) => p.id !== req.params.id);

    if (products.length === initialLength) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    await writeProducts(products);
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting product." });
  }
}

module.exports = {
  renderLoginPage,
  renderDashboard,
  handleLogin,
  handleLogout,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
