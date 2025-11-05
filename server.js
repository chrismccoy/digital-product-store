/**
 * Digital Product Store.
 */

require("dotenv").config();

require("./db/database");

const fs = require("fs");
const path = require("path");

const dirsToEnsure = [
  path.join(__dirname, "public/uploads"),
  path.join(__dirname, "private_downloads"),
];

for (const dir of dirsToEnsure) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory ${dir}: ${err.message}`);
      process.exit(1);
    }
  }
}

const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const methodOverride = require("method-override");
const config = require("./config/config");

const shopRoutes = require("./routes/shop.routes");
const singleRoutes = require("./routes/single.routes");
const mode = require("./services/mode.service");

const SESSION_MAX_AGE_MS =
  parseInt(process.env.SESSION_MAX_AGE_MS, 10) || 1000 * 60 * 60 * 24; // 24 hours

console.log(
  `Application starting in ${mode.isShopMode() ? "SHOP" : "SINGLE PRODUCT"} mode (switchable at runtime).`,
);

const app = express();

if (config.isProduction) {
  app.set("trust proxy", 1);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(
  session({
    store: new FileStore({
      path: path.join(__dirname, "sessions"),
      logFn: function () {},
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: "auto",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
    },
  }),
);

app.use((req, res, next) => {
  res.locals.siteTitle = config.site.siteTitle;
  res.locals.homeURL = config.site.homeURL;
  res.locals.homeText = config.site.homeText;
  res.locals.contactURL = config.site.contactURL;
  res.locals.footerDomain = config.site.footerDomain;
  res.locals.headerNavLabel = config.site.headerNavLabel;
  res.locals.footerRights = config.site.footerRights;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  next();
});

const adminRoutes = require("./routes/admin.routes");

app.use("/admin", adminRoutes);

app.use(require("./routes/seo.routes"));

app.use(require("./middleware/maintenance"));

app.use("/contact", require("./routes/contact.routes"));

app.use("/", (req, res, next) => {
  return (mode.isShopMode() ? shopRoutes : singleRoutes)(req, res, next);
});

app.use((req, res) => {
  res.status(404).render("404", { siteTitle: config.site.siteTitle });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  if (mode.isShopMode()) {
    console.log(
      `Admin panel available at http://localhost:${config.port}/admin/login`,
    );
  }
});
