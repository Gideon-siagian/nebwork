import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from "recharts";
import { AppShell } from "@/components/nebwork/app-shell-v2";
import { WORKLOG_ENDPOINTS } from "@/config/api";
import { ChevronLeft, BarChart2, Flame, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ── Color palette (purple tones matching website) ──────────────────────────────
const PALETTE = [
  "#2563eb", // blue-600
  "#3b82f6", // blue-500
  "#7c3aed", // violet-600
  "#8b5cf6", // violet-500
  "#a78bfa", // violet-400
];

// ── Custom tooltip for BarChart ───────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-2 text-xs text-foreground shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      <p>{payload[0].value} worklog{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <Card className="flex items-center gap-4 flex-1 min-w-[160px]">
    <CardContent className="flex items-center gap-4 p-6">
      <div
        className="p-3 rounded-lg flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const NebworkStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch stats
    fetch(WORKLOG_ENDPOINTS.MY_STATS, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(r => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <AppShell title="Stats" description="Loading your statistics...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">
            <div className="h-8 w-8 border-4 border-muted border-t-primary rounded-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Your Activity Stats"
      description="Personal worklog overview and insights"
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {stats && (
          <>
            {/* ── Stat Cards ── */}
            <div className="flex flex-wrap gap-4">
              <StatCard
                icon={FileText}
                label="Total Worklogs"
                value={stats.total}
                sub="all time"
                color="#2563eb"
              />
              <StatCard
                icon={Flame}
                label="Current Streak"
                value={`${stats.streak}d`}
                sub={stats.streak === 0 ? "start writing today!" : "consecutive days 🔥"}
                color="#ea580c"
              />
              <StatCard
                icon={BarChart2}
                label="This Week"
                value={stats.dailyCounts?.reduce((s, d) => s + d.count, 0) ?? 0}
                sub="worklogs (last 7 days)"
                color="#8b5cf6"
              />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Bar Chart — daily activity */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">📅 Activity — Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.dailyCounts?.every(d => d.count === 0) ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No worklogs in the past 7 days.<br />Start writing to see your activity!
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.dailyCounts} barSize={32}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={v => v.split(",")[0]} // show only weekday
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.1)" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {stats.dailyCounts.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Pie Chart — top tags */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">🏷️ Top Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  {!stats.topTags?.length ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No tags yet. Add tags to your worklogs to see them here.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={stats.topTags}
                          dataKey="count"
                          nameKey="tag"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={50}
                          paddingAngle={2}
                          label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.topTags.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value} uses`}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Top Tags List ── */}
            {stats.topTags?.length > 0 && (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">🏷️ Tag Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topTags.map((t, i) => {
                      const pct = Math.round((t.count / (stats.topTags[0]?.count || 1)) * 100);
                      return (
                        <div key={t.tag} className="flex items-center gap-3">
                          <span
                            className="text-sm font-semibold min-w-[120px] truncate"
                            style={{ color: PALETTE[i % PALETTE.length] }}
                          >
                            #{t.tag}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-600"
                              style={{
                                width: `${pct}%`,
                                background: PALETTE[i % PALETTE.length]
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground min-w-[48px] text-right">
                            {t.count}x
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};

export default NebworkStats;
