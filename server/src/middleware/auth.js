const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Please sign in to continue." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("name email role");
    if (!user) return res.status(401).json({ message: "Your session is no longer valid. Please sign in again." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You don't have permission to perform this action." });
    next();
  };
}

module.exports = { requireAuth, requireRole };
