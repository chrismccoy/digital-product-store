/**
 * Admin settings controller (site settings, default thumbnail).
 */

const productService = require("../../services/product.service");
const settingsService = require("../../services/settings.service");
const adminAuth = require("../../services/adminAuth.service");
const config = require("../../config/config");
const mode = require("../../services/mode.service");
const { deletePublicUpload } = require("../../lib/files");
const thumbnails = require("../../lib/thumbnails");

function renderSettingsPage(req, res) {
  try {
    res.render("admin/settings", {
      site: config.site,
      hero: {
        badge: config.site.heroBadge,
        heading: config.site.heroHeading,
        highlight: config.site.heroHighlight,
        subtitle: config.site.heroSubtitle,
        navLabel: config.site.headerNavLabel,
        rights: config.site.footerRights,
      },
      itemsPerPage: config.itemsPerPage,
      adminItemsPerPage: config.adminItemsPerPage,
      transactionsPerPage: config.transactionsPerPage,
      categoryFilterEnabled: config.site.categoryFilterEnabled,
      galleryThumbnailsEnabled: config.site.galleryThumbnailsEnabled,
      sharpAvailable: thumbnails.isSharpAvailable(),
      maintenanceEnabled: config.site.maintenanceEnabled,
      maintenanceEyebrow: settingsService.getString("maintenance_eyebrow", ""),
      maintenanceHeading: config.site.maintenanceHeading,
      maintenanceMessage: config.site.maintenanceMessage,
      seoBaseUrl: settingsService.getString("seo_base_url", ""),
      seoDefaultDescription: settingsService.getString("seo_default_description", ""),
      seoOgImage: settingsService.getString("seo_og_image", ""),
      seoTwitterHandle: settingsService.getString("seo_twitter_handle", ""),
      seoDiscourage: config.seo.discourage,
      defaultServiceMessage: config.site.defaultServiceMessage,
      contactEyebrow: config.site.contactEyebrow,
      contactHeading: config.site.contactHeading,
      contactHighlight: config.site.contactHighlight,
      contactSubtitle: config.site.contactSubtitle,
      defaultThumbnail: config.site.defaultThumbnail,
      customThumbnail: settingsService.getString("default_thumbnail", ""),
      emailSubject: config.email.subject,
      emailFromName: config.email.fromName,
      emailFromEmail: config.email.fromEmail,
      emailUseSendmail: config.email.useSendmail,
      emailSendmailPath: config.email.sendmailPath,
      emailHost: config.email.host,
      emailPort: config.email.port,
      emailUser: config.email.user,
      emailHasPass: Boolean(config.email.pass),
      adminUsername: adminAuth.getUsername(),
      isShopMode: mode.isShopMode(),
      currentSingleId: settingsService.getString("single_product_id", ""),
      products: productService.getAllProducts(),
    });
  } catch (error) {
    res.redirect("/admin/dashboard");
  }
}

function validateSettings(body) {
  const mode = body.app_mode === "single" ? "single" : "shop";

  const perPage = parseInt(body.items_per_page, 10);
  if (Number.isNaN(perPage) || perPage < 1) {
    return { error: "Items per page must be a positive whole number." };
  }

  const adminPerPage = parseInt(body.admin_items_per_page, 10);
  if (Number.isNaN(adminPerPage) || adminPerPage < 1) {
    return { error: "Admin products per page must be a positive whole number." };
  }

  const txPerPage = parseInt(body.transactions_per_page, 10);
  if (Number.isNaN(txPerPage) || txPerPage < 1) {
    return { error: "Transactions per page must be a positive whole number." };
  }

  const fromEmail = (body.email_from_email || "").trim();
  if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { error: "The From email address is not valid." };
  }

  const singleProductId = (body.single_product_id || "").trim();
  if (mode === "single") {
    if (!singleProductId) {
      return { error: "Choose a product to serve in single-product mode." };
    }
    if (!productService.getProductById(singleProductId)) {
      return { error: "The selected single-mode product no longer exists." };
    }
  }

  const useSendmail = body.email_transport === "sendmail";

  let emailPort = null;
  if (!useSendmail) {
    emailPort = parseInt(body.email_port, 10);
    if (Number.isNaN(emailPort) || emailPort < 1 || emailPort > 65535) {
      return { error: "SMTP port must be a number between 1 and 65535." };
    }
  }

  const toSave = {
    site_title: body.site_title || "",
    home_url: body.home_url || "",
    home_text: body.home_text || "",
    contact_url: body.contact_url || "",
    footer_domain: body.footer_domain || "",
    hero_badge: body.hero_badge || "",
    hero_heading: body.hero_heading || "",
    hero_highlight: body.hero_highlight || "",
    hero_subtitle: body.hero_subtitle || "",
    header_nav_label: body.header_nav_label || "",
    footer_rights: body.footer_rights || "",
    category_filter_enabled: body.category_filter_enabled ? "1" : "0",
    gallery_thumbnails: body.gallery_thumbnails ? "1" : "0",
    maintenance_mode: body.maintenance_mode ? "1" : "0",
    maintenance_eyebrow: body.maintenance_eyebrow || "",
    maintenance_heading: body.maintenance_heading || "",
    maintenance_message: body.maintenance_message || "",
    seo_base_url: (body.seo_base_url || "").trim().replace(/\/+$/, ""),
    seo_default_description: body.seo_default_description || "",
    seo_twitter_handle: (body.seo_twitter_handle || "").trim(),
    seo_discourage: body.seo_discourage ? "1" : "0",
    default_service_message: body.default_service_message || "",
    contact_eyebrow: body.contact_eyebrow || "",
    contact_heading: body.contact_heading || "",
    contact_highlight: body.contact_highlight || "",
    contact_subtitle: body.contact_subtitle || "",
    items_per_page: perPage,
    admin_items_per_page: adminPerPage,
    transactions_per_page: txPerPage,
    email_subject: body.email_subject || "",
    email_from_name: body.email_from_name || "",
    email_from_email: fromEmail,
    email_use_sendmail: useSendmail ? "1" : "0",
    email_sendmail_path: body.email_sendmail_path || "/usr/sbin/sendmail",
    email_host: body.email_host || "",
    email_user: body.email_user || "",
    app_mode: mode,
    single_product_id: singleProductId,
  };

  if (emailPort !== null) toSave.email_port = emailPort;

  if (body.email_pass) toSave.email_pass = body.email_pass;

  return { toSave };
}

function updateSettings(req, res) {
  try {
    const { error, toSave } = validateSettings(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    settingsService.setMany(toSave);
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error saving settings." });
  }
}

function deleteStoredDefaultThumbnail() {
  deletePublicUpload(settingsService.getString("default_thumbnail", ""));
}

function updateDefaultThumbnail(req, res) {
  try {
    const imageFile = req.files?.image?.[0];
    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "Choose an image to upload." });
    }
    deleteStoredDefaultThumbnail();
    const imagePath = `/uploads/${imageFile.filename}`;
    settingsService.setMany({ default_thumbnail: imagePath });
    res.json({ success: true, image: imagePath });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error saving default thumbnail." });
  }
}

function removeDefaultThumbnail(req, res) {
  try {
    deleteStoredDefaultThumbnail();
    settingsService.setMany({ default_thumbnail: "" });
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error removing default thumbnail." });
  }
}

function updateOgImage(req, res) {
  try {
    const imageFile = req.files?.image?.[0];
    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "Choose an image to upload." });
    }
    deletePublicUpload(settingsService.getString("seo_og_image", ""));
    const imagePath = `/uploads/${imageFile.filename}`;
    settingsService.setMany({ seo_og_image: imagePath });
    res.json({ success: true, image: imagePath });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving OG image." });
  }
}

function removeOgImage(req, res) {
  try {
    deletePublicUpload(settingsService.getString("seo_og_image", ""));
    settingsService.setMany({ seo_og_image: "" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error removing OG image." });
  }
}

module.exports = {
  renderSettingsPage,
  updateSettings,
  updateDefaultThumbnail,
  removeDefaultThumbnail,
  updateOgImage,
  removeOgImage,
};
