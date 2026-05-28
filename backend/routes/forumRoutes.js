const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const enforceCompanyScope = require("../middleware/companyMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getPosts,
  createPost,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
} = require("../controllers/forumController");

// All forum routes require auth + company scope
router.use(protect, enforceCompanyScope);

router.get("/posts", getPosts);
router.post("/posts", upload.single("image"), createPost);
router.delete("/posts/:id", deletePost);
router.put("/posts/:id/like", toggleLike);
router.get("/posts/:id/comments", getComments);
router.post("/posts/:id/comments", addComment);
router.delete("/comments/:id", deleteComment);

module.exports = router;
