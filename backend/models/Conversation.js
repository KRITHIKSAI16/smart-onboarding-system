const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["announcement", "direct"],
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: Date,
    },
  },
  { timestamps: true }
);

// One announcement per company
conversationSchema.index({ companyId: 1, type: 1 });
// Fast lookup for direct conversations
conversationSchema.index({ participants: 1, type: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
