import { Calendar as CalendarIcon, Filter, Flame, Sparkles, Tags, Users2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";

import { WORKLOG_ENDPOINTS } from "@/config/api";
import { AppShell } from "@/components/nebwork/app-shell-v2";
import { FeedCard } from "@/components/nebwork/feed-card-v2";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  if (!dateValue) return "Just now";

  const now = Date.now();
  const diffInMinutes = Math.max(1, Math.floor((now - new Date(dateValue).getTime()) / 60000));

  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return `${Math.floor(diffInMinutes / 1440)} days ago`;
};

const formatPrivacyLabel = (privacyLevel) => {
  const normalized = String(privacyLevel || "team").toLowerCase();
  if (normalized === "team") return "Team Only";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const withHash = (tag) => (String(tag || "").startsWith("#") ? tag : `#${tag}`);

export default function NebworkHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const externalSearch = searchParams.get("search") || "";
  const [activeBucket, setActiveBucket] = useState("For You");
  const [searchValue, setSearchValue] = useState(externalSearch);
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const isInitialMount = useRef(true);

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    dateFrom: "",
    dateTo: "",
    tags: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: "",
    dateTo: "",
    tags: "",
  });

  useEffect(() => {
    if (externalSearch !== searchValue) {
      setSearchValue(externalSearch);
    }
  }, [externalSearch]);

  useEffect(() => {
    if (searchValue === externalSearch) return;

    const nextParams = new URLSearchParams(searchParams);
    if (searchValue.trim()) {
      nextParams.set("search", searchValue.trim());
    } else {
      nextParams.delete("search");
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchValue]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const controller = new AbortController();
    
    const performFetch = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          scope: "feed",
          status: "published",
          limit: "30",
        });

        if (searchValue.trim()) params.set("search", searchValue.trim());
        if (activeBucket === "Trending") params.set("sort", "trending");
        
        // Apply Advanced Filters
        if (appliedFilters.dateFrom) params.set("from", appliedFilters.dateFrom);
        if (appliedFilters.dateTo) params.set("to", appliedFilters.dateTo);
        if (appliedFilters.tags) params.set("tag", appliedFilters.tags);

        const response = await fetch(`${WORKLOG_ENDPOINTS.LIST}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load home feed");

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
    };

    if (isInitialMount.current) {
      performFetch();
      isInitialMount.current = false;
    } else {
      const timeout = setTimeout(performFetch, 400);
      return () => {
        controller.abort();
        clearTimeout(timeout);
      };
    }

    return () => controller.abort();
  }, [activeBucket, searchValue, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    const reset = { dateFrom: "", dateTo: "", tags: "" };
    setTempFilters(reset);
    setAppliedFilters(reset);
    setIsFilterOpen(false);
  };

  const activeFiltersCount = Object.values(appliedFilters).filter(Boolean).length;

  const visibleFeed = useMemo(() => {
    const mapped = feed.map((item) => ({
      id: item.id,
      href: `/worklog/${item.id}`,
      team: item.department || item.author?.division || "Nebwork",
      privacy: formatPrivacyLabel(item.privacyLevel),
      publishedAgo: relativeTime(item.publishedAt || item.updatedAt || item.createdAt),
      title: item.title,
      excerpt: item.summary || item.excerpt || "No worklog summary available.",
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
      description="Social feed for published worklogs, fast discovery, and cross-team knowledge transfer."
      actions={
        <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
          <Link to="/worklog/new">Create worklog</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="sticky top-[118px] z-20 border-border/70 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.25)]">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-end">
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
              
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant={activeFiltersCount > 0 ? "secondary" : "ghost"} className="rounded-full relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[24px]">
                  <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                    <DialogDescription>
                      Filter worklogs by date range and specific tags for more precise results.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" /> Date Range
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">From</span>
                          <Input 
                            type="date" 
                            value={tempFilters.dateFrom} 
                            onChange={(e) => setTempFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">To</span>
                          <Input 
                            type="date" 
                            value={tempFilters.dateTo} 
                            onChange={(e) => setTempFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Tags className="h-4 w-4 text-teal-500" /> Specific Tags
                      </Label>
                      <Input 
                        placeholder="e.g. #engineering, #handover" 
                        value={tempFilters.tags}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, tags: e.target.value }))}
                        className="rounded-xl"
                      />
                      <p className="text-[10px] text-slate-500 italic">Separate tags with commas</p>
                    </div>
                  </div>
                  <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="ghost" onClick={handleResetFilters} className="rounded-xl text-slate-500">
                      Reset All
                    </Button>
                    <Button onClick={handleApplyFilters} className="rounded-xl bg-blue-600">
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
            {appliedFilters.dateFrom && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                From: {appliedFilters.dateFrom}
                <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setAppliedFilters(p => ({ ...p, dateFrom: "" }))} />
              </Badge>
            )}
            {appliedFilters.dateTo && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                To: {appliedFilters.dateTo}
                <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setAppliedFilters(p => ({ ...p, dateTo: "" }))} />
              </Badge>
            )}
            {appliedFilters.tags && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 bg-teal-50 text-teal-700 border-teal-100">
                Tags: {appliedFilters.tags}
                <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => setAppliedFilters(p => ({ ...p, tags: "" }))} />
              </Badge>
            )}
          </div>
        )}

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
          <div className="space-y-5">
            {isLoading ? (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/60 bg-white/60">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {visibleFeed.length === 0 ? (
                  <Card className="bg-white/[0.9]">
                    <CardContent className="p-6 text-sm text-slate-500">
                      No published worklogs found for this search/filter.
                    </CardContent>
                  </Card>
                ) : (
                  visibleFeed.map((item) => (
                    <FeedCard key={item.id} item={item} />
                  ))
                )}
              </>
            )}
          </div>

          <div className="space-y-5">
            <Card className="bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Flame className="h-5 w-5 text-[#2563eb]" />
                  Trending topics
                </CardTitle>
                <CardDescription>Topics with the highest engagement from published worklogs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-2xl" />)
                ) : trendingTopics.length === 0 ? (
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-slate-500">
                    Insufficient data for topics.
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
                <CardDescription>Contributors who consistently document critical knowledge.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : topContributors.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                    No contributors shown in the feed yet.
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
