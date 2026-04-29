import { Bell, BrainCircuit, ChartSpline, FilePlus2, House, Menu, Search, Sparkles, Users2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

const navigation = [
  { label: "Home Feed", href: "/", icon: House },
  { label: "Create Worklog", href: "/worklog/new", icon: FilePlus2 },
  { label: "AI Assistant", href: "/assistant", icon: BrainCircuit },
  { label: "Projects", href: "/projects", icon: Users2 },
  { label: "Analytics", href: "/analytics", icon: ChartSpline },
];

function isActivePath(pathname, href) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

function SidebarContent() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-[#0f3d3e] text-white">
      <div className="space-y-6 px-6 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Sparkles className="h-6 w-6 text-[#ffd4a8]" />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">Nebwork</p>
            <p className="text-sm text-white/70">Knowledge that stays.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">North star</p>
          <p className="mt-2 font-display text-lg leading-tight">
            Work happens. Nebwork documents it. Knowledge survives turnover.
          </p>
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
                    ? "bg-[#f7f2ea] text-[#0f3d3e] shadow-lg shadow-black/10"
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
        <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Logged in as</p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-white/15">
              <AvatarFallback className="bg-[#ffd4a8] font-semibold text-[#0f3d3e]">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-white/70">
                {currentUser.role} • {currentUser.team}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ title, description, children, actions }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.10),_transparent_32%),linear-gradient(180deg,#f9f5ef_0%,#f4efe7_46%,#eef7f6_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 lg:block">
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-[#f9f5ef]/85 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
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
                      placeholder="Search worklogs, people, projects..."
                      className="h-11 rounded-2xl border-border/70 bg-white/80 pl-9"
                    />
                  </div>
                  {actions}
                  <Button variant="outline" size="icon" className="relative rounded-2xl bg-white/70">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e76f51] text-[10px] font-semibold text-white">
                      {currentUser.unreadNotifications}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:hidden">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search worklogs, people, projects..."
                    className="h-11 rounded-2xl border-border/70 bg-white/80 pl-9"
                  />
                </div>
                {actions}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>

          <div className="pointer-events-none fixed bottom-6 right-6 z-20">
            <Button asChild className="pointer-events-auto h-14 rounded-full bg-[#0f766e] px-5 shadow-xl shadow-[#0f766e]/30 hover:bg-[#0c5d57]">
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
