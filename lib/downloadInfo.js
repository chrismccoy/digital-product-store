/**
 * Resolves whether a product has a downloadable file and the message to show when it does not
 */
function downloadInfo(product, defaultServiceMessage = "") {
  const hasFile = Boolean(product && product.filename);
  const serviceMessage =
    (product && product.service_message) || defaultServiceMessage;
  return { hasFile, serviceMessage };
}

module.exports = downloadInfo;
