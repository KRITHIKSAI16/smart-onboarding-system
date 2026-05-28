const mongoose = require("mongoose");

const forumCommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

forumCommentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model("ForumComment", forumCommentSchema);
