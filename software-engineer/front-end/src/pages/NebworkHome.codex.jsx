import { Filter, Flame, Sparkles, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { WORKLOG_ENDPOINTS } from "@/config/api";
import { AppShell } from "@/components/nebwork/app-shell-v2";
import { FeedCard } from "@/components/nebwork/feed-card-v2";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { filterChips } from "@/data/nebwork-mock";

const FEED_BUCKETS = ["For You", "Following", "Trending"];

const getInitials = (name = "Nebwork") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const relativeTime = (dateValue) => {
  if (!dateValue) return "Baru saja";

  const now = Date.now();
  const diffInMinutes = Math.max(1, Math.floor((now - new Date(dateValue).getTime()) / 60000));

  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
  return `${Math.floor(diffInMinutes / 1440)} hari lalu`;
};

const formatPrivacyLabel = (privacyLevel) => {
  const normalized = String(privacyLevel || "team").toLowerCase();
  if (normalized === "team") return "Team Only";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const withHash = (tag) => (String(tag || "").startsWith("#") ? tag : `#${tag}`);

export default function NebworkHome() {
  const [activeBucket, setActiveBucket] = useState("For You");
  const [searchValue, setSearchValue] = useState("");
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          scope: "feed",
          status: "published",
          limit: "30",
        });

        if (searchValue.trim()) {
          params.set("search", searchValue.trim());
        }

        if (activeBucket === "Trending") {
          params.set("sort", "trending");
        }

        const response = await fetch(`${WORKLOG_ENDPOINTS.LIST}?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load home feed");
        }

        setFeed(data.worklogs || []);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message || "Failed to load home feed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [activeBucket, searchValue]);

  const visibleFeed = useMemo(() => {
    const mapped = feed.map((item) => ({
      id: item.id,
      href: `/worklog/${item.id}`,
      team: item.department || item.author?.division || "Nebwork",
      privacy: formatPrivacyLabel(item.privacyLevel),
      publishedAgo: relativeTime(item.publishedAt || item.updatedAt || item.createdAt),
      title: item.title,
      excerpt: item.summary || item.excerpt || "Belum ada ringkasan worklog.",
      tags: (item.tag || []).slice(0, 4).map(withHash),
      initials: getInitials(item.author?.name || "Nebwork"),
      author: item.author?.name || "Unknown author",
      role: item.author?.division || item.department || "Nebwork team",
      project: item.project || "General worklog",
      metrics: {
        views: item.metrics?.views || 0,
        comments: item.metrics?.comments || 0,
        likes: item.metrics?.likes || 0,
      },
      isCollaborative: (item.collaboratorDetails || []).length > 0,
    }));

    if (activeBucket === "Following") {
      const collaborativeOnly = mapped.filter((item) => item.isCollaborative);
      return collaborativeOnly.length > 0 ? collaborativeOnly : mapped;
    }

    if (activeBucket === "Trending") {
      return [...mapped].sort((left, right) => {
        const leftScore = left.metrics.likes + left.metrics.comments + left.metrics.views;
        const rightScore = right.metrics.likes + right.metrics.comments + right.metrics.views;
        return rightScore - leftScore;
      });
    }

    return mapped;
  }, [activeBucket, feed]);

  const trendingTopics = useMemo(() => {
    const tagCounts = {};
    feed.forEach((item) => {
      (item.tag || []).forEach((tag) => {
        const key = withHash(tag);
        tagCounts[key] = (tagCounts[key] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([label, volume]) => ({ label, volume: `${volume} worklogs` }));
  }, [feed]);

  const topContributors = useMemo(() => {
    const grouped = {};
    feed.forEach((item) => {
      const authorName = item.author?.name || "Unknown author";
      grouped[authorName] = grouped[authorName] || {
        name: authorName,
        initials: getInitials(authorName),
        role: item.author?.division || item.department || "Nebwork team",
        streak: 0,
      };
      grouped[authorName].streak += 1;
    });

    return Object.values(grouped)
      .sort((left, right) => right.streak - left.streak)
      .slice(0, 5)
      .map((person) => ({
        ...person,
        streak: `${person.streak} posts`,
      }));
  }, [feed]);

  return (
    <AppShell
      title="Knowledge feed"
      description="Feed sosial untuk worklog terpublikasi, discovery cepat, dan transfer pengetahuan lintas tim."
      actions={
        <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
          <Link to="/worklog/new">Create worklog</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="sticky top-[118px] z-20 border-white/60 bg-white/88 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3">
              <Sparkles className="h-4 w-4 text-[#2563eb]" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-auto border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
                placeholder="Cari worklog, tag, atau author yang relevan..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FEED_BUCKETS.map((bucket) => (
                <Button
                  key={bucket}
                  size="sm"
                  variant={bucket === activeBucket ? "default" : "outline"}
                  className={bucket === activeBucket ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" : "rounded-full"}
                  onClick={() => setActiveBucket(bucket)}
                >
                  {bucket}
                </Button>
              ))}
              <Button size="sm" variant="ghost" className="rounded-full">
                <Filter className="h-4 w-4" />
                Advanced filters
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearchValue(chip)}
                  className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="space-y-5">
            {isLoading ? (
              <Card className="bg-white/[0.9]">
                <CardContent className="p-6 text-sm text-slate-500">Loading published worklogs...</CardContent>
              </Card>
            ) : null}

            {!isLoading && visibleFeed.length === 0 ? (
              <Card className="bg-white/[0.9]">
                <CardContent className="p-6 text-sm text-slate-500">
                  Belum ada worklog published yang cocok dengan pencarian ini.
                </CardContent>
              </Card>
            ) : null}

            {visibleFeed.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>

          <div className="space-y-5">
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Flame className="h-5 w-5 text-[#2563eb]" />
                  Trending topics
                </CardTitle>
                <CardDescription>Topik dengan engagement tertinggi dari worklog yang sudah terpublish.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.length === 0 ? (
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
                    Belum ada topic yang cukup data.
                  </div>
                ) : trendingTopics.map((topic) => (
                  <div key={topic.label} className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <span className="font-medium text-slate-800">{topic.label}</span>
                    <span className="text-xs text-slate-500">{topic.volume}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users2 className="h-5 w-5 text-[#2563eb]" />
                  Top contributors
                </CardTitle>
                <CardDescription>Kontributor yang paling konsisten mendokumentasikan knowledge kritis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topContributors.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                    Belum ada contributor yang tampil di feed.
                  </div>
                ) : topContributors.map((person) => (
                  <div key={person.name} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white">{person.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{person.name}</p>
                        <p className="text-xs text-slate-500">{person.role}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{person.streak}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
