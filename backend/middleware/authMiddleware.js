const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      next();

    } else {

      return res.status(401).json({
        message: "Not authorized, no token"
      });

    }

  } catch (error) {

    return res.status(401).json({
      message: "Not authorized, token failed"
    });

  }
};

const authorize = (...roles) => {
  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions"
      });
    }

    next();
  };
};

module.exports = { protect ,authorize };