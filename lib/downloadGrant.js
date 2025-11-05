/**
 * Single-use, time-boxed download authorization held in the session.
 */

const TTL_MS =
  parseInt(process.env.DOWNLOAD_GRANT_TTL_MS, 10) || 15 * 60 * 1000; // 15 minutes

function issue(session, productId) {
  session.authorizedProduct = {
    id: productId,
    expiresAt: Date.now() + TTL_MS,
  };
}

function consume(session) {
  const grant = session.authorizedProduct;
  delete session.authorizedProduct;

  if (!grant || !grant.id) return null;
  if (!grant.expiresAt || grant.expiresAt < Date.now()) return null;
  return grant.id;
}

module.exports = { issue, consume, TTL_MS };
