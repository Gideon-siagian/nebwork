const express = require("express");

const {
  postMessageChatbot,
  getMessagesChatbot,
  getChatHistory,
  deleteChatSession,
} = require("../controllers/chatbotController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/history", protect, getChatHistory);
router.get("/sessions/:session_id", protect, getMessagesChatbot);
router.delete("/sessions/:session_id", protect, deleteChatSession);
router.post("/chat", protect, postMessageChatbot);

module.exports = router;
