const Task = require("../models/Task");


// CREATE TASK
const createTask = async (req, res) => {
  try {

    const { title, description, assignedUsers, deadline, taskType } = req.body;

    const assignments = assignedUsers.map(userId => ({
      user: userId,
      status: "pending"
    }));

    const task = await Task.create({
      title,
      description,
      taskType,
      assignments,
      totalAssigned: assignments.length,
      deadline,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Task created successfully",
      task
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};



// GET TASKS FOR LOGGED IN USER
const getUserTasks = async (req, res) => {
  try {

    const userId = req.user.id;

    const tasks = await Task.find({
      "assignments.user": userId
    });

    res.json(tasks);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};



// MARK TASK COMPLETE
const markTaskCompleted = async (req, res) => {
  try {

    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);

    const assignment = task.assignments.find(
      a => a.user.toString() === userId
    );

    if (!assignment) {
      return res.status(404).json({
        message: "Task not assigned to this user"
      });
    }

    if (assignment.status === "completed") {
      return res.json({
        message: "Task already completed"
      });
    }

    assignment.status = "completed";

    task.completedCount += 1;

    await task.save();

    res.json({
      message: "Task marked as completed"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};



// DELETE TASK (ADMIN)
const deleteTask = async (req, res) => {
  try {

    const { taskId } = req.params;

    await Task.findByIdAndDelete(taskId);

    res.json({
      message: "Task deleted"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};

// ADMIN TASK ANALYTICS
const getTaskAnalytics = async (req, res) => {
  try {

    const tasks = await Task.find();

    const analytics = tasks.map(task => {

      const assigned = task.totalAssigned;
      const completed = task.completedCount;
      const pending = assigned - completed;

      const completionRate =
        assigned === 0
          ? 0
          : ((completed / assigned) * 100).toFixed(0);

      return {
        task: task.title,
        assigned,
        completed,
        pending,
        completionRate: completionRate + "%"
      };

    });

    res.json(analytics);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};

module.exports = {
  createTask,
  getUserTasks,
  markTaskCompleted,
  deleteTask,
  getTaskAnalytics
};