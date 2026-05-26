const express = require("express");
const router  = express.Router();

const {
  registerUser,
  loginUser,
  createAdmin,
  createIntern,
  changePassword,
  getInterns,
  getPlatformStats,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");
const enforceCompanyScope    = require("../middleware/companyMiddleware");

// Public
router.post("/register", registerUser);
router.post("/login",    loginUser);

// Authenticated
router.put("/change-password", protect, changePassword);

// Super admin — create company admin
router.post("/create-admin",  protect, authorize("super_admin"), createAdmin);

// Admin — create intern for their company
router.post(
  "/create-intern",
  protect,
  authorize("admin"),
  enforceCompanyScope,
  createIntern
);

// Get interns scoped to company (admin)
router.get(
  "/interns",
  protect,
  authorize("admin"),
  enforceCompanyScope,
  getInterns
);

// Platform stats (super_admin)
router.get("/platform-stats", protect, authorize("super_admin"), getPlatformStats);

module.exports = router;