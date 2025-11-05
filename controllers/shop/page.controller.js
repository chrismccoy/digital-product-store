/**
 * Controller for rendering all pages in SHOP mode.
 */

const config = require("../../config/config");

/**
 * Renders the main shop page, which displays a grid of products.
 * This function implements pagination to distribute products across multiple pages,
 * reading the current page number from the URL path (e.g., '/page/2').
 * It will redirect if an invalid page number is requested.
 *
 */
function renderShopPage(req, res) {
  const allProducts = config.products;
  const itemsPerPage = config.itemsPerPage;
  const totalProducts = allProducts.length;

  // Calculate the total number of pages needed to display all products.
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Determine and Validate Current Page
  // Get the current page from the URL path parameter (e.g., '/page/2' -> page = 2).
  let currentPage = parseInt(req.params.page, 10);

  // Handle cases where the page parameter is missing (root URL), not a number, or less than 1.
  // This defaults the user to the first page.
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  // If a user requests a page number higher than the total number of pages,
  // redirect to the last valid page.
  if (currentPage > totalPages && totalPages > 0) {
    // Determine the correct URL for the last page. Page 1's canonical URL is '/',
    const lastValidPageUrl = totalPages === 1 ? "/" : `/page/${totalPages}/`;
    return res.redirect(lastValidPageUrl);
  }

  // Slice Products for Display
  // Calculate the starting index for slicing the products array.
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Extract the specific subset of products to be displayed on the current page.
  const paginatedProducts = allProducts.slice(startIndex, endIndex);

  // Render the 'shop/shop.ejs' template and pass it all the necessary data.
  res.render("shop/shop", {
    products: paginatedProducts,
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    contactURL: config.site.contactURL,
    footerDomain: config.site.footerDomain,
    pagination: {
      currentPage,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  });
}

/**
 * Renders the dedicated purchase page for a single, specific product.
 */
function renderProductPage(req, res) {
  // Extract the product ID from the dynamic URL parameter (e.g., /product/brutal-ui-kit).
  const { productId } = req.params;

  // Find the specific product object within our secure, server-side product catalog.
  const product = config.products.find((p) => p.id === productId);

  // If no product matches the ID, redirect to the main shop
  if (!product) {
    return res.redirect("/");
  }

  // If the product price is 0, skip PayPal and go straight to success.
  if (parseFloat(product.price) === 0) {
    // Authorize the session immediately for this product.
    req.session.authorizedProduct = product.id;

    // Create a "Dummy" transaction object.
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

    // Render the success page immediately.
    return res.render("shop/success", {
      transaction: freeTransaction,
      siteTitle: config.site.siteTitle,
      homeURL: config.site.homeURL,
      homeText: config.site.homeText,
      footerDomain: config.site.footerDomain,
    });
  }

  // Render the 'shop/product.ejs' template, passing only the details for the
  // specific product found, along with other necessary config variables.
  res.render("shop/product", {
    product: product,
    paypalClientId: config.paypal.clientId,
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
  });
}

/**
 * Renders the transaction cancellation page. This page is shown when a user
 * manually closes the PayPal payment window.
 */
function renderCancelPage(req, res) {
  // The product ID is passed as a URL query parameter from the client-side
  // PayPal script's `onCancel` callback (e.g., /cancel?productId=brutal-ui-kit).
  const { productId } = req.query;
  let product = null;

  // If a product ID was provided, find its details to display on the page.
  if (productId) {
    product = config.products.find((p) => p.id === productId);
  }

  // If no product is found create a placeholder object.
  // This prevents the EJS template from crashing when it
  // tries to access properties like `product.name`.
  if (!product) {
    product = { id: "", name: "Your Item", price: "0.00" };
  }

  // Render the 'shop/cancel.ejs' template with the found or placeholder product.
  res.render("shop/cancel", {
    product: product,
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    contactURL: config.site.contactURL,
    footerDomain: config.site.footerDomain,
  });
}

/**
 * Renders the redownload request page, which contains a form for the user
 * to enter their purchase credentials to get a new download link.
 */
function renderRedownloadPage(req, res) {
  res.render("shop/redownload", {
    siteTitle: config.site.siteTitle,
    homeURL: config.site.homeURL,
    homeText: config.site.homeText,
    footerDomain: config.site.footerDomain,
  });
}

module.exports = {
  renderShopPage,
  renderProductPage,
  renderCancelPage,
  renderRedownloadPage,
};
