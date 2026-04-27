const Chat = require("../models/Chat");
const { generateEmbedding } = require("../services/embeddingService");
const chatbotService = require("../services/chatbotService");
const aiService = require("../services/aiService");
const cacheService = require("../services/cacheService");
const { v4: uuidv4 } = require("uuid");

exports.postMessageChatbot = async (req, res) => {
  try {
    const { message, session_id, sessionId, history } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Valid message is required" });
    }

    const actualSessionId = session_id || sessionId || uuidv4();
    const startTime = Date.now();

    const embeddingStart = Date.now();
    const queryEmbedding = await cacheService.getEmbedding(message, generateEmbedding);
    const embeddingTime = Date.now() - embeddingStart;

    let relevantLogs = [];
    const searchStart = Date.now();

    if (queryEmbedding) {
      relevantLogs = await cacheService.getSearchResults(
        queryEmbedding,
        () => chatbotService.searchWorkLogs(queryEmbedding, 3, {
          userId: req.user._id,
          userDivision: req.user.division,
        })
      );
    } else {
      relevantLogs = await chatbotService.fallbackSearch(3, {
        userId: req.user._id,
        userDivision: req.user.division,
      });
    }

    const searchTime = Date.now() - searchStart;
    chatbotService.logSearchResults(relevantLogs);

    const context = chatbotService.buildContext(relevantLogs);
    if (!context) {
      return exports.handleNoContext(req.user._id, actualSessionId, message, res);
    }

    const systemPrompt = chatbotService.generateSystemPrompt(context);
    const aiStart = Date.now();
    const conversationHistory = Array.isArray(history) ? history.slice(-6) : [];
    const aiAnswer = await aiService.generateResponse(systemPrompt, message, conversationHistory);
    const aiTime = Date.now() - aiStart;

    const totalTime = Date.now() - startTime;
    const embeddingPercent = Math.round((embeddingTime / totalTime) * 100);
    const searchPercent = Math.round((searchTime / totalTime) * 100);
    const aiPercent = Math.round((aiTime / totalTime) * 100);

    const sources = relevantLogs.map((log) => ({
      id: log._id,
      title: log.title,
      author: log.userName,
      date: log.datetime,
    }));

    res.status(201).json({
      session_id: actualSessionId,
      sessionId: actualSessionId,
      message,
      answer: aiAnswer,
      response: aiAnswer,
      context_logs_count: relevantLogs.length,
      sources,
      timestamp: new Date(),
      processing_time: `${totalTime}ms`,
      performance: {
        status: totalTime < 6000 ? "fast" : "normal",
        message: totalTime < 6000
          ? "Response generated quickly"
          : "Response generated with a larger context window",
      },
      breakdown: {
        embedding: `${embeddingTime}ms (${embeddingPercent}%)`,
        search: `${searchTime}ms (${searchPercent}%)`,
        ai: `${aiTime}ms (${aiPercent}%)`,
        total: `${totalTime}ms`,
      },
    });

    Chat.create({
      user: req.user._id,
      session_id: actualSessionId,
      message,
      response: aiAnswer,
      context_used: relevantLogs.length,
      sources,
    }).catch(() => {});
  } catch (error) {
    return res.status(500).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
};

exports.getMessagesChatbot = async (req, res) => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const messages = await Chat.find({
      user: req.user._id,
      session_id,
    }).sort({ createdAt: 1 });

    if (messages.length === 0) {
      return res.status(404).json({ error: "No chat history" });
    }

    res.json({
      session_id,
      sessionId: session_id,
      messages,
      count: messages.length,
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
};

exports.handleNoContext = async (userId, sessionId, message, res) => {
  const noContextResponse = "I don't have any work logs to answer your question yet.";

  const requestChat = await Chat.create({
    user: userId,
    session_id: sessionId,
    message,
    response: noContextResponse,
    context_used: 0,
  });

  return res.status(201).json({
    session_id: requestChat.session_id,
    sessionId: requestChat.session_id,
    message: requestChat.message,
    answer: requestChat.response,
    response: requestChat.response,
    context_logs_count: 0,
    sources: [],
    timestamp: requestChat.createdAt,
  });
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const totalSessions = await Chat.distinct("session_id", { user: userId });
    const totalCount = totalSessions.length;
    const totalPages = Math.ceil(totalCount / limit);

    const sessions = await Chat.aggregate([
      { $match: { user: userId } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$session_id",
          first_message: { $first: "$message" },
          last_response: { $last: "$response" },
          first_created: { $first: "$createdAt" },
          last_updated: { $last: "$createdAt" },
          message_count: { $sum: 1 },
        },
      },
      { $sort: { last_updated: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const history = sessions.map((session) => ({
      session_id: session._id,
      sessionId: session._id,
      title: (session.first_message || "New Chat").substring(0, 50) + ((session.first_message || "").length > 50 ? "..." : ""),
      last_message: (session.last_response || "").substring(0, 100) + ((session.last_response || "").length > 100 ? "..." : ""),
      message_count: session.message_count,
      created_at: session.first_created,
      updated_at: session.last_updated,
    }));

    res.json({
      chats: history,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_sessions: totalCount,
        sessions_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      error: "Failed to fetch chat history",
      details: error.message,
    });
  }
};

exports.deleteChatSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user._id;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const result = await Chat.deleteMany({
      user: userId,
      session_id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: "Chat session not found or already deleted",
      });
    }

    res.json({
      message: "Chat session deleted successfully",
      session_id,
      sessionId: session_id,
      deleted_count: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return res.status(500).json({
      error: "Failed to delete chat session",
      details: error.message,
    });
  }
};
