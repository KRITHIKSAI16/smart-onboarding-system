const Cohort = require("../models/Cohort");
const User = require("../models/User");

// GET /api/cohorts — list cohorts for admin's company
exports.getCohorts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("companyId");
    const companyId = req.companyId || user.companyId;

    const cohorts = await Cohort.find({ companyId }).sort({ createdAt: -1 });

    // Attach intern count to each cohort
    const cohortIds = cohorts.map((c) => c._id);
    const counts = await User.aggregate([
      { $match: { cohortId: { $in: cohortIds }, role: "intern" } },
      { $group: { _id: "$cohortId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[c._id.toString()] = c.count; });

    const result = cohorts.map((c) => ({
      ...c.toObject(),
      internCount: countMap[c._id.toString()] || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cohorts", error: err.message });
  }
};

// POST /api/cohorts — create a new cohort
exports.createCohort = async (req, res) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Cohort name is required" });
    }

    const user = await User.findById(req.user.id).select("companyId");
    const companyId = req.companyId || user.companyId;

    // Check for duplicate name in the same company
    const existing = await Cohort.findOne({ name: name.trim(), companyId });
    if (existing) {
      return res.status(400).json({ message: "A cohort with this name already exists" });
    }

    const cohort = await Cohort.create({
      name: name.trim(),
      companyId,
      description: description?.trim() || "",
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    res.status(201).json({ ...cohort.toObject(), internCount: 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to create cohort", error: err.message });
  }
};

// DELETE /api/cohorts/:id — delete a cohort (unsets cohortId on users)
exports.deleteCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) return res.status(404).json({ message: "Cohort not found" });

    // Remove cohortId from all users in this cohort
    await User.updateMany({ cohortId: cohort._id }, { $unset: { cohortId: 1 } });
    await Cohort.findByIdAndDelete(cohort._id);

    res.json({ message: "Cohort deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete cohort", error: err.message });
  }
};

// GET /api/cohorts/my-members — get cohort mates (for interns)
exports.getMyMembers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("cohortId companyId").populate("cohortId", "name description");
    if (!user.cohortId) {
      return res.json({ cohort: null, members: [] });
    }

    const members = await User.find({
      cohortId: user.cohortId._id,
      role: "intern",
      _id: { $ne: user._id }, // exclude self
    }).select("name email");

    res.json({
      cohort: {
        id: user.cohortId._id,
        name: user.cohortId.name,
        description: user.cohortId.description,
      },
      members,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cohort members", error: err.message });
  }
};
