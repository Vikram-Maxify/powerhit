const jwt = require("jsonwebtoken");
const User = require("../models/authmodel");

// ================= USER / ADMIN AUTH =================

const protect = async (req, res, next) => {
  try {
    let token;

    // ================= COOKIE =================
    if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // ================= AUTH HEADER =================
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // ================= VERIFY =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

// ================= ADMIN ONLY =================

const adminProtect = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};

// ================= USER ONLY =================

const userProtect = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "User access only",
    });
  }

  next();
};

module.exports = {
  protect,
  adminProtect,
  userProtect,
};