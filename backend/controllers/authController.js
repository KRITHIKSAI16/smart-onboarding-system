const User = require("../models/User");
const Company = require("../models/Company");
const Task = require("../models/Task");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const defaultTasks = [
  { title: "Submit ID Proof",               description: "Upload Aadhaar or Passport",         requiresProof: true  },
  { title: "Complete Orientation",           description: "Watch company onboarding video",      requiresProof: false },
  { title: "Setup Development Environment",  description: "Install required tools and software", requiresProof: false },
];

async function hashPw(pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

// ── REGISTER USER (public self-registration) ─────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password: await hashPw(password),
      role,
      companyId: req.body.companyId || undefined,
    });

    // Auto-assign default tasks for interns who belong to a company
    if (role === "intern" && user.companyId) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      const tasks = defaultTasks.map((t) => ({
        title:          t.title,
        description:    t.description,
        taskType:       "admin",
        requiresProof:  t.requiresProof,
        companyId:      user.companyId,
        assignments:    [{ user: user._id, status: "pending" }],
        totalAssigned:  1,
        completedCount: 0,
        deadline,
        createdBy:      user._id,
      }));
      await Task.insertMany(tasks);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── LOGIN USER ───────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("companyId");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Build company info if present
    const company = user.companyId
      ? {
          id:           user.companyId._id,
          name:         user.companyId.name,
          logo:         user.companyId.logo || null,
          primaryColor: user.companyId.primaryColor || "#6366f1",
        }
      : null;

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id:                 user._id,
        name:               user.name,
        email:              user.email,
        role:               user.role,
        mustChangePassword: user.mustChangePassword || false,
        company,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── CREATE ADMIN (super_admin only) ──────────────────────────────────────────
const createAdmin = async (req, res) => {
  try {
    const { name, companyId } = req.body;
    if (!name || !companyId) {
      return res.status(400).json({ message: "name and companyId are required" });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const domain = company.domain || `${company.name.toLowerCase().replace(/\s+/g, "")}.onboard`;
    const email    = `admin@${domain}`;
    const tempPass = "Temp@123";

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: `Admin email ${email} already exists` });
    }

    const admin = await User.create({
      name,
      email,
      password:           await hashPw(tempPass),
      role:               "admin",
      companyId,
      mustChangePassword: true,
    });

    res.status(201).json({
      message: "Admin created successfully",
      credentials: {
        name:  admin.name,
        email: admin.email,
        password: tempPass,
        company: company.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── CREATE INTERN (admin only) ───────────────────────────────────────────────
const createIntern = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const adminUser = await User.findById(req.user.id).populate("companyId");
    if (!adminUser?.companyId) {
      return res.status(400).json({ message: "Admin must belong to a company" });
    }

    const company  = adminUser.companyId;
    const domain   = company.domain || `${company.name.toLowerCase().replace(/\s+/g, "")}.onboard`;
    const firstName = name.trim().split(" ")[0].toLowerCase();
    const tempPass  = "Temp@123";

    // Ensure unique email
    let email = `${firstName}@${domain}`;
    let count = 1;
    while (await User.findOne({ email })) {
      email = `${firstName}${count}@${domain}`;
      count++;
    }

    const intern = await User.create({
      name,
      email,
      password:           await hashPw(tempPass),
      role:               "intern",
      companyId:          company._id,
      mustChangePassword: true,
    });

    // Assign default onboarding tasks
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const tasks = defaultTasks.map((t) => ({
      title:          t.title,
      description:    t.description,
      taskType:       "admin",
      requiresProof:  t.requiresProof,
      companyId:      company._id,
      createdBy:      req.user.id,
      deadline,
      assignments:    [{ user: intern._id, status: "pending" }],
      totalAssigned:  1,
      completedCount: 0,
    }));
    await Task.insertMany(tasks);

    res.status(201).json({
      message: "Intern created successfully",
      credentials: {
        name:     intern.name,
        email:    intern.email,
        password: tempPass,
        company:  company.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── CHANGE PASSWORD (authenticated) ─────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password           = await hashPw(newPassword);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── GET INTERNS (admin — alias) ───────────────────────────────────────────────
const getInterns = async (req, res) => {
  try {
    const query = {};
    if (req.companyId) query.companyId = req.companyId;
    const interns = await User.find({ ...query, role: "intern" }, "_id name email");
    res.json(interns);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── PLATFORM STATS (super_admin) ─────────────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const [companies, admins, interns] = await Promise.all([
      User.countDocuments({ role: { $ne: "super_admin" }, companyId: { $exists: true } }).then(() =>
        require("../models/Company").countDocuments()
      ),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "intern" }),
    ]);

    const Company = require("../models/Company");
    res.json({
      companies: await Company.countDocuments(),
      admins,
      interns,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  createAdmin,
  createIntern,
  changePassword,
  getInterns,
  getPlatformStats,
};