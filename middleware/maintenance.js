/**
 * Maintenance mode
 */

const config = require("../config/config");

const ALLOW_DURING_MAINTENANCE = new Set([
  "/api/capture-order", // finish an in-flight PayPal capture
  "/purchase/success", // show the download link after capture
  "/download/product", // serve the purchased file
]);

function maintenance(req, res, next) {
  if (req.path.startsWith("/admin")) return next();

  if (!config.site.maintenanceEnabled) return next();

  if (req.session && req.session.isLoggedIn) return next();

  if (ALLOW_DURING_MAINTENANCE.has(req.path)) return next();

  res.status(503);
  res.set("Retry-After", "3600");
  return res.render("maintenance", {
    siteTitle: config.site.siteTitle,
    eyebrow: config.site.maintenanceEyebrow,
    heading: config.site.maintenanceHeading,
    message: config.site.maintenanceMessage,
  });
}

module.exports = maintenance;
