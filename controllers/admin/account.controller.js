/**
 * Admin authentication and account controller (login, logout, credentials).
 */

const adminAuth = require("../../services/adminAuth.service");
const { saveSession } = require("../../lib/session");

function renderLoginPage(req, res) {
  res.render("admin/login");
}

async function handleLogin(req, res) {
  const { username, password } = req.body;

  if (!adminAuth.checkLogin(username, password)) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid username or password" });
  }

  req.session.isLoggedIn = true;
  try {
    await saveSession(req.session);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Session error." });
  }
}

function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error("Failed to destroy session:", err);
    res.redirect("/admin/login");
  });
}

function updateAdminCredentials(req, res) {
  try {
    const { current_password, new_username, new_password, confirm_password } =
      req.body;

    if (new_password && new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    const result = adminAuth.changeCredentials({
      currentPassword: current_password || "",
      newUsername: new_username || "",
      newPassword: new_password || "",
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, username: adminAuth.getUsername() });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating credentials." });
  }
}

module.exports = {
  renderLoginPage,
  handleLogin,
  handleLogout,
  updateAdminCredentials,
};
