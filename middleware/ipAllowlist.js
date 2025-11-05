/**
 * Restricts access to the admin area by client IP address.
 */

const LOCALHOST = new Set(["127.0.0.1", "::1"]);

function normalizeIp(ip) {
  if (!ip) return "";
  return String(ip).trim().replace(/^::ffff:/i, "");
}

function parseAllowlist() {
  return (process.env.ADMIN_IP_ALLOWLIST || "")
    .split(",")
    .map((entry) => normalizeIp(entry))
    .filter(Boolean);
}

function adminIpAllowlist(req, res, next) {
  const allow = parseAllowlist();

  if (allow.length === 0) return next();

  const ip = normalizeIp(req.ip);
  if (LOCALHOST.has(ip) || allow.includes(ip)) return next();

  console.warn(`Blocked admin access from ${req.ip}`);
  return res.status(403).send("Forbidden");
}

module.exports = adminIpAllowlist;
