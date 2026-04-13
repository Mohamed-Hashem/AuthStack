const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { TOKEN_COOKIE } = require("../lib/cookies");

const extractToken = (req) => {
  const header = req.header("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[TOKEN_COOKIE] || null;
};

const verifyToken = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { verifyToken };
