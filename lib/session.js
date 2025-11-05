/**
 * Promise wrapper around express-session
 */
function saveSession(session) {
  return new Promise((resolve, reject) => {
    session.save((err) => (err ? reject(err) : resolve()));
  });
}

module.exports = { saveSession };
