const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending"
  }
});


const taskSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
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