import { useEffect, useMemo, useState } from "react";
import { FileText, Filter, Plus, Search, Users2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { WORKLOG_ENDPOINTS } from "@/config/api";
import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          scope: "mine",
          limit: "50",
        });

        if (searchValue.trim()) {
          params.set("search", searchValue.trim());
        }

        const response = await fetch(`${WORKLOG_ENDPOINTS.LIST}?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load worklogs");
        }

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
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [navigate, searchValue]);

  const stats = useMemo(() => {
    const total = worklogs.length;
    const published = worklogs.filter((worklog) => worklog.status === "published").length;
    const draft = worklogs.filter((worklog) => worklog.status !== "published").length;
    const collaborative = worklogs.filter((worklog) => (worklog.collaboratorDetails || []).length > 0).length;

    return [
      {
        label: "Total worklogs",
        value: total,
        detail: "All work documents you've created or own.",
      },
      {
        label: "Published",
        value: published,
        detail: "Documents already appearing in the team's knowledge feed.",
      },
      {
        label: "Drafts",
        value: draft,
        detail: "Worklogs you can still continue before publishing.",
      },
      {
        label: "Collaborative",
        value: collaborative,
        detail: "Worklogs currently being worked on with other collaborators.",
      },
    ];
  }, [worklogs]);

  const visibleWorklogs = useMemo(() => {
    return worklogs.filter((worklog) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Collaborative") {
        return (worklog.collaboratorDetails || []).length > 0;
      }

      return formatStatusLabel(worklog.status) === activeFilter;
    });
  }, [activeFilter, worklogs]);

  return (
    <AppShell
      title="My Worklogs"
      description="A place for all the worklogs you've ever created, from drafts to published collaborative documents."
      actions={
        <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
          <Link to="/worklog/new">
            <Plus className="h-4 w-4" />
            Create worklog
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
                <CardTitle className="text-3xl text-slate-900">{item.value}</CardTitle>
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
                  className={filter === activeFilter ? "rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]" : "rounded-full"}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
              <Button size="sm" variant="ghost" className="rounded-full">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="bg-white/[0.9]">
            <CardContent className="p-6 text-sm text-slate-500">Loading your worklogs...</CardContent>
          </Card>
        ) : null}

        {!isLoading && visibleWorklogs.length === 0 ? (
          <Card className="bg-white/[0.9]">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#eff6ff] text-[#2563eb]">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-display text-2xl text-slate-900">No worklogs found in this view</p>
                <p className="text-sm text-slate-500">
                  Start a new document or change filters to see your drafts and published worklogs.
                </p>
              </div>
              <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
                <Link to="/worklog/new">Create your first worklog</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-5">
          {visibleWorklogs.map((item) => (
            <Card key={item.id} className="bg-white/[0.9]">
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.status === "published" ? "secondary" : "outline"}>
                        {formatStatusLabel(item.status)}
                      </Badge>
                      <Badge variant="outline">{formatPrivacyLabel(item.privacyLevel)}</Badge>
                    </div>
                    <h2 className="font-display text-2xl text-slate-900">{item.title}</h2>
                    <p className="text-sm text-slate-500">
                      {(item.project || "No project yet")} - {formatUpdatedAt(item.updatedAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="rounded-2xl">
                      <Link to={`/worklog/${item.id}`}>Open</Link>
                    </Button>
                    <Button asChild className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
                      <Link to={`/worklog/${item.id}`}>Continue editing</Link>
                    </Button>
                  </div>
                </div>

                <p className="max-w-4xl text-sm leading-7 text-slate-600">
                  {item.excerpt || "No content summary for this worklog yet."}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {(item.tag || []).map((tag) => (
                      <Badge key={`${item.id}-${tag}`} variant="soft">{withHash(tag)}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users2 className="h-4 w-4" />
                    {(item.collaboratorDetails || []).length ? (
                      <span>
                        {`Collaborators: ${item.collaboratorDetails.map((collaborator) => collaborator.name).join(", ")}`}
                      </span>
                    ) : (
                      <span>Solo worklog</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/[0.88]">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl text-slate-900">All worklogs are saved here</p>
                <p className="text-sm text-slate-500">
                  Personal drafts, published worklogs, and collaborative documents are now connected directly to the backend.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/worklog/new">Create another worklog</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
