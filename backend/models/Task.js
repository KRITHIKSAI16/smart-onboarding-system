const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  assignedTo: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
],

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  },

  taskType: {
    type: String,
    enum: ["admin", "personal"],
    default: "admin"
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