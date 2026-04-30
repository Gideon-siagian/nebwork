import {
  Award,
  Calendar,
  Camera,
  ChevronRight,
  ExternalLink,
  Github,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Twitter,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AUTH_ENDPOINTS, WORKLOG_ENDPOINTS } from "@/config/api";
import { currentUser } from "@/data/nebwork-mock";
import { cn } from "@/lib/utils";

export default function NebworkProfile() {
  const [profileData, setProfileData] = useState(null);
  const [worklogs, setWorklogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", profilePicture: "", bio: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const [profileRes, worklogsRes] = await Promise.all([
        fetch(AUTH_ENDPOINTS.PROFILE, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${WORKLOG_ENDPOINTS.LIST}?scope=mine&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [profileJson, worklogsJson] = await Promise.all([
        profileRes.json(),
        worklogsRes.json()
      ]);

      const user = profileJson.user || profileJson;
      const mappedUser = {
        name: user.name || currentUser.name,
        role: user.role === "admin" ? "Administrator" : (user.role || currentUser.role),
        team: user.division || currentUser.team,
        email: user.email || "dion.pratama@nebwork.id",
        bio: user.bio || "Knowledge stays here. I am a contributor at Nebwork.",
        initials: (user.name || currentUser.name)
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        profilePicture: user.profilePicture || user.profile_photo || null,
        joinedDate: user.createdAt 
          ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
          : "March 2024",
      };

      setProfileData(mappedUser);
      setEditForm({
        name: mappedUser.name,
        profilePicture: mappedUser.profilePicture || "",
        bio: mappedUser.bio,
      });
      setWorklogs(worklogsJson.worklogs || []);
    } catch (error) {
      console.error("Failed to fetch profile data", error);
      toast.error("Failed to sync your profile data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = sessionStorage.getItem("token");

    try {
      const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          profilePicture: editForm.profilePicture,
          bio: editForm.bio,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile");

      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
      
      const rawUser = sessionStorage.getItem("user");
      if (rawUser) {
        const userObj = JSON.parse(rawUser);
        sessionStorage.setItem("user", JSON.stringify({
          ...userObj,
          name: editForm.name,
          profile_photo: editForm.profilePicture
        }));
      }

      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    const token = sessionStorage.getItem("token");

    try {
      const response = await fetch(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to change password");

      toast.success("Password changed successfully!");
      setIsPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resizeImage = (base64Str, maxWidth = 200, maxHeight = 200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compressing to JPEG with 70% quality
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resized = await resizeImage(reader.result);
      setEditForm((prev) => ({ ...prev, profilePicture: resized }));
      toast.info("Profile picture optimized. Click Save to apply.");
    };
    reader.readAsDataURL(file);
  };

  const stats = useMemo(() => {
    const total = worklogs.length;
    const published = worklogs.filter(w => w.status === 'published').length;
    const collaborative = worklogs.filter(w => (w.collaboratorDetails || []).length > 0).length;

    return [
      { label: "Total Worklogs", value: total.toString(), icon: UserCheck, color: "text-blue-500" },
      { label: "Published Feed", value: published.toString(), icon: MessageSquare, color: "text-teal-500" },
      { label: "Collaborations", value: collaborative.toString(), icon: Award, color: "text-amber-500" },
    ];
  }, [worklogs]);

  const recentContributions = useMemo(() => {
    return worklogs
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  }, [worklogs]);

  if (isLoading) {
    return (
      <AppShell title="Profile" description="Manage your personal identity and workspace presence.">
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground font-medium">Loading your profile...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const user = profileData || { ...currentUser, joinedDate: "March 2024", email: "dion.pratama@nebwork.id" };

  return (
    <AppShell
      title="User Profile"
      description="View and manage your identity, achievements, and contributions within Nebwork."
      actions={
        <div className="flex gap-3">
          <Button onClick={() => setIsPasswordDialogOpen(true)} variant="outline" className="rounded-2xl bg-white/70">
            <KeyRound className="mr-2 h-4 w-4" /> Change Password
          </Button>
          <Button onClick={() => setIsEditDialogOpen(true)} variant="outline" className="rounded-2xl bg-white/70">
            Edit Profile Settings
          </Button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-white shadow-xl shadow-slate-200/50">
          <div className="h-48 w-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] opacity-90" />
          <div className="relative px-8 pb-8 pt-0">
            <div className="flex flex-col items-end justify-between gap-6 sm:flex-row sm:items-center">
              <div className="-mt-16 flex items-end gap-6">
                <div className="group relative">
                  <Avatar className="h-40 w-40 border-[6px] border-white shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]">
                    <AvatarImage src={user.profilePicture} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-4xl font-bold text-slate-800">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    onClick={() => setIsEditDialogOpen(true)}
                    className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg transition-colors hover:bg-slate-50"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                <div className="mb-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900">{user.name}</h2>
                    <ShieldCheck className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">{user.role} • {user.team}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200">
                  <Github className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200">
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <Card key={stat.label} className="border-border/60 bg-white/80 transition-all hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* About Me & Bio */}
            <Card className="border-border/60 bg-white/80">
              <CardHeader>
                <CardTitle className="text-xl">About & Bio</CardTitle>
                <CardDescription>A brief overview of your background and focus at Nebwork.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Jakarta, Indonesia
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Joined {user.joinedDate}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Recent Contributions */}
            <Card className="border-border/60 bg-white/80">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Recent Contributions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentContributions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500 italic">No contributions yet.</p>
                ) : (
                  recentContributions.map((log) => (
                    <Link 
                      key={log.id} 
                      to={`/worklog/${log.id}`}
                      className="group flex items-center justify-between gap-3 border-b border-border/40 pb-3 last:border-0"
                    >
                      <p className="line-clamp-1 text-sm font-medium text-slate-600 transition-colors group-hover:text-blue-600">
                        {log.title}
                      </p>
                      <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-blue-500" />
                    </Link>
                  ))
                )}
                <Button asChild variant="outline" className="mt-2 w-full rounded-2xl">
                  <Link to="/my-worklogs">Manage Worklogs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal identity and how you appear to your team in Nebwork.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="group relative">
                <Avatar className="h-24 w-24 border-2 border-border shadow-md">
                  <AvatarImage src={editForm.profilePicture} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-2xl font-bold text-slate-800">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>
              <p className="text-xs text-muted-foreground">Click to change profile picture</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">About & Bio</Label>
                <Textarea 
                  id="bio" 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="rounded-xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] min-w-[100px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">Change Password</DialogTitle>
            <DialogDescription>
              Ensure your account stays secure with a strong password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password"
                value={passwordForm.currentPassword} 
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="••••••••"
                className="rounded-xl"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password"
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="••••••••"
                className="rounded-xl"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                className="rounded-xl"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="rounded-xl bg-slate-900 text-white min-w-[120px]"
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
