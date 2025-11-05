/**
 * Central application configuration.
 */

require("dotenv").config();

const settings = require("../services/settings.service");

// Defaults for admin managed settings.
const siteDefaults = {
  homeURL: "/",
  homeText: "Home",
  siteTitle: "Digital Product Store",
  contactURL: "/contact/",
  footerDomain: "",
};

const itemsPerPageDefault = 6;
const adminItemsPerPageDefault = 15;
const transactionsPerPageDefault = 20;
const emailSubjectDefault = "Your Purchase Receipt & Download Link";

const fromDefault = { name: "", email: "" };

const emailUseSendmailDefault = true;
const sendmailPathDefault = "/usr/sbin/sendmail";
const emailHostDefault = "";
const emailPortDefault = 587;
const emailUserDefault = "";
const emailPassDefault = "";

function composeFrom(name, email) {
  if (!email) return "";
  return name ? `"${name.replace(/"/g, "")}" <${email}>` : email;
}

const site = {
  get homeURL() {
    return settings.getString("home_url", siteDefaults.homeURL);
  },
  get homeText() {
    return settings.getString("home_text", siteDefaults.homeText);
  },
  get siteTitle() {
    return settings.getString("site_title", siteDefaults.siteTitle);
  },
  get contactURL() {
    return settings.getString("contact_url", siteDefaults.contactURL);
  },
  get footerDomain() {
    return settings.getString("footer_domain", siteDefaults.footerDomain);
  },

  get heroBadge() {
    return settings.getString("hero_badge", "Digital goods & resources");
  },
  get heroHeading() {
    return settings.getString("hero_heading", "The");
  },
  get heroHighlight() {
    return settings.getString("hero_highlight", "Shop");
  },
  get heroSubtitle() {
    return settings.getString(
      "hero_subtitle",
      "A collection of digital goods designed to help you build better, faster.",
    );
  },
  get headerNavLabel() {
    return settings.getString("header_nav_label", "Shop");
  },
  get footerRights() {
    return settings.getString("footer_rights", "All rights reserved.");
  },
  get categoryFilterEnabled() {
    return settings.getRaw("category_filter_enabled") === "1";
  },
  get galleryThumbnailsEnabled() {
    return settings.getRaw("gallery_thumbnails") === "1";
  },
  get maintenanceEnabled() {
    return settings.getRaw("maintenance_mode") === "1";
  },
  get maintenanceEyebrow() {
    return settings.getString("maintenance_eyebrow", "") || this.siteTitle;
  },
  get maintenanceHeading() {
    return settings.getString("maintenance_heading", "We'll be right back");
  },
  get maintenanceMessage() {
    return settings.getString(
      "maintenance_message",
      "The store is temporarily closed for maintenance. Please check back soon.",
    );
  },
  get defaultServiceMessage() {
    return settings.getString(
      "default_service_message",
      "This product has no downloadable file. We'll be in touch shortly.",
    );
  },

  get contactEyebrow() {
    return settings.getString(
      "contact_eyebrow",
      "We'd love to hear from you",
    );
  },
  get contactHeading() {
    return settings.getString("contact_heading", "Get in");
  },
  get contactHighlight() {
    return settings.getString("contact_highlight", "touch");
  },
  get contactSubtitle() {
    return settings.getString(
      "contact_subtitle",
      "Have a question or need a hand? Send us a message and we'll get back to you as soon as we can.",
    );
  },
  get defaultThumbnail() {
    return (
      settings.getString("default_thumbnail", "") || "/images/placeholder.svg"
    );
  },
};

/**
 * The application's single configuation
 */
const config = {
  port: process.env.PORT || 3000,
  isProduction: process.env.PAYPAL_API_MODE === "live",
  sessionSecret: process.env.SESSION_SECRET,

  get itemsPerPage() {
    return settings.getInt("items_per_page", itemsPerPageDefault);
  },

  get adminItemsPerPage() {
    return settings.getInt("admin_items_per_page", adminItemsPerPageDefault);
  },

  get transactionsPerPage() {
    return settings.getInt("transactions_per_page", transactionsPerPageDefault);
  },

  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    apiBase:
      process.env.PAYPAL_API_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com",
  },

  site,

  email: {
    get useSendmail() {
      const value = settings.getRaw("email_use_sendmail");
      return value === undefined ? emailUseSendmailDefault : value === "1";
    },
    get sendmailPath() {
      return settings.getString("email_sendmail_path", sendmailPathDefault);
    },
    get subject() {
      return settings.getString("email_subject", emailSubjectDefault);
    },
    get fromName() {
      return settings.getString("email_from_name", fromDefault.name);
    },
    get fromEmail() {
      return settings.getString("email_from_email", fromDefault.email);
    },
    get from() {
      return composeFrom(this.fromName, this.fromEmail);
    },
    get host() {
      return settings.getString("email_host", emailHostDefault);
    },
    get port() {
      return settings.getInt("email_port", emailPortDefault);
    },
    get user() {
      return settings.getString("email_user", emailUserDefault);
    },
    get pass() {
      return settings.getString("email_pass", emailPassDefault);
    },
  },

  seo: {
    get baseUrl() {
      return settings.getString("seo_base_url", "").trim().replace(/\/+$/, "");
    },
    get defaultDescription() {
      return settings.getString("seo_default_description", "");
    },
    get ogImage() {
      return settings.getString("seo_og_image", "");
    },
    get twitterHandle() {
      const raw = settings.getString("seo_twitter_handle", "").trim();
      if (!raw) return "";
      return raw.startsWith("@") ? raw : `@${raw}`;
    },
    get discourage() {
      return settings.getRaw("seo_discourage") === "1";
    },
  },
};

module.exports = config;
