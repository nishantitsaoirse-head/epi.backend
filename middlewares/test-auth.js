// This is a test middleware - DO NOT USE IN PRODUCTION
function requireUser(req, res, next) {
  // For testing: Set a mock user ID
  req.userId = "test-user-123";  // You can use any string as test user ID
  next();
}

module.exports = { requireUser };