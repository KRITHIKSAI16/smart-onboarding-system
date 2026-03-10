const express = require("express");
const router = express.Router();

const {
  createTask,
  getUserTasks,
  markTaskCompleted,
  deleteTask,
  getTaskAnalytics,
  getUserProgress,
  sendTaskReminders,
  submitProof,
  approveTask,
  rejectTask,
  getPendingApprovals,
  getInternProgress,
  getOverdueTasks,
  getInterns
} = require("../controllers/taskController");

const { protect, authorize } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

router.post(
  "/:taskId/submit-proof",
  protect,
  upload.single("proof"),
  submitProof
);

// CREATE TASK
router.post("/", protect, createTask);


// INTERN PROGRESS
router.get("/progress", protect, getUserProgress);


// GET USER TASKS
router.get("/", protect, getUserTasks);


// COMPLETE SIMPLE TASK
router.put("/:taskId/complete", protect, markTaskCompleted);


// DELETE TASK (ADMIN)
router.delete("/:taskId", protect, authorize("admin"), deleteTask);

router.get("/interns", protect, authorize("admin"), getInterns);

// ADMIN ANALYTICS
router.get(
  "/admin/task-analytics",
  protect,
  authorize("admin"),
  getTaskAnalytics
);


// SEND REMINDER EMAILS
router.post(
  "/admin/send-reminders",
  protect,
  authorize("admin"),
  sendTaskReminders
);


// INTERN SUBMIT PROOF IMAGE
router.post(
  "/:taskId/submit-proof",
  protect,
  submitProof
);


// ADMIN APPROVE TASK
router.put(
  "/:taskId/approve/:userId",
  protect,
  authorize("admin"),
  approveTask
);


// ADMIN REJECT TASK
router.put(
  "/:taskId/reject/:userId",
  protect,
  authorize("admin"),
  rejectTask
);

router.get(
  "/admin/pending-approvals",
  protect,
  authorize("admin"),
  getPendingApprovals
);

router.get(
  "/admin/intern-progress",
  protect,
  authorize("admin"),
  getInternProgress
);

router.get(
  "/admin/overdue-tasks",
  protect,
  authorize("admin"),
  getOverdueTasks
);



module.exports = router;