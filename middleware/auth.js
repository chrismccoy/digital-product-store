/**
 * This checks for a valid session flag (`isLoggedIn`). If the user is authenticated,
 * it allows the request to proceed
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  } else {
    return res.redirect("/admin/login");
  }
}

module.exports = requireAuth;
