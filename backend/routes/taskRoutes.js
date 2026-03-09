const express = require("express");
const router = express.Router();

const {
 createTask,
 getUserTasks,
 markTaskCompleted,
 deleteTask
} = require("../controllers/taskController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createTask);

router.get("/", protect, getUserTasks);

router.put("/:taskId/complete", protect, markTaskCompleted);

router.delete("/:taskId", protect, authorize("admin"), deleteTask);

module.exports = router;