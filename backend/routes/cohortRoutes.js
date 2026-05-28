const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const enforceCompanyScope = require("../middleware/companyMiddleware");
const {
  getCohorts,
  createCohort,
  deleteCohort,
  getMyMembers,
} = require("../controllers/cohortController");

// Intern route — must come before admin-only middleware
router.get("/my-members", protect, enforceCompanyScope, getMyMembers);

// Admin-only cohort management
router.get("/", protect, authorize("admin"), enforceCompanyScope, getCohorts);
router.post("/", protect, authorize("admin"), enforceCompanyScope, createCohort);
router.delete("/:id", protect, authorize("admin"), enforceCompanyScope, deleteCohort);

module.exports = router;
