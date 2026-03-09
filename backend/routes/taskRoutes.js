const express = require("express");
const router = express.Router();

const {
 createTask,
 getUserTasks,
 markTaskCompleted,
 deleteTask,
 getTaskAnalytics
} = require("../controllers/taskController");

const { sendTaskReminders } = require("../controllers/taskController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createTask);

router.get("/", protect, getUserTasks);

router.put("/:taskId/complete", protect, markTaskCompleted);

router.delete("/:taskId", protect, authorize("admin"), deleteTask);

router.get("/admin/task-analytics",
  protect,
  authorize("admin"),
  getTaskAnalytics
);

router.post(
  "/admin/send-reminders",
  protect,
  authorize("admin"),
  sendTaskReminders
);

module.exports = router;