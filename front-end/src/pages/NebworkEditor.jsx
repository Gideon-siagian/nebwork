import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Copy, Eye, FileText, GitCommit, History, PencilLine, Settings2, Users2, Video, X } from "lucide-react";
import { toast } from "sonner";

import { WORKLOG_ENDPOINTS } from "@/config/api";
import { AppShell } from "@/components/nebwork/app-shell-v2";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const VISIBILITY_OPTIONS = ["team", "public", "private"];

const withHash = (tag) => (String(tag || "").startsWith("#") ? tag : `#${tag}`);
const getInitials = (name = "NB") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const normalizeVisibilityLabel = (privacyLevel) => {
  if (privacyLevel === "team") return "Team Only";
  return String(privacyLevel || "team").charAt(0).toUpperCase() + String(privacyLevel || "team").slice(1);
};

export default function NebworkEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const hydrationRef = useRef(false);

  const [worklogId, setWorklogId] = useState(id || null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState("");
  const [project, setProject] = useState("");
  const [department, setDepartment] = useState("");
  const [privacyLevel, setPrivacyLevel] = useState("team");
  const [status, setStatus] = useState("draft");
  const [summary, setSummary] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [access, setAccess] = useState({
    role: "owner",
    canEdit: true,
    canManageSettings: true,
    canManageCollaborators: true,
    canCreateMeeting: true,
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [pendingCommit, setPendingCommit] = useState(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);

  const [usernameInvite, setUsernameInvite] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isMeetingLoading, setIsMeetingLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const markDirty = () => {
    if (!hydrationRef.current) {
      setHasUnsavedChanges(true);
    }
  };

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.division) {
          setDepartment((current) => current || parsed.division);
        }
      } catch (parseError) {
        console.error("Failed to parse session user", parseError);
      }
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!id) {
      return;
    }

    let cancelled = false;

    const loadWorklog = async () => {
      setIsLoading(true);
      setError("");
      hydrationRef.current = true;

      try {
        const response = await fetch(WORKLOG_ENDPOINTS.ONE(id), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load worklog");
        }

        if (cancelled) {
          return;
        }

        setWorklogId(data.id || data._id || id);
        setTitle(data.title || "");
        setTags((data.tag || []).map(withHash));
        setContent(data.content || "");
        setProject(data.project || "");
        setDepartment(data.department || data.author?.division || "");
        setPrivacyLevel(data.privacyLevel || "team");
        setStatus(data.status || "draft");
        setSummary(data.summary || "");
        setCollaborators(data.collaboratorDetails || []);
        setPendingInvites(data.pendingInvites || []);
        setMeetingInfo(data.meeting?.url ? data.meeting : null);
        setAccess(
          data.access || {
            role: "owner",
            canEdit: true,
            canManageSettings: true,
            canManageCollaborators: true,
            canCreateMeeting: true,
          },
        );
        setHasUnsavedChanges(false);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load worklog");
        }
      } finally {
        if (!cancelled) {
          hydrationRef.current = false;
          setIsLoading(false);
        }
      }
    };

    loadWorklog();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const saveWorklog = async (nextStatus = status, options = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }

    if (worklogId && !access.canEdit) {
      toast.error("You don't have permission to edit this worklog.");
      return null;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: title.trim() || "Untitled worklog",
        content,
        tag: tags,
        status: nextStatus,
        privacyLevel,
        project,
        department,
        summary,
      };

      const response = await fetch(worklogId ? WORKLOG_ENDPOINTS.ONE(worklogId) : WORKLOG_ENDPOINTS.LIST, {
        method: worklogId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save worklog");
      }

      const nextId = data.id || data._id || worklogId;
      setWorklogId(nextId);
      setTitle(data.title || payload.title);
      setTags((data.tag || payload.tag || []).map(withHash));
      setContent(data.content || payload.content);
      setProject(data.project || payload.project);
      setDepartment(data.department || payload.department);
      setPrivacyLevel(data.privacyLevel || payload.privacyLevel);
      setStatus(data.status || nextStatus);
      setSummary(data.summary || payload.summary || "");
      setCollaborators(data.collaboratorDetails || collaborators);
      setPendingInvites(data.pendingInvites || pendingInvites);
      setMeetingInfo(data.meeting?.url ? data.meeting : meetingInfo);
      if (data.access) {
        setAccess(data.access);
      }
      setHasUnsavedChanges(false);
      if (!options.silent) {
        if (nextStatus === "published") {
          toast.success("Worklog published!", { description: "Your worklog is now visible to the team." });
        } else {
          toast.success("Draft saved.");
        }
      }

      if (!worklogId && nextId) {
        navigate(`/worklog/${nextId}`, { replace: true });
      }

      return { ...data, id: nextId };
    } catch (saveError) {
      toast.error(saveError.message || "Failed to save worklog.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!hasUnsavedChanges || !access.canEdit) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      void saveWorklog(status || "draft", { silent: true });
    }, 30000);

    return () => clearTimeout(timeout);
  }, [access.canEdit, content, title, tags, project, department, privacyLevel, summary, collaborators, hasUnsavedChanges, status]);

  const ensureDraftExists = async () => {
    if (worklogId) {
      return worklogId;
    }

    const saved = await saveWorklog("draft", { silent: true });
    return saved?.id || saved?._id || null;
  };

  // Show commit modal before an explicit save; afterSave runs on success
  const requestCommitAndSave = (nextStatus, afterSave = null) => {
    setCommitMessage("");
    setPendingCommit({ status: nextStatus, afterSave });
    setCommitOpen(true);
  };

  // Confirm commit modal: save worklog + create version entry
  const handleCommitConfirm = async () => {
    setCommitOpen(false);
    if (!pendingCommit) return;

    const saved = await saveWorklog(pendingCommit.status);
    if (saved) {
      const savedId = saved.id || saved._id || worklogId;
      if (savedId) {
        const token = sessionStorage.getItem("token");
        try {
          await fetch(WORKLOG_ENDPOINTS.VERSIONS(savedId), {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ message: commitMessage.trim() || "Update worklog" }),
          });
        } catch (err) {
          console.error("Failed to create version entry:", err);
        }
      }
      if (pendingCommit.afterSave) {
        pendingCommit.afterSave();
      }
    }

    setPendingCommit(null);
  };

  // Intercept back navigation: if worklog exists, document changes first
  const handleBack = () => {
    if (worklogId && access.canEdit) {
      requestCommitAndSave(status || "draft", () => navigate("/my-worklogs"));
    } else {
      navigate("/my-worklogs");
    }
  };

  const openVersionHistory = async () => {
    if (!worklogId) return;
    setVersions([]);
    setVersionsOpen(true);
    setIsVersionsLoading(true);
    const token = sessionStorage.getItem("token");
    try {
      const res = await fetch(WORKLOG_ENDPOINTS.VERSIONS(worklogId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVersions(data?.versions ?? []);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setIsVersionsLoading(false);
    }
  };

  const handleInvite = async (payload) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!access.canManageCollaborators) {
      toast.error("You don't have permission to invite collaborators to this worklog.");
      return;
    }

    const ensuredId = await ensureDraftExists();
    if (!ensuredId) {
      return;
    }

    setIsInviting(true);

    try {
      const response = await fetch(WORKLOG_ENDPOINTS.COLLABORATORS(ensuredId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          role: "editor",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to invite collaborator");
      }

      setCollaborators(data.collaborators || []);
      setPendingInvites(data.pendingInvites || []);
      toast.success("Invitation sent!", { description: data.message || "Collaborator has been notified." });
      setUsernameInvite("");
    } catch (inviteError) {
      toast.error(inviteError.message || "Failed to invite collaborator.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleVideoMeeting = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const ensuredId = access.canCreateMeeting ? await ensureDraftExists() : worklogId;
    if (!ensuredId) {
      return;
    }

    setIsMeetingLoading(true);

    try {
      const response = await fetch(WORKLOG_ENDPOINTS.VIDEO_MEETING(ensuredId), {
        method: access.canCreateMeeting ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        ...(access.canCreateMeeting
          ? {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ refresh: false }),
            }
          : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to prepare video meeting");
      }

      setMeetingInfo(data.meeting || null);
      setMeetingOpen(true);
    } catch (meetingError) {
      toast.error(meetingError.message || "Failed to prepare video meeting.");
    } finally {
      setIsMeetingLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSettingsSaving(true);
    const saved = await saveWorklog(status || "draft");
    setIsSettingsSaving(false);

    if (saved) {
      setSettingsOpen(false);
    }
  };

  const copyMeetingLink = async () => {
    if (!meetingInfo?.url) return;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(meetingInfo.url);
      toast.success("Meeting link copied to clipboard.");
    }
  };

  // Auto-open viewer popup whenever a published worklog finishes loading
  useEffect(() => {
    if (status === "published" && worklogId && !isLoading) {
      setViewerOpen(true);
    }
  }, [status, worklogId, isLoading]);

  const handleCloseViewer = () => {
    setViewerOpen(false);
    navigate(-1);
  };

  const handleEditFromViewer = () => {
    setViewerOpen(false);
    setEditMode(true);
  };

  const isViewerMode = status === "published" && !editMode && !!worklogId && !isLoading;

  return (
    <AppShell
      title="Worklog"
      description={isViewerMode ? "Published worklog — read-only view." : "Write, save drafts, invite collaborators, then publish all from the same editor."}
      actions={
        // Editing an already-published worklog
        editMode && status === "published"
          ? (
            <>
              <Button variant="outline" className="rounded-2xl" onClick={() => { setEditMode(false); setViewerOpen(true); }}>
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                disabled={isSaving || !access.canEdit}
                onClick={() => requestCommitAndSave("published")}
                className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
              >
                Save changes
              </Button>
            </>
          )
        // Draft or new worklog
        : status !== "published"
          ? (
            <>
              <Button variant="outline" className="rounded-2xl" onClick={() => requestCommitAndSave("draft")} disabled={isSaving || !access.canEdit}>
                Save draft
              </Button>
              <Button
                disabled={isSaving || !access.canEdit}
                onClick={() => requestCommitAndSave("published")}
                className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
              >
                Publish
              </Button>
            </>
          )
        // Viewer popup is open — no header actions needed
        : null
      }
    >
      {/* Commit message modal */}
      <Dialog open={commitOpen} onOpenChange={(open) => { if (!open) { setCommitOpen(false); setPendingCommit(null); } }}>
        <DialogContent className="max-w-lg rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                <GitCommit className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl text-slate-900">Document your changes</DialogTitle>
                <DialogDescription className="text-sm">
                  Describe what you changed — this becomes a version history entry.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <Textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="e.g. Added Q3 progress summary, updated timeline section"
              className="min-h-[100px] resize-none rounded-2xl bg-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  handleCommitConfirm();
                }
              }}
            />
            <p className="text-xs text-slate-400">Press Ctrl+Enter to save quickly. Leave blank to use "Update worklog".</p>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => { setCommitOpen(false); setPendingCommit(null); }}
              >
                Cancel
              </Button>
              <Button
                className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                onClick={handleCommitConfirm}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : pendingCommit?.status === "published" ? "Publish" : "Save draft"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version history popup */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0 max-h-[80vh] flex flex-col">
          <DialogHeader className="border-b border-border/60 px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                <History className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl text-slate-900">Version history</DialogTitle>
                <DialogDescription className="text-sm">
                  Every save is documented here like a commit log.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">
            {isVersionsLoading ? (
              <p className="text-sm text-slate-500 py-4 text-center">Loading history…</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No versions saved yet. Save a draft or publish to create the first entry.</p>
            ) : versions.map((v) => (
              <div key={v._id} className="rounded-2xl border border-border/60 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-[11px] font-semibold text-white">
                      {getInitials(v.user?.name || "NB")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{v.user?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-400">{v.user?.division || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {new Date(v.datetime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {new Date(v.datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 pl-12">
                  <GitCommit className="h-4 w-4 shrink-0 text-[#2563eb] mt-0.5" />
                  <p className="text-sm text-slate-700 leading-relaxed">{v.message || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Worklog settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Worklog settings</DialogTitle>
            <DialogDescription>
              Primary metadata for an individual or shared work document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Worklog title</p>
              <Input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  markDirty();
                }}
                disabled={!access.canManageSettings}
                className="h-11 rounded-2xl bg-white"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Project association</p>
                <Input
                  value={project}
                  onChange={(event) => {
                    setProject(event.target.value);
                    markDirty();
                  }}
                  disabled={!access.canManageSettings}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Department</p>
                <Input
                  value={department}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    markDirty();
                  }}
                  disabled={!access.canManageSettings}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Summary</p>
              <Input
                value={summary}
                onChange={(event) => {
                  setSummary(event.target.value);
                  markDirty();
                }}
                disabled={!access.canManageSettings}
                className="h-11 rounded-2xl bg-white"
                placeholder="Summarize the main purpose of this worklog"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Visibility</p>
              <div className="flex flex-wrap gap-2">
                {VISIBILITY_OPTIONS.map((visibility) => (
                  <Button
                    key={visibility}
                    size="sm"
                    variant={privacyLevel === visibility ? "default" : "outline"}
                    className={privacyLevel === visibility ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" : "rounded-full"}
                    disabled={!access.canManageSettings}
                    onClick={() => {
                      setPrivacyLevel(visibility);
                      markDirty();
                    }}
                  >
                    {normalizeVisibilityLabel(visibility)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? <Badge variant="outline">No tags yet</Badge> : null}
                {tags.map((tag) => (
                  <Badge key={tag} variant="soft">{withHash(tag)}</Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setSettingsOpen(false)}>
                Close
              </Button>
              <Button
                disabled={isSettingsSaving || !access.canManageSettings}
                className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                onClick={handleSaveSettings}
              >
                Save settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite collaborator dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Invite collaborator</DialogTitle>
            <DialogDescription>
              Invited collaborators get full editor access — they can read, write, and edit this worklog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Invite by username</p>
              <div className="flex gap-2">
                <Input value={usernameInvite} onChange={(event) => setUsernameInvite(event.target.value)} className="h-11 rounded-2xl bg-white" placeholder="@fikrimahendra" />
                <Button disabled={isInviting || !usernameInvite.trim()} className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" onClick={() => handleInvite({ username: usernameInvite.trim() })}>
                  Invite
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Collaborators</p>
              {(collaborators || []).length === 0 ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  No active collaborators on this worklog yet.
                </div>
              ) : collaborators.map((person) => (
                <div key={person.id} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-500">{`Editor · ${person.division || "Nebwork"}`}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Pending invites</p>
              {pendingInvites.length === 0 ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  No invites awaiting response yet.
                </div>
              ) : pendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{invite.name}</p>
                  <p className="text-xs text-slate-500">
                    {`Editor · ${invite.channel === "username" ? `@${invite.username}` : invite.email}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video meeting dialog */}
      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Video meeting</DialogTitle>
            <DialogDescription>
              This meeting link is created specifically for the worklog you are currently editing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="rounded-2xl border border-border/60 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">{meetingInfo?.roomName || "Meeting room"}</p>
              <p className="mt-1 break-all text-sm text-slate-500">{meetingInfo?.url || "No meeting link available."}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={copyMeetingLink}>
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
              <Button
                className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                onClick={() => meetingInfo?.url && window.open(meetingInfo.url, "_blank", "noopener,noreferrer")}
              >
                Join meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── VIEWER POPUP (published worklog) ── */}
      <Dialog open={viewerOpen} onOpenChange={(open) => { if (!open) handleCloseViewer(); }}>
        <DialogContent className="flex max-h-[88vh] max-w-3xl flex-col overflow-hidden rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          {/* Header */}
          <DialogHeader className="shrink-0 border-b border-border/60 px-7 py-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Published</Badge>
                <Badge variant="outline">{normalizeVisibilityLabel(privacyLevel)}</Badge>
                {project ? <Badge variant="secondary">{project}</Badge> : null}
                {department ? <span className="ml-auto text-xs text-slate-400">{department}</span> : null}
              </div>
              <DialogTitle className="font-display text-3xl leading-tight text-slate-900">
                {title || "Untitled worklog"}
              </DialogTitle>
              {summary ? (
                <DialogDescription className="text-sm leading-6 text-slate-500">
                  {summary}
                </DialogDescription>
              ) : null}
            </div>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 space-y-5 overflow-y-auto px-7 py-6">
            {/* Tags */}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">{withHash(tag)}</Badge>
                ))}
              </div>
            ) : null}

            {/* Collaborators */}
            {(collaborators || []).length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {collaborators.map((person) => (
                  <div key={person.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-1.5">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-[10px] text-white">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-slate-900">{person.name}</span>
                    <span className="text-[11px] text-slate-400">Editor</span>
                  </div>
                ))}
              </div>
            ) : null}

            {(tags.length > 0 || (collaborators || []).length > 0) ? (
              <div className="border-t border-border/60" />
            ) : null}

            {/* Content */}
            {content ? (
              <div
                className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-[#2563eb] prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-pre:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">This worklog has no content.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border/60 px-7 py-4">
            <Button variant="outline" className="rounded-2xl" onClick={handleCloseViewer}>
              <X className="h-4 w-4" />
              Close
            </Button>
            {access.canEdit ? (
              <Button
                className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                onClick={handleEditFromViewer}
              >
                <PencilLine className="h-4 w-4" />
                Edit worklog
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDITOR MODE (draft, new, or editing published) ── */}
      <div className="space-y-6">
        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        {!isLoading && !access.canEdit && !isViewerMode ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5 text-sm text-amber-800">
              You are viewing this worklog as <span className="font-semibold">{access.role}</span>. Content is readable, but changes can only be made by the owner or collaborators with the editor role.
            </CardContent>
          </Card>
        ) : null}

        {!isViewerMode ? (
          <Card className="overflow-hidden border-border/60 bg-white/[0.92]">
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-xl text-slate-900">Worklog actions</p>
                    <p className="text-sm text-slate-500">Manage document settings and collaborators directly from here.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="rounded-2xl" onClick={() => setSettingsOpen(true)} disabled={!access.canManageSettings}>
                    <Settings2 className="h-4 w-4" />
                    Worklog setting
                  </Button>
                  {worklogId && (
                    <Button variant="outline" className="rounded-2xl" onClick={() => openVersionHistory()}>
                      <History className="h-4 w-4" />
                      Version history
                    </Button>
                  )}
                  <Button variant="outline" className="rounded-2xl" onClick={handleVideoMeeting} disabled={isMeetingLoading || (!access.canCreateMeeting && !worklogId)}>
                    <Video className="h-4 w-4" />
                    Video meeting
                  </Button>
                  <Button className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" onClick={() => setInviteOpen(true)} disabled={!access.canManageCollaborators}>
                    <Users2 className="h-4 w-4" />
                    Invite collaborator
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(collaborators || []).length === 0 ? (
                  <Badge variant="outline">No collaborators yet</Badge>
                ) : collaborators.map((person) => (
                  <div key={person.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-[11px] text-white">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <p className="text-xs font-medium text-slate-900">{person.name}</p>
                      <p className="text-[11px] text-slate-500">Editor</p>
                    </div>
                  </div>
                ))}
                {pendingInvites.length > 0 ? (
                  <Badge variant="secondary">{`${pendingInvites.length} pending invite${pendingInvites.length > 1 ? "s" : ""}`}</Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="bg-white/[0.9]">
            <CardContent className="p-6 text-sm text-slate-500">Loading worklog...</CardContent>
          </Card>
        ) : !isViewerMode ? (
          <div className="overflow-hidden rounded-[32px] border border-border/60 bg-white/[0.4] p-2 shadow-[0_24px_80px_-48px_rgba(15,61,62,0.45)]">
            <SimpleEditor
              key={worklogId || "new-worklog"}
              onBack={handleBack}
              onVersion={() => worklogId && openVersionHistory()}
              sidebarCollapsed={false}
              initialContent={content}
              initialTitle={title}
              initialTags={tags}
              editable={access.canEdit}
              onContentChange={(nextContent) => {
                setContent(nextContent);
                markDirty();
              }}
              onTitleChange={(nextTitle) => {
                setTitle(nextTitle);
                markDirty();
              }}
              onTagsChange={(nextTags) => {
                setTags(nextTags);
                markDirty();
              }}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
