import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BrainCircuit, LineChart, Wallet } from "lucide-react";

import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adoptionTrend,
  analyticsNotes,
  analyticsSummary,
  roiTrend,
} from "@/data/nebwork-mock";

export default function NebworkAnalytics() {
  return (
    <AppShell
      title="Impact analytics"
      description="KPI dashboard for adoption, knowledge retention, AI usage, and ROI estimation for turnover reduction."
      actions={<Button className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">Export executive snapshot</Button>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsSummary.map((item) => (
            <Card key={item.label} className="bg-white/80">
              <CardHeader className="pb-3">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card className="bg-white/[0.85]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <LineChart className="h-5 w-5 text-[#2563eb]" />
                    Adoption curve
                  </CardTitle>
                  <CardDescription>Growth of monthly active authors vs. active readers.</CardDescription>
                </div>
                <Badge variant="secondary">MAU target 70%</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adoptionTrend}>
                  <defs>
                    <linearGradient id="authors" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="readers" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d8" />
                  <XAxis dataKey="month" stroke="#7a756d" />
                  <YAxis stroke="#7a756d" />
                  <Tooltip />
                  <Area type="monotone" dataKey="authors" stroke="#0f172a" fill="url(#authors)" strokeWidth={3} />
                  <Area type="monotone" dataKey="readers" stroke="#2563eb" fill="url(#readers)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.85]">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Wallet className="h-5 w-5 text-[#2563eb]" />
                    ROI projection
                  </CardTitle>
                  <CardDescription>Estimated turnover cost savings per quarter.</CardDescription>
                </div>
                <Badge variant="accent">IDR millions</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e1d8" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#7a756d" />
                  <YAxis stroke="#7a756d" />
                  <Tooltip />
                  <Bar dataKey="savings" fill="#2563eb" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <Card className="bg-white/[0.85]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BrainCircuit className="h-5 w-5 text-[#2563eb]" />
                What the data says
              </CardTitle>
              <CardDescription>Concise insights ready for executive review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-border/60 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                  {note}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.85]">
            <CardHeader>
              <CardTitle className="text-2xl">Decision support</CardTitle>
              <CardDescription>Actionable open questions from this dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-white p-4">
                <p className="font-semibold text-slate-900">Gamification intensity</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Public leaderboards can increase engagement, but need a toggle to avoid disrupting specific team cultures.
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-white p-4">
                <p className="font-semibold text-slate-900">Pilot team prioritization</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Engineering and Finance Ops show the fastest ROI due to high knowledge concentration and onboarding costs.
                </p>
              </div>
              <Button variant="outline" className="w-full rounded-2xl">
                Open roadmap decision log
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
