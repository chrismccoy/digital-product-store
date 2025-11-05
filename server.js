/**
 * The Digital Product Store application.
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const methodOverride = require("method-override");
const config = require("./config/config");
const { initializeDatabase } = require("./services/transaction.service");

// The application can run in one of two modes: 'shop' or 'single'.
let appRoutes;

if (config.isShopMode) {
  console.log("Application starting in SHOP mode.");
  appRoutes = require("./routes/shop.routes");
} else {
  console.log("Application starting in SINGLE PRODUCT mode.");
  appRoutes = require("./routes/single.routes");
}

const app = express();

// Before the server starts, we ensure that the transaction data directory and file exist.
initializeDatabase().catch((err) => {
  console.error("Fatal: Could not initialize the database. Exiting.", err);
  process.exit(1); // Exit if the database cannot be setup.
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the 'public' directory.
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(
  session({
    // Use session-file-store to make sessions persistent across server restarts.
    store: new FileStore({
      path: path.join(__dirname, "sessions"),
      logFn: function () {}, // Suppress noisy logging from the session store.
    }),
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours in milliseconds
    },
  }),
);

// Conditionally load and mount admin routes only in shop mode
if (config.isShopMode) {
  const adminRoutes = require("./routes/admin.routes");
  app.use("/admin", adminRoutes);
}

// Mount the main application routes (either shop or single) at the root path.
app.use("/", appRoutes);

// Server Startup
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  // Only log the admin panel URL if it's actually enabled
  if (config.isShopMode) {
    console.log(
      `Admin panel available at http://localhost:${config.port}/admin/login`,
    );
  }
});
