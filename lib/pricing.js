/**
 * Price parsing, validation, and comparison.
 */

const PRICE_RE = /^\d+(\.\d{2})$/;

function isValidPriceFormat(price) {
  return PRICE_RE.test(String(price));
}

function validateAndFormatPrice(price) {
  const priceString = String(price);
  if (!PRICE_RE.test(priceString)) {
    throw new Error(
      `Invalid price format: "${price}". Please use the format "XX.XX" (e.g., "49.00").`,
    );
  }
  return priceString;
}

function toCents(value) {
  return Math.round(parseFloat(value) * 100);
}

function pricesMatch(a, b) {
  const centsA = toCents(a);
  const centsB = toCents(b);
  return Number.isFinite(centsA) && centsA === centsB;
}

module.exports = {
  PRICE_RE,
  isValidPriceFormat,
  validateAndFormatPrice,
  toCents,
  pricesMatch,
};
