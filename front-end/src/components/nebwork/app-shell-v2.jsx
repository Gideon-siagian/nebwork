import { Bell, BrainCircuit, ChevronUp, FilePlus2, Files, House, LogOut, Menu, Search, Sparkles, UserCheck, Users, BarChart2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AUTH_ENDPOINTS, NOTIFICATION_ENDPOINTS } from "@/config/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { currentUser } from "@/data/nebwork-mock";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { label: "Home Feed", href: "/", icon: House },
  { label: "My Worklogs", href: "/my-worklogs", icon: Files },
  { label: "Worklog", href: "/worklog/new", icon: FilePlus2 },
  { label: "AI Assistant", href: "/assistant", icon: BrainCircuit },
  { label: "Stats", href: "/stats", icon: BarChart2 },
];

const buildNavigation = (user) => (
  user?.role === "admin"
    ? [...baseNavigation, { label: "Admin", href: "/admin", icon: Users }]
    : baseNavigation
);

function isActivePath(pathname, href) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

function SidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionUser = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }, []);

  const displayUser = sessionUser
    ? {
        initials: sessionUser.name
          ?.split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase(),
        name: sessionUser.name,
        role: sessionUser.role === "admin" ? "Admin" : "Member",
        team: sessionUser.division || "Nebwork",
        email: sessionUser.email,
      }
    : currentUser;

  const navigation = useMemo(() => buildNavigation(sessionUser), [sessionUser]);

  const handleLogout = async () => {
    const token = sessionStorage.getItem("token");

    try {
      if (token) {
        await fetch(AUTH_ENDPOINTS.LOGOUT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed", error);
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#020617_0%,#111827_54%,#1d4ed8_100%)] text-white">
      <div className="px-6 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Sparkles className="h-6 w-6 text-[#bfdbfe]" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">Nebwork</p>
            <p className="text-sm text-white/70">Knowledge that stays.</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(location.pathname, item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  active
                    ? "bg-white/95 text-[#020617] shadow-lg shadow-black/10"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="px-6 pb-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full rounded-3xl border border-white/10 bg-white/[0.08] p-4 text-left transition hover:bg-white/[0.12]">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Logged in as</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border border-white/15">
                    <AvatarFallback className="bg-[#dbeafe] font-semibold text-[#0f172a]">
                      {displayUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{displayUser.name}</p>
                    <p className="text-xs text-white/70">{`${displayUser.role} - ${displayUser.team}`}</p>
                  </div>
                </div>
                <ChevronUp className="h-4 w-4 text-white/70" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border/70 bg-white/95 p-2 backdrop-blur-xl">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">{displayUser.name}</p>
              <p className="text-xs font-normal text-slate-500">{displayUser.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-xl px-3 py-2.5 text-sm text-slate-700"
              onClick={() => navigate("/profile")}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl px-3 py-2.5 text-sm text-slate-700"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AppShell({ title, description, children, actions }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (location.pathname === "/") {
      const search = new URLSearchParams(location.search).get("search") || "";
      setGlobalSearch(search);
      return;
    }

    setGlobalSearch("");
  }, [location.pathname, location.search]);

  useEffect(() => {
    let cancelled = false;
    const token = sessionStorage.getItem("token");

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    const fetchNotifications = async () => {
      setIsNotificationsLoading(true);

      try {
        const response = await fetch(NOTIFICATION_ENDPOINTS.LIST, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to load notifications");
        }

        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setNotificationError("");
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationError(error.message || "Failed to load notifications");
        }
      } finally {
        if (!cancelled) {
          setIsNotificationsLoading(false);
        }
      }
    };

    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [location.pathname]);

  const handleGlobalSearch = (event) => {
      if (event.key !== "Enter") {
          return;
      }

      // Stop the browser from triggering a native page reload
      event.preventDefault();

      const query = globalSearch.trim();
      navigate(query ? `/?search=${encodeURIComponent(query)}` : "/");
  };

  const handleNotificationAction = async (notificationId, action) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        action === "accept"
          ? NOTIFICATION_ENDPOINTS.ACCEPT(notificationId)
          : NOTIFICATION_ENDPOINTS.REJECT(notificationId),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update notification");
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationError("");

      if (action === "accept" && data.worklogId) {
        navigate(`/worklog/${data.worklogId}`);
      }
    } catch (error) {
      setNotificationError(error.message || "Failed to update notification");
    }
  };

  const renderNotificationDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-2xl bg-white/70">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563eb] px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] rounded-2xl border-border/70 bg-white/95 p-0 backdrop-blur-xl">
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-500">Collaborator invites, access acceptance, and the latest worklog updates.</p>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto p-3">
          {notificationError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {notificationError}
            </div>
          ) : null}

          {isNotificationsLoading ? (
            <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
              Loading notifications...
            </div>
          ) : null}

          {!isNotificationsLoading && notifications.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
              No new notifications.
            </div>
          ) : null}

          {notifications.map((notification) => (
            <div key={notification.id} className="space-y-3 rounded-2xl border border-border/60 bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                  <p className="text-xs leading-5 text-slate-500">{notification.message}</p>
                </div>
                <Badge variant={notification.invite?.status === "pending" ? "secondary" : "outline"}>
                  {notification.invite?.status || "pending"}
                </Badge>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p>{notification.worklog?.title || "Untitled worklog"}</p>
                <p>{`Role: ${notification.invite?.role || "viewer"}`}</p>
              </div>
              {notification.invite?.status === "pending" ? (
                <div className="flex gap-2">
                  <Button className="rounded-2xl" onClick={() => handleNotificationAction(notification.id, "accept")}>
                    Accept
                  </Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => handleNotificationAction(notification.id, "reject")}>
                    Reject
                  </Button>
                </div>
              ) : notification.invite?.status === "accepted" && notification.worklog?.id ? (
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link to={`/worklog/${notification.worklog.id}`}>Open worklog</Link>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_44%,#eef4ff_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={`sticky top-0 h-screen w-[290px] shrink-0 self-start transition-all duration-300 ${
          sidebarOpen ? "lg:block" : "lg:hidden"
        } hidden`}>
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-[rgba(255,255,255,0.94)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:inline-flex"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="lg:hidden">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] overflow-hidden p-0">
                      <SheetHeader className="sr-only">
                        <SheetTitle>Nebwork navigation</SheetTitle>
                        <SheetDescription>Navigate across the Nebwork prototype.</SheetDescription>
                      </SheetHeader>
                      <SidebarContent />
                    </SheetContent>
                  </Sheet>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nebwork workspace</p>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>

                <div className="hidden items-center gap-3 xl:flex">
                  <div className="relative min-w-[320px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={globalSearch}
                      onChange={(event) => setGlobalSearch(event.target.value)}
                      onKeyDown={handleGlobalSearch}
                      placeholder="Search worklogs, people, tags..."
                      className="h-11 rounded-2xl border-border/70 bg-white/80 pl-9"
                    />
                  </div>
                  {actions}
                  {renderNotificationDropdown()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:hidden">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={globalSearch}
                    onChange={(event) => setGlobalSearch(event.target.value)}
                    onKeyDown={handleGlobalSearch}
                    placeholder="Search worklogs, people, tags..."
                    className="h-11 rounded-2xl border-border/70 bg-white/80 pl-9"
                  />
                </div>
                {actions}
                {renderNotificationDropdown()}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>

          <div className="pointer-events-none fixed bottom-6 right-6 z-20">
            <Button asChild className="pointer-events-auto h-14 rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] px-5 shadow-xl shadow-[#2563eb]/25 hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
              <Link to="/assistant">
                <BrainCircuit className="h-5 w-5" />
                Ask Nebwork AI
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
