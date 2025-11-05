/**
 * Optional gallery thumbnail generation by sharp.
 */

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const THUMB_WIDTH = 640;

let sharp = null;

try {
  sharp = require("sharp");
} catch (err) {
  sharp = null;
}

function isSharpAvailable() {
  return sharp !== null;
}

function thumbWebPath(webPath) {
  const dir = path.posix.dirname(webPath);
  const base = path.posix.basename(webPath);
  return `${dir}/thumbs/${base}`;
}

async function generateThumb(webPath) {
  if (!sharp || !webPath) return null;
  const srcDisk = path.join(PUBLIC_DIR, webPath);
  if (!fs.existsSync(srcDisk)) return null;

  const outWeb = thumbWebPath(webPath);
  const outDisk = path.join(PUBLIC_DIR, outWeb);
  try {
    fs.mkdirSync(path.dirname(outDisk), { recursive: true });
    await sharp(srcDisk)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .toFile(outDisk);
    return outWeb;
  } catch (err) {
    console.error("Thumbnail generation failed for", webPath, err.message);
    return null;
  }
}

async function generateThumbs(webPaths) {
  return Promise.all(
    webPaths.map(async (webPath) => (await generateThumb(webPath)) || ""),
  );
}

module.exports = { isSharpAvailable, generateThumb, generateThumbs, thumbWebPath };
