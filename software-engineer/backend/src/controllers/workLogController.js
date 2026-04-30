const WorkLog = require("../models/WorkLog");
const LogHistory = require("../models/LogHistory");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Reaction = require("../models/Reaction");
const Notification = require("../models/Notification");
const { generateEmbedding, prepareTextForEmbedding } = require("../services/embeddingService");
const { processMediaUploads, extractMediaUrls, deleteFromSpaces } = require("../services/mediaService");
const aiService = require("../services/aiService");
const tagService = require("../services/tagService");
const { getAllowedDomains, isAllowedEmailDomain } = require("../utils/emailDomainValidator");

const ALLOWED_VISIBILITY = ["public", "team", "private"];
const ALLOWED_STATUS = ["draft", "published"];
const ALLOWED_COLLABORATOR_ROLES = ["editor", "commenter", "viewer"];

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const getWordCount = (value = "") => {
  const text = stripHtml(value);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
};

const normalizeTags = (value) => {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return raw
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter(Boolean);
};

const normalizeStatus = (status) => (
  ALLOWED_STATUS.includes(String(status || "").toLowerCase())
    ? String(status).toLowerCase()
    : "draft"
);

const normalizePrivacyLevel = (privacyLevel) => (
  ALLOWED_VISIBILITY.includes(String(privacyLevel || "").toLowerCase())
    ? String(privacyLevel).toLowerCase()
    : "team"
);

const normalizeCollaboratorRole = (role) => (
  ALLOWED_COLLABORATOR_ROLES.includes(String(role || "").toLowerCase())
    ? String(role).toLowerCase()
    : "editor"
);

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "worklog";

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureUniqueIds = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const getUsernameFromEmail = (email = "") => String(email).split("@")[0] || "";

const serializePendingInvite = (notification) => ({
  id: String(notification._id),
  name: notification.recipient?.name || getUsernameFromEmail(notification.recipient?.email || "Pending user"),
  email: notification.recipient?.email || "",
  username: getUsernameFromEmail(notification.recipient?.email || ""),
  division: notification.recipient?.division || "",
  role: normalizeCollaboratorRole(notification.invite?.role),
  status: notification.invite?.status || "pending",
  channel: notification.invite?.channel || "email",
  createdAt: notification.createdAt,
});

const getCollaboratorRole = (worklog, userId) => {
  const userKey = String(userId);
  const metaEntry = (worklog.collaboratorMeta || []).find((entry) => {
    const entryUserId = entry?.user?._id || entry?.user;
    return String(entryUserId) === userKey;
  });

  return metaEntry?.role || null;
};

const canEditWorklog = (worklog, userId) => {
  if (String(worklog.user) === String(userId) || String(worklog.user?._id) === String(userId)) {
    return true;
  }

  const collaboratorRole = getCollaboratorRole(worklog, userId);
  if (collaboratorRole) {
    return collaboratorRole === "editor";
  }

  return (worklog.collaborators || []).some((collaboratorId) => {
    const idStr = String(collaboratorId?._id || collaboratorId?.id || collaboratorId);
    return idStr === String(userId);
  });
};

const canViewWorklog = (worklog, user) => {
  if (!user) {
    return false;
  }

  if (String(worklog.user) === String(user._id) || String(worklog.user?._id) === String(user._id)) {
    return true;
  }

  if ((worklog.collaborators || []).some((collaboratorId) => {
    const idStr = String(collaboratorId?._id || collaboratorId?.id || collaboratorId);
    return idStr === String(user._id);
  })) {
    return true;
  }

  if (normalizePrivacyLevel(worklog.privacyLevel) === "public") {
    return true;
  }

  if (worklog.privacyLevel === "private") {
    return false;
  }

  const ownerDivision = worklog.user?.division || worklog.department;
  return Boolean(ownerDivision) && ownerDivision === user.division;
};

const buildAccessSummary = (worklog, user) => {
  const isOwner =
    String(worklog.user) === String(user?._id) || String(worklog.user?._id) === String(user?._id);
  const collaboratorRole = getCollaboratorRole(worklog, user?._id);
  const normalizedPrivacy = normalizePrivacyLevel(worklog.privacyLevel);
  const canView = canViewWorklog(worklog, user);
  const canEdit = isOwner || collaboratorRole === "editor";

  let role = "viewer";
  if (isOwner) {
    role = "owner";
  } else if (collaboratorRole) {
    role = collaboratorRole;
  } else if (normalizedPrivacy === "team" && worklog.user?.division === user?.division) {
    role = "viewer";
  } else if (normalizedPrivacy === "public") {
    role = "viewer";
  }

  return {
    role,
    canView,
    canEdit,
    canManageSettings: isOwner,
    canManageCollaborators: isOwner,
    canCreateMeeting: canEdit,
  };
};

const extractCollaboratorDetails = (worklog) => {
  const rolesByUserId = new Map(
    (worklog.collaboratorMeta || []).map((entry) => [
      String(entry?.user?._id || entry?.user),
      normalizeCollaboratorRole(entry?.role),
    ])
  );

  return (worklog.collaborators || []).map((collaborator) => {
    const collaboratorId = collaborator?._id || collaborator?.id || collaborator;
    const safeId = String(collaboratorId);
    return {
      id: safeId,
      name: collaborator?.name || "Unknown collaborator",
      email: collaborator?.email || "",
      division: collaborator?.division || "",
      profilePicture: collaborator?.profile_photo || "",
      role: rolesByUserId.get(safeId) || "editor",
    };
  });
};

const getMetricsMaps = async (worklogIds) => {
  if (!worklogIds.length) {
    return {
      commentsByWorklog: new Map(),
      reactionsByWorklog: new Map(),
    };
  }

  const [commentAgg, reactionAgg] = await Promise.all([
    Comment.aggregate([
      { $match: { worklog: { $in: worklogIds } } },
      { $group: { _id: "$worklog", count: { $sum: 1 } } },
    ]),
    Reaction.aggregate([
      { $match: { worklog: { $in: worklogIds } } },
      { $group: { _id: "$worklog", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    commentsByWorklog: new Map(commentAgg.map((item) => [String(item._id), item.count])),
    reactionsByWorklog: new Map(reactionAgg.map((item) => [String(item._id), item.count])),
  };
};

const serializeWorklog = (worklog, metrics) => {
  const worklogId = String(worklog._id);
  const author = typeof worklog.user === "object"
    ? {
        id: String(worklog.user?._id || worklog.user?.id || ""),
        name: worklog.user?.name || "Unknown author",
        email: worklog.user?.email || "",
        division: worklog.user?.division || worklog.department || "",
        profilePicture: worklog.user?.profile_photo || "",
        dateOfJoin: worklog.user?.join_date || null,
      }
    : null;

  return {
    ...worklog,
    id: worklogId,
    title: worklog.title || "Untitled worklog",
    content: worklog.content || "",
    project: worklog.project || "",
    department: worklog.department || author?.division || "",
    status: normalizeStatus(worklog.status),
    privacyLevel: normalizePrivacyLevel(worklog.privacyLevel),
    tag: normalizeTags(worklog.tag),
    author,
    collaboratorDetails: extractCollaboratorDetails(worklog),
    excerpt: stripHtml(worklog.content || "").slice(0, 220),
    metrics: {
      views: worklog.viewCount || 0,
      comments: metrics.commentsByWorklog.get(worklogId) || 0,
      likes: metrics.reactionsByWorklog.get(worklogId) || 0,
      wordCount: getWordCount(worklog.content || ""),
    },
  };
};

const loadWorklogDetails = async (worklogId) =>
  WorkLog.findById(worklogId)
    .populate("user", "name email division profile_photo join_date")
    .populate("collaborators", "name email division profile_photo")
    .populate("collaboratorMeta.user", "name email division profile_photo")
    .lean();

const getSerializedWorklogById = async (worklogId) => {
  const worklog = await loadWorklogDetails(worklogId);
  if (!worklog) {
    return null;
  }

  const metrics = await getMetricsMaps([worklog._id]);
  return serializeWorklog(worklog, metrics);
};

const getPendingInvitesForWorklog = async (worklogId) => {
  const notifications = await Notification.find({
    type: "worklog_invite",
    worklog: worklogId,
    "invite.status": "pending",
  })
    .populate("recipient", "name email division")
    .sort({ createdAt: -1 })
    .lean();

  return notifications.map(serializePendingInvite);
};

const resolveAccessibleFilter = async (req, scope = "division") => {
  const userId = req.user._id;

  if (scope === "mine") {
    return {
      $or: [
        { user: userId },
        { collaborators: userId },
      ],
    };
  }

  const divisionUsers = await User.find({ division: req.user.division }).select("_id").lean();
  const divisionUserIds = divisionUsers.map((user) => user._id);

  return {
    $or: [
      { user: userId },
      { collaborators: userId },
      { privacyLevel: "public" },
      {
        $and: [
          { user: { $in: divisionUserIds } },
          { privacyLevel: { $in: ["team", null] } },
        ],
      },
    ],
  };
};

const resolveCollaboratorTargets = async ({ email, username }) => {
  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isAllowedEmailDomain(normalizedEmail)) {
      return [];
    }

    const user = await User.findOne({ email: normalizedEmail }).lean();
    return user ? [user] : [];
  }

  if (username) {
    const normalized = String(username).replace(/^@/, "").trim();
    if (!normalized) {
      return [];
    }

    const candidateEmails = getAllowedDomains().map((domain) => `${normalized.toLowerCase()}@${domain}`);
    const user = await User.findOne({
      email: { $in: candidateEmails },
    }).lean();

    return user ? [user] : [];
  }

  return [];
};

// Helper function to track changed fields between versions
const trackChangedFields = (oldLog, updatePayload) => {
  const changedFields = [];
  
  // List of fields to track for changes
  const fieldsToTrack = ['title', 'content', 'tag', 'status', 'privacyLevel', 'project', 'department', 'summary'];
  
  fieldsToTrack.forEach(field => {
    const oldValue = oldLog[field];
    const newValue = updatePayload[field];
    
    // Compare values (handle arrays and strings)
    const oldStr = Array.isArray(oldValue) ? JSON.stringify(oldValue) : String(oldValue || '');
    const newStr = Array.isArray(newValue) ? JSON.stringify(newValue) : String(newValue || '');
    
    if (oldStr !== newStr) {
      changedFields.push({
        fieldName: field,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  });
  
  return changedFields;
};

exports.addWorkLog = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim() || "Untitled worklog";
    const rawContent = req.body.content || "";
    const tags = normalizeTags(req.body.tag || req.body.tags);
    const collaboratorIds = ensureUniqueIds(req.body.collaborators || []);
    const collaboratorMeta = collaboratorIds.map((collaboratorId) => ({
      user: collaboratorId,
      role: "editor",
    }));
    const status = normalizeStatus(req.body.status);
    const privacyLevel = normalizePrivacyLevel(req.body.privacyLevel);
    const project = String(req.body.project || "").trim();
    const department = String(req.body.department || req.user.division || "").trim();
    const summary = String(req.body.summary || "").trim();

    const { processedContent, processedMedia } = await processMediaUploads(rawContent, req.body.media);

    const textToEmbed = prepareTextForEmbedding({ title, content: processedContent, tag: tags });
    const embedding = await generateEmbedding(textToEmbed);

    const log = await WorkLog.create({
      title,
      content: processedContent,
      status,
      privacyLevel,
      project,
      department,
      summary,
      tag: tags,
      media: processedMedia,
      collaborators: collaboratorIds,
      collaboratorMeta,
      user: req.user._id,
      publishedAt: status === "published" ? new Date() : null,
      embedding: Array.isArray(embedding) ? embedding : [],
    });

    const newHistory = await LogHistory.create({
      message: req.body.versionMessage || `Created post: ${log.title}`,
      user: req.user._id,
      snapshot: {
        title,
        content: processedContent,
        tag: tags,
        media: processedMedia,
        collaborators: collaboratorIds,
        datetime: new Date(),
      },
      changedFields: []
    });

    log.log_history.push(newHistory._id);
    await log.save();

    const serialized = await getSerializedWorklogById(log._id);
    res.status(201).json(serialized);

    if (tags.length < 2) {
      tagService.generateTags(title, processedContent).then((aiTags) => {
        if (aiTags.length > 0) {
          WorkLog.findByIdAndUpdate(log._id, { tag: aiTags }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editWorkLog = async (req, res) => {
  try {
    const log = await WorkLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canEditWorklog(log, req.user._id)) {
      return res.status(403).json({ message: "You do not have permission to edit this worklog" });
    }

    const { processedContent, processedMedia } = await processMediaUploads(
      req.body.content ?? log.content,
      req.body.media ?? log.media
    );

    const nextTitle = String(req.body.title || log.title || "").trim() || "Untitled worklog";
    const nextTags = normalizeTags(req.body.tag || req.body.tags || log.tag);
    const nextStatus = req.body.status ? normalizeStatus(req.body.status) : normalizeStatus(log.status);
    const nextPrivacyLevel = req.body.privacyLevel
      ? normalizePrivacyLevel(req.body.privacyLevel)
      : normalizePrivacyLevel(log.privacyLevel);
    const nextProject = req.body.project !== undefined ? String(req.body.project || "").trim() : log.project;
    const nextDepartment = req.body.department !== undefined
      ? String(req.body.department || "").trim()
      : (log.department || req.user.division || "");
    const nextSummary = req.body.summary !== undefined
      ? String(req.body.summary || "").trim()
      : log.summary;

    const textToEmbed = prepareTextForEmbedding({
      title: nextTitle,
      content: processedContent,
      tag: nextTags,
    });
    const embedding = await generateEmbedding(textToEmbed);

    let nextCollaborators = log.collaborators || [];
    let nextCollaboratorMeta = log.collaboratorMeta || [];

    if (Array.isArray(req.body.collaborators)) {
      nextCollaborators = ensureUniqueIds(req.body.collaborators);
      nextCollaboratorMeta = nextCollaborators.map((collaboratorId) => ({
        user: collaboratorId,
        role: normalizeCollaboratorRole(
          (log.collaboratorMeta || []).find((entry) => String(entry.user) === String(collaboratorId))?.role
        ),
      }));
    }

    if (Array.isArray(req.body.collaboratorMeta)) {
      nextCollaboratorMeta = req.body.collaboratorMeta
        .map((entry) => ({
          user: entry.user,
          role: normalizeCollaboratorRole(entry.role),
        }))
        .filter((entry) => entry.user);
      nextCollaborators = ensureUniqueIds(nextCollaboratorMeta.map((entry) => entry.user));
    }

    const updatePayload = {
      title: nextTitle,
      content: processedContent,
      tag: nextTags,
      media: processedMedia,
      status: nextStatus,
      privacyLevel: nextPrivacyLevel,
      project: nextProject,
      department: nextDepartment,
      summary: nextSummary,
      collaborators: nextCollaborators,
      collaboratorMeta: nextCollaboratorMeta,
      embedding: Array.isArray(embedding) ? embedding : [],
      publishedAt: nextStatus === "published" ? (log.publishedAt || new Date()) : null,
    };

    await WorkLog.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

    // Track changed fields
    const changedFields = trackChangedFields(log, updatePayload);

    const newHistory = await LogHistory.create({
      message: req.body.versionMessage || `Edited post: ${log.title}`,
      user: req.user._id,
      snapshot: {
        title: nextTitle,
        content: processedContent,
        tag: nextTags,
        media: processedMedia,
        collaborators: nextCollaborators,
        datetime: new Date(),
      },
      changedFields: changedFields
    });

    await WorkLog.findByIdAndUpdate(req.params.id, { $push: { log_history: newHistory._id } });

    const serialized = await getSerializedWorklogById(req.params.id);
    res.json(serialized);

    if (nextTags.length < 2) {
      tagService.generateTags(nextTitle, processedContent).then((aiTags) => {
        if (aiTags.length > 0) {
          WorkLog.findByIdAndUpdate(req.params.id, { tag: aiTags }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteWorkLog = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id);

    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (String(worklog.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to delete this worklog" });
    }

    const mediaUrls = extractMediaUrls(worklog.content, worklog.media);
    await Promise.all(mediaUrls.map((url) => deleteFromSpaces(url)));

    await Promise.all([
      Comment.deleteMany({ worklog: worklog._id }),
      Reaction.deleteMany({ worklog: worklog._id }),
    ]);

    await worklog.deleteOne();
    res.status(200).json({ message: "WorkLog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addVersion = async (req, res) => {
  try {
    const { message } = req.body;
    const log = await WorkLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canEditWorklog(log, req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to add versions to this worklog" });
    }

    const version = await LogHistory.create({
      message,
      user: req.user._id,
      snapshot: {
        title: log.title,
        content: log.content,
        tag: log.tag,
        media: log.media,
        collaborators: log.collaborators,
        datetime: new Date(),
      },
    });

    log.log_history.push(version._id);
    await log.save();
    res.status(201).json({
      message: "Version added",
      version,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVersions = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id).populate("log_history");
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canEditWorklog(worklog, req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to view these versions" });
    }

    const versions = await LogHistory.find({ _id: { $in: worklog.log_history } })
      .populate("user", "name email division profile_photo")
      .sort({ datetime: -1 });

    res.status(200).json({ worklog_id: worklog._id, title: worklog.title, versions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLogHistoryById = async (req, res) => {
  try {
    const history = await LogHistory.findById(req.params.id);

    if (!history) {
      return res.status(404).json({ message: "LogHistory not found" });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const log = await WorkLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (String(log.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the owner can add collaborators" });
    }

    if (req.body.email && !isAllowedEmailDomain(String(req.body.email).trim().toLowerCase())) {
      return res.status(400).json({ message: `Invite only supports Nebwork email accounts (${getAllowedDomains().join(", ")})` });
    }

    const role = normalizeCollaboratorRole(req.body.role);
    const candidates = await resolveCollaboratorTargets({
      email: req.body.email,
      username: req.body.username,
    });

    if (!candidates.length) {
      return res.status(404).json({ message: "No matching Nebwork account found for this invitation" });
    }

    const invitedUserIds = [];
    const updatedCollaboratorIds = [];

    for (const candidate of candidates) {
      if (!candidate?._id || String(candidate._id) === String(log.user)) {
        continue;
      }

      const candidateId = String(candidate._id);
      const existingMeta = (log.collaboratorMeta || []).find((entry) => String(entry.user) === candidateId);
      const isExistingCollaborator = (log.collaborators || []).some((entry) => String(entry) === candidateId);

      if (isExistingCollaborator) {
        if (existingMeta) {
          existingMeta.role = role;
        } else {
          log.collaboratorMeta.push({ user: candidate._id, role });
        }
        updatedCollaboratorIds.push(candidateId);
      } else {
        const channel = req.body.email ? "email" : "username";
        const identifier = req.body.email
          ? String(req.body.email).trim().toLowerCase()
          : String(req.body.username || "").trim();

        const title = `${req.user.name} invited you to collaborate on "${log.title || "Untitled worklog"}"`;
        const message = `${req.user.name} assigned you as ${role} on this worklog. Accept the invite to access it.`;

        const pendingInvite = await Notification.findOne({
          recipient: candidate._id,
          worklog: log._id,
          type: "worklog_invite",
          "invite.status": "pending",
        });

        if (pendingInvite) {
          pendingInvite.actor = req.user._id;
          pendingInvite.title = title;
          pendingInvite.message = message;
          pendingInvite.invite.role = role;
          pendingInvite.invite.channel = channel;
          pendingInvite.invite.identifier = identifier;
          pendingInvite.isRead = false;
          pendingInvite.readAt = null;
          await pendingInvite.save();
        } else {
          await Notification.create({
            recipient: candidate._id,
            actor: req.user._id,
            type: "worklog_invite",
            title,
            message,
            worklog: log._id,
            invite: {
              role,
              channel,
              identifier,
              status: "pending",
            },
            isRead: false,
          });
        }

        invitedUserIds.push(candidateId);
      }
    }

    await log.save();

    const serialized = await getSerializedWorklogById(log._id);
    const pendingInvites = await getPendingInvitesForWorklog(log._id);
    res.json({
      message:
        invitedUserIds.length > 0
          ? "Invite sent successfully"
          : updatedCollaboratorIds.length > 0
            ? "Collaborator role updated successfully"
            : "No collaborator changes were made",
      collaborators: serialized?.collaboratorDetails || [],
      pendingInvites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCollaborators = async (req, res) => {
  try {
    const worklog = await loadWorklogDetails(req.params.id);
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canViewWorklog(worklog, req.user)) {
      return res.status(403).json({ message: "You do not have permission to view this worklog" });
    }

    const access = buildAccessSummary(worklog, req.user);
    const pendingInvites = access.canManageCollaborators
      ? await getPendingInvitesForWorklog(req.params.id)
      : [];

    res.json({
      message: "Collaborators retrieved successfully",
      collaborators: extractCollaboratorDetails(worklog),
      pendingInvites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCollaborator = async (req, res) => {
  try {
    const { collaboratorId } = req.params;
    const log = await WorkLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (String(log.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    log.collaborators = (log.collaborators || []).filter(
      (id) => String(id) !== String(collaboratorId)
    );
    log.collaboratorMeta = (log.collaboratorMeta || []).filter(
      (entry) => String(entry.user) !== String(collaboratorId)
    );

    await log.save();

    const serialized = await getSerializedWorklogById(log._id);
    res.json({
      message: "Collaborator removed successfully",
      collaborators: serialized?.collaboratorDetails || [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.filterWorkLogs = async (req, res) => {
  try {
    const {
      search,
      tag,
      from,
      to,
      page = 1,
      limit = 10,
      scope = "division",
      status,
      sort = "newest",
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const filters = [await resolveAccessibleFilter(req, scope)];

    const statusList = status
      ? String(status).split(",").map((entry) => normalizeStatus(entry))
      : scope === "feed"
        ? ["published"]
        : [];

    if (statusList.length > 0) {
      filters.push({ status: { $in: statusList } });
    }

    if (tag) {
      const tags = normalizeTags(tag);
      if (tags.length > 0) {
        filters.push({ tag: { $in: tags.map((entry) => new RegExp(`^${escapeRegExp(entry)}$`, "i")) } });
      }
    }

    if (from || to) {
      const datetimeFilter = {};
      if (from) datetimeFilter.$gte = new Date(from);
      if (to) datetimeFilter.$lte = new Date(to);
      filters.push({ datetime: datetimeFilter });
    }

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: escapeRegExp(search), $options: "i" } },
          { email: { $regex: escapeRegExp(search), $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const matchingUserIds = matchingUsers.map((user) => user._id);

      filters.push({
        $or: [
          { title: { $regex: escapeRegExp(search), $options: "i" } },
          { content: { $regex: escapeRegExp(search), $options: "i" } },
          { project: { $regex: escapeRegExp(search), $options: "i" } },
          { department: { $regex: escapeRegExp(search), $options: "i" } },
          ...(matchingUserIds.length > 0 ? [{ user: { $in: matchingUserIds } }] : []),
        ],
      });
    }

    const query = filters.length === 1 ? filters[0] : { $and: filters };
    const sortQuery = sort === "oldest" ? { updatedAt: 1 } : { updatedAt: -1 };

    const [logs, totalDocs] = await Promise.all([
      WorkLog.find(query)
        .populate("user", "name email division profile_photo join_date")
        .populate("collaborators", "name email division profile_photo")
        .populate("collaboratorMeta.user", "name email division profile_photo")
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WorkLog.countDocuments(query),
    ]);

    const metrics = await getMetricsMaps(logs.map((log) => log._id));
    let serializedLogs = logs.map((log) => serializeWorklog(log, metrics));

    if (sort === "trending") {
      serializedLogs = serializedLogs.sort((left, right) => {
        const leftScore = left.metrics.likes + left.metrics.comments + left.metrics.views;
        const rightScore = right.metrics.likes + right.metrics.comments + right.metrics.views;
        return rightScore - leftScore;
      });
    }

    const totalPages = Math.ceil(totalDocs / limitNum);

    res.json({
      worklogs: serializedLogs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalDocs,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWorkLogById = async (req, res) => {
  try {
    const worklog = await loadWorklogDetails(req.params.id);
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canViewWorklog(worklog, req.user)) {
      return res.status(403).json({ message: "You do not have permission to view this worklog" });
    }

    await WorkLog.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {});

    const serialized = await getSerializedWorklogById(req.params.id);
    const access = buildAccessSummary(worklog, req.user);
    const pendingInvites = access.canManageCollaborators
      ? await getPendingInvitesForWorklog(req.params.id)
      : [];

    res.json({
      ...serialized,
      access,
      pendingInvites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const allLogs = await WorkLog.find({ user: userId })
      .select("title content tag datetime createdAt status")
      .sort({ datetime: -1 })
      .lean();

    const total = allLogs.length;
    const published = allLogs.filter((log) => normalizeStatus(log.status) === "published").length;
    const draft = total - published;

    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    const dailyCounts = days.map((day) => {
      const label = day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const count = allLogs.filter((log) => {
        const logDate = new Date(log.datetime || log.createdAt);
        return (
          logDate.getFullYear() === day.getFullYear()
          && logDate.getMonth() === day.getMonth()
          && logDate.getDate() === day.getDate()
        );
      }).length;
      return { date: label, count };
    });

    const tagCounts = {};
    allLogs.forEach((log) => {
      normalizeTags(log.tag).forEach((tagName) => {
        tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([tagName, count]) => ({ tag: tagName, count }));

    const totalWords = allLogs.reduce((sum, log) => sum + getWordCount(log.content || ""), 0);

    let streak = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const hasLog = allLogs.some((log) => {
        const logDate = new Date(log.datetime || log.createdAt);
        return (
          logDate.getFullYear() === checkDate.getFullYear()
          && logDate.getMonth() === checkDate.getMonth()
          && logDate.getDate() === checkDate.getDate()
        );
      });

      if (!hasLog) {
        break;
      }

      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    res.json({
      total,
      totalWords,
      streak,
      published,
      draft,
      dailyCounts,
      topTags,
    });
  } catch (error) {
    console.error("getMyStats error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.summarizeWorkLogs = async (req, res) => {
  try {
    const { worklogs } = req.body;

    if (!worklogs || !Array.isArray(worklogs) || worklogs.length === 0) {
      return res.status(400).json({ message: "No worklogs to summarize." });
    }

    const context = worklogs.map((log, index) => {
      const date = log.date
        ? new Date(log.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        : "";
      const tags = (log.tag || []).join(", ");
      const content = (log.content || "").substring(0, 250);
      return [
        `${index + 1}. "${log.title}"${date ? ` [${date}]` : ""}${tags ? ` (${tags})` : ""}`,
        content ? `   ${content}` : null,
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    const systemPrompt = `You are a team worklog summarizer assistant that ONLY responds in English.
MANDATORY RULES:
- ALWAYS use English. NEVER use any other language.
- Write a SHORT summary of maximum 120 words.
- Focus on main themes, achievements, and team activities.
- Use a professional and positive tone.
- Do not mention specific names, focus on activities.`;

    const userMessage = `[ENGLISH ONLY] Write a short summary in English of the following ${worklogs.length} team worklogs:\n\n${context}\n\nSummary (in English):`;

    const summary = await aiService.generateResponse(systemPrompt, userMessage);

    res.json({ summary, totalLogs: worklogs.length });
  } catch (error) {
    console.error("summarizeWorkLogs error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getRelatedWorkLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const userDivision = req.user?.division;

    const target = await WorkLog.findById(id).select("+embedding").lean();
    if (!target) {
      return res.status(404).json({ message: "WorkLog not found" });
    }
    if (!target.embedding || target.embedding.length === 0) {
      return res.json({ related: [] });
    }

    const results = await WorkLog.aggregate([
      {
        $vectorSearch: {
          index: "worklog_vector_index",
          path: "embedding",
          queryVector: target.embedding,
          numCandidates: 50,
          limit: 6,
        },
      },
      { $match: { _id: { $ne: target._id } } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
          pipeline: [{ $project: { name: 1, division: 1, profile_photo: 1 } }],
        },
      },
      { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      { $match: { "userInfo.division": userDivision } },
      {
        $project: {
          _id: 1,
          title: 1,
          tag: 1,
          datetime: 1,
          score: { $meta: "vectorSearchScore" },
          userName: "$userInfo.name",
          userPhoto: "$userInfo.profile_photo",
        },
      },
      { $limit: 4 },
    ]);

    res.json({ related: results });
  } catch (error) {
    console.error("getRelatedWorkLogs error:", error.message);
    res.json({ related: [] });
  }
};

exports.createVideoMeeting = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id);
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canEditWorklog(worklog, req.user._id)) {
      return res.status(403).json({ message: "You do not have permission to start a meeting for this worklog" });
    }

    const shouldRefresh = req.body.refresh === true;
    const hasExistingMeeting = Boolean(worklog.meeting?.url);

    if (!hasExistingMeeting || shouldRefresh) {
      const roomName = `nebwork-${slugify(worklog.title)}-${String(worklog._id).slice(-6)}${shouldRefresh ? `-${Date.now()}` : ""}`;
      worklog.meeting = {
        roomName,
        url: `https://meet.jit.si/${roomName}`,
        createdBy: req.user._id,
        updatedAt: new Date(),
      };
      await worklog.save();
    }

    res.json({
      message: "Video meeting ready",
      meeting: worklog.meeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVideoMeeting = async (req, res) => {
  try {
    const worklog = await WorkLog.findById(req.params.id);
    if (!worklog) {
      return res.status(404).json({ message: "WorkLog not found" });
    }

    if (!canViewWorklog(worklog, req.user)) {
      return res.status(403).json({ message: "You do not have permission to view this worklog meeting" });
    }

    if (!worklog.meeting?.url) {
      return res.status(404).json({ message: "No meeting has been created for this worklog yet" });
    }

    res.json({
      meeting: worklog.meeting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
