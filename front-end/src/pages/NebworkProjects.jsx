import { Activity, CalendarRange, Clock3, FolderKanban, Users, WandSparkles } from "lucide-react";

import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  activeInvites,
  collaborationGuide,
  inviteSuggestions,
  projectActivity,
  projectColumns,
  projectMembers,
  projectMilestones,
  projectOverview,
} from "@/data/nebwork-mock";

export default function NebworkProjects() {
  return (
    <AppShell
      title="Collaboration workspace"
      description="Project worklog with multi-contributors, lightweight task tracking, presence, and real-time documentation."
      actions={<Button className="rounded-2xl bg-[#0f766e] hover:bg-[#0c5d57]">New project worklog</Button>}
    >
      <div className="space-y-6">
        <Card className="overflow-hidden border-none bg-[#123f40] text-white">
          <CardContent className="grid gap-6 p-0 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-5 p-8 lg:p-10">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                Project overview
              </Badge>
              <div>
                <h2 className="font-display text-4xl leading-tight">{projectOverview.name}</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">{projectOverview.summary}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-white/65">Progress</p>
                  <p className="mt-2 font-display text-3xl">{projectOverview.progress}%</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-white/65">Due date</p>
                  <p className="mt-2 font-display text-3xl">{projectOverview.dueDate}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-white/65">Team</p>
                  <p className="mt-2 font-display text-3xl">{projectOverview.team}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.08] p-8 lg:p-10">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock3 className="h-4 w-4" />
                  Real-time collaboration active
                </div>
                <Progress value={projectOverview.progress} className="mt-4 h-2.5 bg-white/10" indicatorClassName="bg-[#ffd4a8]" />
                <p className="mt-4 text-sm leading-6 text-white/80">
                  OT/CRDT-ready collaboration simulated through presence, section ownership, and activity streams linked to each task.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-3">
              {projectColumns.map((column) => (
                <Card key={column.title} className="bg-white/[0.85]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">{column.title}</CardTitle>
                    <CardDescription>{column.tasks.length} documented tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {column.tasks.map((task) => (
                      <div key={task.title} className="rounded-2xl border border-border/60 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium leading-6 text-slate-900">{task.title}</p>
                          <Badge variant={task.priority === "High" ? "accent" : "outline"}>{task.priority}</Badge>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                          <span>Owner: {task.owner}</span>
                          <span>Task worklog linked</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CalendarRange className="h-5 w-5 text-[#0f766e]" />
                  Milestones timeline
                </CardTitle>
                <CardDescription>Gantt-style view can be added later; currently, concise milestones are sufficient for the MVP.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {projectMilestones.map((milestone) => (
                  <div key={milestone.name} className="rounded-2xl border border-border/60 bg-white p-4">
                    <Badge variant={milestone.status === "Done" ? "secondary" : milestone.status === "In Progress" ? "accent" : "outline"}>
                      {milestone.status}
                    </Badge>
                    <p className="mt-4 font-semibold text-slate-900">{milestone.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{milestone.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-[#0f766e]" />
                  Team presence
                </CardTitle>
                <CardDescription>Who is currently viewing or editing the project worklog.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectMembers.map((member) => (
                  <div key={member.name} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#123f40] text-white">{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.presence}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-[#e76f51]" />
                  Activity feed
                </CardTitle>
                <CardDescription>Important changes happening without needing to refresh the page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectActivity.map((item) => (
                  <div key={item} className="rounded-2xl border border-border/60 bg-[#f7f4ef] px-4 py-3 text-sm leading-6 text-slate-700">
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FolderKanban className="h-5 w-5 text-[#0f766e]" />
                  Invite collaborators
                </CardTitle>
                <CardDescription>Add others to the project worklog and define their roles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <Input
                  placeholder="Enter email, username, or team name"
                  defaultValue="finance-ops-payroll@nebwork.id"
                  className="h-11 rounded-2xl bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full bg-[#0f766e] hover:bg-[#0c5d57]">Invite as Editor</Button>
                  <Button variant="outline" className="rounded-full">Invite as Commenter</Button>
                  <Button variant="outline" className="rounded-full">Invite as Viewer</Button>
                </div>
                {inviteSuggestions.map((item) => (
                  <div key={item.value} className="rounded-2xl border border-border/60 bg-white px-4 py-3">
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.value}</p>
                  </div>
                ))}
                {activeInvites.map((invite) => (
                  <div key={invite.name} className="rounded-2xl border border-dashed border-border/70 bg-[#f7f4ef] px-4 py-3">
                    <p className="font-medium text-slate-900">{invite.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{`${invite.role} - ${invite.channel}`}</p>
                  </div>
                ))}
                {collaborationGuide.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-border/60 bg-white px-4 py-3">
                    <p className="font-medium text-slate-900">{`Step ${index + 1}`}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step}</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full rounded-2xl">
                  <WandSparkles className="h-4 w-4" />
                  Open permission setup
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
