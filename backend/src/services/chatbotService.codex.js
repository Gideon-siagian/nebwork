const WorkLog = require("../models/WorkLog");

class ChatbotService {
  async searchWorkLogs(queryEmbedding, limit = 7, access = {}) {
    try {
      const results = await WorkLog.aggregate([
        {
          $vectorSearch: {
            index: "worklog_vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit,
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            tag: 1,
            datetime: 1,
            user: 1,
            department: 1,
            privacyLevel: 1,
            collaborators: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo",
            pipeline: [{ $project: { name: 1, division: 1 } }],
          },
        },
        {
          $unwind: {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { user: access.userId },
              { collaborators: access.userId },
              {
                $and: [
                  { privacyLevel: { $in: ["public", "team", null] } },
                  {
                    $or: [
                      { "userInfo.division": access.userDivision },
                      { department: access.userDivision },
                    ],
                  },
                ],
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: { $substr: ["$content", 0, 600] },
            tag: 1,
            datetime: 1,
            score: 1,
            userName: "$userInfo.name",
            userDivision: "$userInfo.division",
          },
        },
      ]);

      if (!results || results.length === 0) {
        return this.fallbackSearch(limit, access);
      }

      return results;
    } catch (error) {
      console.error("Vector search error:", error.message);
      return this.fallbackSearch(limit, access);
    }
  }

  async fallbackSearch(limit = 7, access = {}) {
    const results = await WorkLog.find({})
      .populate("user", "name division")
      .select("title content tag datetime user department privacyLevel collaborators")
      .sort({ datetime: -1 })
      .lean();

    return results
      .filter((log) => {
        const isOwner = String(log.user?._id || log.user) === String(access.userId);
        const isCollaborator = (log.collaborators || []).some((entry) => String(entry) === String(access.userId));
        if (isOwner || isCollaborator) {
          return true;
        }

        if (log.privacyLevel === "private") {
          return false;
        }

        return (log.user?.division || log.department) === access.userDivision;
      })
      .slice(0, limit)
      .map((log) => ({
        _id: log._id,
        title: log.title,
        content: log.content?.substring(0, 800),
        tag: log.tag,
        datetime: log.datetime,
        userName: log.user?.name,
        userDivision: log.user?.division || log.department,
      }));
  }

  buildContext(workLogs) {
    if (!workLogs || workLogs.length === 0) {
      return null;
    }

    return workLogs
      .map((log, index) => {
        const relevanceScore = log.score ? ` [${(log.score * 100).toFixed(0)}%]` : "";
        const date = log.datetime
          ? new Date(log.datetime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "Unknown date";
        const author = log.userName || "Unknown";
        const division = log.userDivision ? ` (${log.userDivision})` : "";
        const content = log.content || "No content";
        const isTruncated = log.content?.length > 800;
        const displayContent = isTruncated ? `${content}...` : content;

        return `Log #${index + 1}${relevanceScore}
Title: ${log.title}
Author: ${author}${division} | Date: ${date}
Tags: ${log.tag?.join(", ") || "None"}
Content: ${displayContent}`;
      })
      .join("\n\n---\n\n");
  }

  generateSystemPrompt(context) {
    return `You are a work log assistant. Answer based ONLY on the logs below.

Rules:
- Cite sources (e.g., "Per Sarah's Oct 15 log...")
- Mention all contributors if multiple people worked on it
- Be concise yet thorough
- If info isn't in logs, say "not found in available logs"

${context}

Answer the user's question using these logs.`;
  }

  logSearchResults() {}
}

module.exports = new ChatbotService();
