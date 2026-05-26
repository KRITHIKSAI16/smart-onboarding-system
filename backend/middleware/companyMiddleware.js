const User = require("../models/User");

const enforceCompanyScope = async (req, res, next) => {
  // Super admin bypasses company scope
  if (req.user.role === "super_admin") {
    return next();
  }

  try {
    // JWT only stores {id, role} — fetch companyId from DB
    const user = await User.findById(req.user.id).select("companyId");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.companyId = user.companyId;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error in company scope", error: err.message });
  }
};

module.exports = enforceCompanyScope;