import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, FileText, Settings2, Users2, Video } from "lucide-react";

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
  const [emailInvite, setEmailInvite] = useState("");
  const [usernameInvite, setUsernameInvite] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isMeetingLoading, setIsMeetingLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

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
      setError("You do not have permission to edit this worklog.");
      return null;
    }

    setIsSaving(true);
    setError("");

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
        collaborators: collaborators.map((collaborator) => collaborator.id),
        collaboratorMeta: collaborators.map((collaborator) => ({
          user: collaborator.id,
          role: collaborator.role || "editor",
        })),
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
        setFeedback(nextStatus === "published" ? "Worklog published." : "Draft saved.");
      }

      if (!worklogId && nextId) {
        navigate(`/worklog/${nextId}`, { replace: true });
      }

      return data;
    } catch (saveError) {
      setError(saveError.message || "Failed to save worklog");
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

  const handleInvite = async (payload) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!access.canManageCollaborators) {
      setError("You do not have permission to invite collaborators to this worklog.");
      return;
    }

    const ensuredId = await ensureDraftExists();
    if (!ensuredId) {
      return;
    }

    setIsInviting(true);
    setError("");

    try {
      const response = await fetch(WORKLOG_ENDPOINTS.COLLABORATORS(ensuredId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to invite collaborator");
      }

      setCollaborators(data.collaborators || []);
      setPendingInvites(data.pendingInvites || []);
      setFeedback(data.message || "Collaborator updated.");
      setEmailInvite("");
      setUsernameInvite("");
    } catch (inviteError) {
      setError(inviteError.message || "Failed to invite collaborator");
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
    setError("");

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
      setError(meetingError.message || "Failed to prepare video meeting");
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
      setFeedback("Meeting link copied.");
    }
  };

  return (
    <AppShell
      title="Worklog"
      description={feedback || "Tulis, simpan draft, invite collaborator, lalu publish dari editor yang sama."}
      actions={
        status !== "published" && (
            <>
                <Button variant="outline" className="rounded-2xl" onClick={() => saveWorklog("draft")} disabled={isSaving || !access.canEdit}>
                    Save draft
                </Button>
                <Button
                    disabled={isSaving || !access.canEdit}
                    onClick={() => saveWorklog("published")}
                    className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                >
                    Publish
                </Button>
            </>
          )
      }
    >
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Worklog settings</DialogTitle>
            <DialogDescription>
              Metadata utama untuk satu dokumen kerja individual atau shared.
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
                placeholder="Ringkas tujuan utama worklog ini"
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
                {tags.length === 0 ? <Badge variant="outline">Belum ada tag</Badge> : null}
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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Invite collaborator</DialogTitle>
            <DialogDescription>
              Tambahkan karyawan lain melalui email Nebwork atau username Nebwork agar bisa mengakses worklog yang sama.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Invite role</p>
              <div className="flex flex-wrap gap-2">
                {["editor", "commenter", "viewer"].map((role) => (
                  <Button
                    key={role}
                    size="sm"
                    variant={inviteRole === role ? "default" : "outline"}
                    className={inviteRole === role ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" : "rounded-full"}
                    onClick={() => setInviteRole(role)}
                  >
                    {`Invite as ${role.charAt(0).toUpperCase()}${role.slice(1)}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Invite by email</p>
                <div className="flex gap-2">
                  <Input value={emailInvite} onChange={(event) => setEmailInvite(event.target.value)} className="h-11 rounded-2xl bg-white" placeholder="rani.siregar@nebwork.id" />
                  <Button disabled={isInviting || !emailInvite.trim()} className="rounded-2xl" onClick={() => handleInvite({ email: emailInvite.trim() })}>
                    Invite
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Invite by username</p>
                <div className="flex gap-2">
                  <Input value={usernameInvite} onChange={(event) => setUsernameInvite(event.target.value)} className="h-11 rounded-2xl bg-white" placeholder="@fikrimahendra" />
                  <Button disabled={isInviting || !usernameInvite.trim()} className="rounded-2xl" onClick={() => handleInvite({ username: usernameInvite.trim() })}>
                    Invite
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Collaborators</p>
              {(collaborators || []).length === 0 ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  Belum ada collaborator aktif pada worklog ini.
                </div>
              ) : collaborators.map((person) => (
                <div key={person.id} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-500">{`${person.role} - ${person.division || "Nebwork"}`}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">Pending invites</p>
              {pendingInvites.length === 0 ? (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  Belum ada invite yang menunggu respons.
                </div>
              ) : pendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{invite.name}</p>
                  <p className="text-xs text-slate-500">
                    {`${invite.role} - ${invite.channel === "username" ? `username @${invite.username}` : invite.email}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-xl rounded-[28px] border-border/60 bg-[#fbfdff] p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <DialogTitle className="font-display text-2xl text-slate-900">Video meeting</DialogTitle>
            <DialogDescription>
              Link meeting ini dibuat khusus untuk worklog yang sedang Anda edit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-6">
            <div className="rounded-2xl border border-border/60 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">{meetingInfo?.roomName || "Meeting room"}</p>
              <p className="mt-1 break-all text-sm text-slate-500">{meetingInfo?.url || "Belum ada link meeting."}</p>
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

      <div className="space-y-6">
        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        {!isLoading && !access.canEdit ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5 text-sm text-amber-800">
              Anda membuka worklog ini sebagai <span className="font-semibold">{access.role}</span>. Konten tetap bisa dibaca, tetapi perubahan hanya bisa dilakukan oleh owner atau collaborator dengan role editor.
            </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden border-border/60 bg-white/[0.92]">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-xl text-slate-900">Worklog actions</p>
                  <p className="text-sm text-slate-500">Atur pengaturan dokumen dan kolaborator langsung dari sini.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => setSettingsOpen(true)} disabled={!access.canManageSettings}>
                  <Settings2 className="h-4 w-4" />
                  Worklog setting
                </Button>
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
                <Badge variant="outline">Belum ada collaborator</Badge>
              ) : collaborators.map((person) => (
                <div key={person.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-[11px] text-white">
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="text-xs font-medium text-slate-900">{person.name}</p>
                    <p className="text-[11px] text-slate-500">{person.role}</p>
                  </div>
                </div>
              ))}
              {pendingInvites.length > 0 ? (
                <Badge variant="secondary">{`${pendingInvites.length} pending invite${pendingInvites.length > 1 ? "s" : ""}`}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="bg-white/[0.9]">
            <CardContent className="p-6 text-sm text-slate-500">Loading worklog...</CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-border/60 bg-white/[0.4] p-2 shadow-[0_24px_80px_-48px_rgba(15,61,62,0.45)]">
            <SimpleEditor
              key={worklogId || "new-worklog"}
              onBack={() => navigate("/my-worklogs")}
              onVersion={() => setSettingsOpen(true)}
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
        )}
      </div>
    </AppShell>
  );
}
