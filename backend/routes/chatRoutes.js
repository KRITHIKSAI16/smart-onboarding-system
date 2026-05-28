const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const enforceCompanyScope = require("../middleware/companyMiddleware");
const {
  getConversations,
  getMessages,
  getOrCreateDirect,
  sendMessage,
} = require("../controllers/chatController");

// All chat routes require auth + company scope
router.use(protect, enforceCompanyScope);

router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/direct/:userId", getOrCreateDirect);
router.post("/messages", sendMessage);

module.exports = router;
