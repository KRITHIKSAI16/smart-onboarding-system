const { protect, authorize } = require("../middleware/authMiddleware");
const enforceCompanyScope    = require("../middleware/companyMiddleware");

const express = require("express");
const router  = express.Router();

const {
  createCompany,
  getCompanies,
  getCompanyById,
  deleteCompany,
} = require("../controllers/companyController");

// CREATE COMPANY (SUPER ADMIN ONLY)
router.post("/", protect, authorize("super_admin"), createCompany);

// GET ALL COMPANIES (SUPER ADMIN)
router.get("/",   protect, authorize("super_admin"), getCompanies);

// GET SINGLE COMPANY
router.get("/:id", protect, authorize("super_admin"), getCompanyById);

// DELETE COMPANY
router.delete("/:id", protect, authorize("super_admin"), deleteCompany);

module.exports = router;