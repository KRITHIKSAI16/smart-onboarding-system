const ForumPost = require("../models/ForumPost");
const ForumComment = require("../models/ForumComment");
const User = require("../models/User");

// Intern-only guard
const internOnly = (req, res) => {
  if (req.user.role !== "intern") {
    res.status(403).json({ message: "Forum is for interns only" });
    return false;
  }
  return true;
};

// GET /api/forum/posts
exports.getPosts = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const user = await User.findById(req.user.id).select("companyId cohortId");
    const companyId = req.companyId || user.companyId;

    const { category, page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const filter = { companyId };
    // Scope to intern's cohort if they have one
    if (user.cohortId) {
      filter.cohortId = user.cohortId;
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const posts = await ForumPost.find(filter)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ForumPost.countDocuments(filter);

    // Attach whether current user liked each post
    const postsWithLiked = posts.map((post) => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      isLiked: post.likes.some((uid) => uid.toString() === req.user.id),
      likes: undefined, // don't send full likes array to client
    }));

    res.json({ posts: postsWithLiked, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};

// POST /api/forum/posts
exports.createPost = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const { content, category } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const user = await User.findById(req.user.id).select("companyId cohortId name");
    const companyId = req.companyId || user.companyId;

    const post = await ForumPost.create({
      author: req.user.id,
      companyId,
      cohortId: user.cohortId || undefined,
      content: content.trim(),
      category: category || "general",
      image: req.file?.path || null,
    });

    const populated = await ForumPost.findById(post._id)
      .populate("author", "name email");

    const postData = {
      ...populated.toObject(),
      likeCount: 0,
      isLiked: false,
      likes: undefined,
    };

    // Emit to company room via socket
    const io = req.app.get("io");
    if (io) {
      io.to(`company:${companyId}`).emit("new-forum-post", postData);
    }

    res.status(201).json(postData);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
};

// DELETE /api/forum/posts/:id
exports.deletePost = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Delete all comments on the post
    await ForumComment.deleteMany({ postId: post._id });
    await ForumPost.findByIdAndDelete(post._id);

    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post", error: err.message });
  }
};

// PUT /api/forum/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const idx = post.likes.findIndex((uid) => uid.toString() === userId);

    if (idx > -1) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      likeCount: post.likes.length,
      isLiked: idx === -1, // toggled ON if it wasn't there before
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle like", error: err.message });
  }
};

// GET /api/forum/posts/:id/comments
exports.getComments = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const comments = await ForumComment.find({ postId: req.params.id })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch comments", error: err.message });
  }
};

// POST /api/forum/posts/:id/comments
exports.addComment = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await ForumComment.create({
      postId: req.params.id,
      author: req.user.id,
      content: content.trim(),
    });

    // Increment comment count
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    const populated = await ForumComment.findById(comment._id)
      .populate("author", "name email");

    // Emit via socket
    const io = req.app.get("io");
    if (io) {
      const user = await User.findById(req.user.id).select("companyId");
      const companyId = req.companyId || user.companyId;
      io.to(`company:${companyId}`).emit("new-forum-comment", {
        postId: req.params.id,
        comment: populated,
        commentCount: post.commentCount,
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};

// DELETE /api/forum/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    if (!internOnly(req, res)) return;

    const comment = await ForumComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    // Decrement comment count on parent post
    await ForumPost.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -1 },
    });

    await ForumComment.findByIdAndDelete(comment._id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment", error: err.message });
  }
};
