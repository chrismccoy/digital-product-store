/**
 * Settings layer.
 */

const db = require("../db/database");

const stmtGetAll = db.prepare("SELECT key, value FROM settings");
const stmtUpsert = db.prepare(`
  INSERT INTO settings (key, value) VALUES (@key, @value)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

const cache = new Map();

function loadCache() {
  cache.clear();
  for (const { key, value } of stmtGetAll.all()) {
    cache.set(key, value);
  }
}

loadCache();

function getRaw(key) {
  return cache.has(key) ? cache.get(key) : undefined;
}

function getString(key, fallback = "") {
  const value = getRaw(key);
  return value === undefined ? fallback : value;
}

function getInt(key, fallback) {
  const value = getRaw(key);
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const setMany = db.transaction((entries) => {
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) continue;
    stmtUpsert.run({ key, value: String(value) });
  }
  loadCache();
});

module.exports = {
  getRaw,
  getString,
  getInt,
  setMany,
};
