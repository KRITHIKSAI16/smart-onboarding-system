const Company = require("../models/Company");
const User    = require("../models/User");

// CREATE COMPANY (SUPER ADMIN)
const createCompany = async (req, res) => {
  try {
    const { name, domain, logo, primaryColor } = req.body;

    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }

    const company = await Company.create({
      name,
      domain,
      logo:         logo || null,
      primaryColor: primaryColor || "#6366f1",
      createdBy:    req.user.id,
    });

    res.status(201).json({ message: "Company created successfully", company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL COMPANIES (with admin + intern counts)
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    // Aggregate user counts per company
    const [adminCounts, internCounts] = await Promise.all([
      User.aggregate([
        { $match: { role: "admin", companyId: { $exists: true, $ne: null } } },
        { $group: { _id: "$companyId", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: "intern", companyId: { $exists: true, $ne: null } } },
        { $group: { _id: "$companyId", count: { $sum: 1 } } },
      ]),
    ]);

    const adminMap  = {};
    const internMap = {};
    adminCounts.forEach( (a) => { adminMap[a._id.toString()]  = a.count; });
    internCounts.forEach((i) => { internMap[i._id.toString()] = i.count; });

    const result = companies.map((c) => ({
      ...c.toObject(),
      adminCount:  adminMap[c._id.toString()]  || 0,
      internCount: internMap[c._id.toString()] || 0,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET SINGLE COMPANY
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE COMPANY
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    await company.deleteOne();
    res.json({ message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createCompany, getCompanies, getCompanyById, deleteCompany };