const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map();

function setupSocket(io) {
  // ── Auth middleware ──────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const cleanToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("name email role companyId");
      if (!user) return next(new Error("User not found"));

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId?.toString(),
      };
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  // ── Connection handler ──────────────────────────────────────────────
  io.on("connection", (socket) => {
    const { id, name, role, companyId } = socket.user;
    console.log(`[Socket] ${name} (${role}) connected — ${socket.id}`);

    // Track online status
    if (!onlineUsers.has(id)) onlineUsers.set(id, new Set());
    onlineUsers.get(id).add(socket.id);

    // Join company room
    if (companyId) {
      socket.join(`company:${companyId}`);
    }

    // Broadcast online status to company
    if (companyId) {
      socket.to(`company:${companyId}`).emit("user-online", {
        userId: id,
        name,
        role,
      });
    }

    // Send current online users list to the newly connected user
    const companyOnline = [];
    for (const [uid, sockets] of onlineUsers.entries()) {
      if (sockets.size > 0) companyOnline.push(uid);
    }
    socket.emit("online-users", companyOnline);

    // ── Join conversation rooms ─────────────────────────────────────
    socket.on("join-conversations", async (conversationIds) => {
      if (!Array.isArray(conversationIds)) return;
      for (const cid of conversationIds) {
        socket.join(`conv:${cid}`);
      }
    });

    // ── Send message ────────────────────────────────────────────────
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, content } = data;
        if (!conversationId || !content?.trim()) return;

        // Verify conversation exists and user has access
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        if (conversation.companyId.toString() !== companyId) return;

        // For announcement: only admin can send
        if (conversation.type === "announcement" && role !== "admin") return;

        // For direct: must be a participant
        if (conversation.type === "direct") {
          const isParticipant = conversation.participants.some(
            (p) => p.toString() === id
          );
          if (!isParticipant) return;
        }

        // Save message
        const message = await Message.create({
          conversationId,
          sender: id,
          content: content.trim(),
        });

        // Update conversation's lastMessage
        conversation.lastMessage = {
          content: content.trim(),
          sender: id,
          timestamp: new Date(),
        };
        await conversation.save();

        // Populate sender info
        const populated = await Message.findById(message._id)
          .populate("sender", "name email role");

        const messageData = {
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
        };

        // Emit to conversation room
        io.to(`conv:${conversationId}`).emit("new-message", messageData);

        // For announcements, also emit to entire company room
        // (in case some interns haven't joined the conv room yet)
        if (conversation.type === "announcement") {
          socket.to(`company:${companyId}`).emit("new-announcement", messageData);
        }
      } catch (err) {
        console.error("[Socket] send-message error:", err.message);
      }
    });

    // ── Typing indicators ───────────────────────────────────────────
    socket.on("typing", (conversationId) => {
      socket.to(`conv:${conversationId}`).emit("user-typing", {
        conversationId,
        userId: id,
        name,
      });
    });

    socket.on("stop-typing", (conversationId) => {
      socket.to(`conv:${conversationId}`).emit("user-stop-typing", {
        conversationId,
        userId: id,
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[Socket] ${name} disconnected — ${socket.id}`);
      const userSockets = onlineUsers.get(id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(id);
          if (companyId) {
            socket.to(`company:${companyId}`).emit("user-offline", {
              userId: id,
              name,
            });
          }
        }
      }
    });
  });
}

module.exports = setupSocket;
