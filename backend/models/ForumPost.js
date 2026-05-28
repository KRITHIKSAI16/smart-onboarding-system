const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cohort",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ["introduction", "question", "share", "general"],
      default: "general",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

forumPostSchema.index({ companyId: 1, createdAt: -1 });
forumPostSchema.index({ companyId: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model("ForumPost", forumPostSchema);
