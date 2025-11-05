/**
 * This checks for a valid session flag (`isLoggedIn`). If the user is authenticated,
 * it allows the request to proceed
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    // The user has a valid, authenticated session. Allow them to proceed.
    return next();
  } else {
    // The user is not authenticated. Redirect them to the admin login page.
    return res.redirect("/admin/login");
  }
}

module.exports = requireAuth;
