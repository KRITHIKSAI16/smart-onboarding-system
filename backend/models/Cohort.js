const mongoose = require("mongoose");

const cohortSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

cohortSchema.index({ companyId: 1 });

module.exports = mongoose.model("Cohort", cohortSchema);
