const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// Ensure announcement conversation exists for a company
async function ensureAnnouncement(companyId) {
  let convo = await Conversation.findOne({ companyId, type: "announcement" });
  if (!convo) {
    convo = await Conversation.create({
      type: "announcement",
      companyId,
      participants: [],
    });
  }
  return convo;
}

// GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.companyId || req.user.companyId;
    const user = await User.findById(userId).select("role companyId");
    const effectiveCompanyId = companyId || user.companyId;

    // Auto-create announcement channel
    await ensureAnnouncement(effectiveCompanyId);

    let conversations;

    if (user.role === "admin") {
      // Admin sees: announcement + all direct chats they're in
      conversations = await Conversation.find({
        companyId: effectiveCompanyId,
        $or: [
          { type: "announcement" },
          { type: "direct", participants: userId },
        ],
      })
        .populate("participants", "name email role")
        .sort({ "lastMessage.timestamp": -1, updatedAt: -1 });
    } else {
      // Intern sees: announcement + their direct chat with admin
      conversations = await Conversation.find({
        companyId: effectiveCompanyId,
        $or: [
          { type: "announcement" },
          { type: "direct", participants: userId },
        ],
      })
        .populate("participants", "name email role")
        .sort({ "lastMessage.timestamp": -1, updatedAt: -1 });
    }

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations", error: err.message });
  }
};

// GET /api/chat/conversations/:id/messages
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    // Verify company scope
    const user = await User.findById(userId).select("companyId");
    const userCompany = req.companyId || user.companyId;
    if (convo.companyId.toString() !== userCompany.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For direct conversations, verify participation
    if (convo.type === "direct") {
      const isParticipant = convo.participants.some((p) => p.toString() === userId);
      if (!isParticipant) return res.status(403).json({ message: "Access denied" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId: req.params.id })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversationId: req.params.id });

    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
};

// POST /api/chat/conversations/direct/:userId — get or create direct chat
exports.getOrCreateDirect = async (req, res) => {
  try {
    const adminId = req.user.id;
    const internId = req.params.userId;
    const admin = await User.findById(adminId).select("role companyId");

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Only admins can initiate direct chats" });
    }

    const intern = await User.findById(internId).select("companyId role name");
    if (!intern) return res.status(404).json({ message: "User not found" });

    const effectiveCompanyId = req.companyId || admin.companyId;
    if (intern.companyId.toString() !== effectiveCompanyId.toString()) {
      return res.status(403).json({ message: "User not in your company" });
    }

    // Check if direct conversation already exists
    let convo = await Conversation.findOne({
      type: "direct",
      companyId: effectiveCompanyId,
      participants: { $all: [adminId, internId] },
    }).populate("participants", "name email role");

    if (!convo) {
      convo = await Conversation.create({
        type: "direct",
        companyId: effectiveCompanyId,
        participants: [adminId, internId],
      });
      convo = await Conversation.findById(convo._id).populate("participants", "name email role");
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: "Failed to get/create conversation", error: err.message });
  }
};

// POST /api/chat/messages — send a message (REST fallback, also used for initial sends)
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || !content?.trim()) {
      return res.status(400).json({ message: "conversationId and content required" });
    }

    const userId = req.user.id;
    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    const user = await User.findById(userId).select("companyId role");
    const userCompany = req.companyId || user.companyId;

    if (convo.companyId.toString() !== userCompany.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Announcement: only admin
    if (convo.type === "announcement" && user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can send announcements" });
    }

    // Direct: must be participant
    if (convo.type === "direct") {
      if (!convo.participants.some((p) => p.toString() === userId)) {
        return res.status(403).json({ message: "Not a participant" });
      }
    }

    const message = await Message.create({
      conversationId,
      sender: userId,
      content: content.trim(),
    });

    convo.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: new Date(),
    };
    await convo.save();

    const populated = await Message.findById(message._id)
      .populate("sender", "name email role");

    // Emit via socket if available
    const io = req.app.get("io");
    if (io) {
      io.to(`conv:${conversationId}`).emit("new-message", {
        _id: populated._id,
        conversationId,
        sender: {
          _id: populated.sender._id,
          name: populated.sender.name,
          email: populated.sender.email,
          role: populated.sender.role,
        },
        content: populated.content,
        createdAt: populated.createdAt,
      });

      if (convo.type === "announcement") {
        io.to(`company:${userCompany}`).emit("new-announcement", {
          _id: populated._id,
          conversationId,
          content: populated.content,
          createdAt: populated.createdAt,
        });
      }
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
};
