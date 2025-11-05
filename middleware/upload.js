/**
 * Multer upload middleware for handling multipart/form-data file uploads.
 */

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === "image" || file.fieldname === "gallery") {
      cb(null, path.join(__dirname, "../public/uploads"));
    } else if (file.fieldname === "productfile") {
      cb(null, path.join(__dirname, "../private_downloads"));
    }
  },
  filename: (_req, file, cb) => {
    if (file.fieldname === "image") {
      const ext = path.extname(file.originalname);
      cb(null, `product-${Date.now()}${ext}`);
    } else if (file.fieldname === "gallery") {
      const ext = path.extname(file.originalname);
      cb(null, `gallery-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    } else {
      cb(null, path.basename(file.originalname));
    }
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === "image" || file.fieldname === "gallery") {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed for images and gallery screenshots."));
  } else {
    cb(null, true);
  }
};

const MAX_UPLOAD_BYTES =
  parseInt(process.env.UPLOAD_MAX_BYTES, 10) || 500 * 1024 * 1024; // 500 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter,
});

module.exports = upload;
