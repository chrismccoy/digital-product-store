/**
 * Centralizes the file system
 */

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const GALLERIES_DIR = path.join(PUBLIC_DIR, "galleries");

function deletePublicUpload(webPath) {
  if (!webPath) return;
  if (!webPath.startsWith("/uploads/") && !webPath.startsWith("/galleries/")) {
    return;
  }
  const filePath = path.join(PUBLIC_DIR, webPath);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Failed to delete upload:", err);
  });
}

function galleryDirFor(productId) {
  const safeId = path.basename(String(productId));
  if (!safeId || safeId === "." || safeId === "..") {
    throw new Error(`Unsafe product id for gallery path: ${productId}`);
  }
  return path.join(GALLERIES_DIR, safeId);
}

function moveGalleryFiles(productId, files) {
  const dir = galleryDirFor(productId);
  fs.mkdirSync(dir, { recursive: true });
  const safeId = path.basename(String(productId));
  return files.map((file) => {
    const dest = path.join(dir, file.filename);
    fs.renameSync(file.path, dest);
    return `/galleries/${safeId}/${file.filename}`;
  });
}

function deleteGalleryDir(productId) {
  let dir;
  try {
    dir = galleryDirFor(productId);
  } catch (err) {
    console.error(err.message);
    return;
  }
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (err) console.error("Failed to delete gallery directory:", err);
  });
}

module.exports = {
  deletePublicUpload,
  moveGalleryFiles,
  deleteGalleryDir,
};
