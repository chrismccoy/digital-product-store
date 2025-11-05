/**
 * Admin credential layer.
 */

const crypto = require("crypto");
const settings = require("./settings.service");

const SCRYPT_KEYLEN = 64;

function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(plain), salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

function verifyPassword(plain, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length !== SCRYPT_KEYLEN) return false;

  const actual = crypto.scryptSync(String(plain), salt, SCRYPT_KEYLEN);
  return crypto.timingSafeEqual(actual, expected);
}

function safeEqualStr(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function getUsername() {
  return settings.getString("admin_username", process.env.ADMIN_USERNAME || "");
}

function hasStoredPassword() {
  return settings.getRaw("admin_password_hash") !== undefined;
}

function checkLogin(username, password) {
  const expectedUser = getUsername();
  const userOk = safeEqualStr(username || "", expectedUser);

  let passOk;
  const storedHash = settings.getRaw("admin_password_hash");
  if (storedHash !== undefined) {
    passOk = verifyPassword(password || "", storedHash);
  } else {
    passOk = safeEqualStr(password || "", process.env.ADMIN_PASSWORD || "");
  }

  return userOk && passOk;
}

function changeCredentials({ currentPassword, newUsername, newPassword }) {
  if (!checkLogin(getUsername(), currentPassword)) {
    return { success: false, message: "Current password is incorrect." };
  }

  const trimmedUser = (newUsername || "").trim();
  const wantsUser = trimmedUser.length > 0;
  const wantsPass = (newPassword || "").length > 0;

  if (!wantsUser && !wantsPass) {
    return { success: false, message: "Nothing to change." };
  }
  if (wantsPass && newPassword.length < 8) {
    return {
      success: false,
      message: "New password must be at least 8 characters.",
    };
  }

  const updates = {};
  if (wantsUser) updates.admin_username = trimmedUser;
  if (wantsPass) updates.admin_password_hash = hashPassword(newPassword);
  settings.setMany(updates);

  return { success: true };
}

module.exports = {
  hashPassword,
  verifyPassword,
  getUsername,
  hasStoredPassword,
  checkLogin,
  changeCredentials,
};
