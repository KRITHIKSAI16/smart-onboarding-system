const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  status: {
    type: String,
    enum: ["pending", "submitted", "completed", "rejected"],
    default: "pending"
  },

  proofImage: {
    type: String
  },

  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  adminComment: {
    type: String,
    default: ""
  }

});

const taskSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
  },
  requiresProof: {
  type: Boolean,
  default: false
},

  description: {
    type: String
  },

  taskType: {
    type: String,
    enum: ["admin", "personal"],
    default: "admin"
  },

  assignments: [assignmentSchema],

  totalAssigned: {
    type: Number,
    default: 0
  },

  completedCount: {
    type: Number,
    default: 0
  },

  deadline: {
    type: Date
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{
  timestamps: true
}
);

module.exports = mongoose.model("Task", taskSchema);