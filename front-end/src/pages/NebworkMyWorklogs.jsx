import { useEffect, useMemo, useState, useRef } from "react";
import { Trash2, FileText, Filter, Plus, Search, Users2, Calendar as CalendarIcon, Tags, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { WORKLOG_ENDPOINTS } from "@/config/api";
import { AppShell } from "@/components/nebwork/app-shell-v2";
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

const FILTERS = ["All", "Published", "Draft", "Collaborative"];

const formatStatusLabel = (status) => {
  const normalized = String(status || "draft").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatPrivacyLabel = (privacyLevel) => {
  const normalized = String(privacyLevel || "team").toLowerCase();
  if (normalized === "team") return "Team Only";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatUpdatedAt = (dateValue) => {
  if (!dateValue) return "Recently updated";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
};

const withHash = (tag) => (String(tag || "").startsWith("#") ? tag : `#${tag}`);

export default function NebworkMyWorklogs() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchValue, setSearchValue] = useState("");
  const [worklogs, setWorklogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const isInitialMount = useRef(true);

  // Advanced Filter States
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
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const controller = new AbortController();
    
    const performFetch = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          scope: "mine",
          limit: "50",
        });

        if (searchValue.trim()) params.set("search", searchValue.trim());
        
        // Apply Advanced Filters
        if (appliedFilters.dateFrom) params.set("from", appliedFilters.dateFrom);
        if (appliedFilters.dateTo) params.set("to", appliedFilters.dateTo);
        if (appliedFilters.tags) params.set("tag", appliedFilters.tags);

        const response = await fetch(`${WORKLOG_ENDPOINTS.LIST}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load worklogs");

        setWorklogs(data.worklogs || []);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message || "Failed to load worklogs");
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
  }, [navigate, searchValue, appliedFilters]);

  const stats = useMemo(() => {
    const total = worklogs.length;
    const published = worklogs.filter((worklog) => worklog.status === "published").length;
    const draft = worklogs.filter((worklog) => worklog.status !== "published").length;
    const collaborative = worklogs.filter((worklog) => (worklog.collaboratorDetails || []).length > 0).length;

    return [
      { label: "Total worklogs", value: total, detail: "All work documents you've created." },
      { label: "Published", value: published, detail: "Appearing in the team's feed." },
      { label: "Drafts", value: draft, detail: "Ongoing documents not yet published." },
      { label: "Collaborative", value: collaborative, detail: "Worked on with other teammates." },
    ];
  }, [worklogs]);

  const visibleWorklogs = useMemo(() => {
    return worklogs.filter((worklog) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Collaborative") return (worklog.collaboratorDetails || []).length > 0;
      return formatStatusLabel(worklog.status) === activeFilter;
    });
  }, [activeFilter, worklogs]);

  const handleDeleteWorklog = async (worklog) => {
    if (!window.confirm(`Delete "${worklog.title}"? This cannot be undone.`)) return;

    const token = sessionStorage.getItem("token");
    try {
      const response = await fetch(WORKLOG_ENDPOINTS.ONE(worklog.id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete worklog");
      }
      setWorklogs((current) => current.filter((w) => w.id !== worklog.id));
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete worklog");
    }
  };

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

  return (
    <AppShell
      title="My Worklogs"
      description="Manage your drafts, published worklogs, and collaborative documents."
      actions={
        <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)]">
          <Link to="/worklog/new">
            <Plus className="mr-2 h-4 w-4" /> Create worklog
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} className="bg-white/[0.88]">
              <CardHeader className="pb-3">
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl text-slate-900">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : item.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/[0.88]">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563eb]" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-11 w-full rounded-2xl border-border/70 bg-white pl-9"
                placeholder="Search worklog title, tag, or project..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={filter === activeFilter ? "default" : "outline"}
                  className={filter === activeFilter ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)]" : "rounded-full"}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
              
              <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant={activeFiltersCount > 0 ? "secondary" : "ghost"} className="rounded-full relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[24px]">
                  <DialogHeader>
                    <DialogTitle>Filter Worklogs</DialogTitle>
                    <DialogDescription>Apply specific filters to find exactly what you're looking for.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" /> Date Range
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="date" 
                          value={tempFilters.dateFrom} 
                          onChange={(e) => setTempFilters(p => ({ ...p, dateFrom: e.target.value }))}
                          className="rounded-xl"
                        />
                        <Input 
                          type="date" 
                          value={tempFilters.dateTo} 
                          onChange={(e) => setTempFilters(p => ({ ...p, dateTo: e.target.value }))}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Tags className="h-4 w-4 text-teal-500" /> Filter by Tags
                      </Label>
                      <Input 
                        placeholder="e.g. #handover, #onboarding" 
                        value={tempFilters.tags}
                        onChange={(e) => setTempFilters(p => ({ ...p, tags: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="ghost" onClick={handleResetFilters} className="rounded-xl">Reset</Button>
                    <Button onClick={handleApplyFilters} className="rounded-xl bg-blue-600">Apply Filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

        <div className="grid gap-5">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/[0.9]">
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : visibleWorklogs.length === 0 ? (
            <Card className="bg-white/[0.9]">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#eff6ff] text-[#2563eb]">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="font-display text-2xl text-slate-900">No worklogs found</p>
                <p className="text-sm text-slate-500">Try changing your search or filters.</p>
              </CardContent>
            </Card>
          ) : (
            visibleWorklogs.map((item) => (
              <Card key={item.id} className="bg-white/[0.9]">
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.status === "published" ? "secondary" : "outline"}>{formatStatusLabel(item.status)}</Badge>
                        <Badge variant="outline">{formatPrivacyLabel(item.privacyLevel)}</Badge>
                      </div>
                      <h2 className="font-display text-2xl text-slate-900">{item.title}</h2>
                      <p className="text-sm text-slate-500">{(item.project || "No project")} - {formatUpdatedAt(item.updatedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="rounded-2xl"><Link to={`/worklog/${item.id}`}>Open</Link></Button>
                      <Button variant="outline" className="rounded-2xl text-red-600" onClick={() => handleDeleteWorklog(item)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{item.excerpt || "No summary available."}</p>
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
                    {(item.tag || []).map((t) => <Badge key={t} variant="soft">{withHash(t)}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
