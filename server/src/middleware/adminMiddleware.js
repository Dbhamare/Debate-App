function adminMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.user.role) {
      return res.status(403).json({ message: "Role not defined for user" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    console.error("Error in adminMiddleware:", err);
    res.status(500).json({ message: "Server error in adminMiddleware" });
  }
}

module.exports = adminMiddleware;
