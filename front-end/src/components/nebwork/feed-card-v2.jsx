import { BookmarkPlus, Eye, Heart, MessageCircle, Share2, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export function FeedCard({ item }) {
  const navigate = useNavigate();

  const handleShare = async () => {
    if (!item.href) return;

    const shareUrl = `${window.location.origin}${item.href}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{item.team}</Badge>
            <Badge variant="outline">{item.privacy}</Badge>
            <span className="text-xs text-muted-foreground">{item.publishedAgo}</span>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Eye className="h-3.5 w-3.5" />
            {item.metrics.views}
          </span>
        </div>

        <div className="space-y-2">
          <Link to={item.href || "#"} className="block">
            <h3 className="font-display text-xl leading-tight text-slate-900 transition hover:text-[#2563eb]">{item.title}</h3>
          </Link>
          <p className="text-sm leading-6 text-slate-600">{item.excerpt}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-border/60">
              <AvatarFallback className="bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white">{item.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.author}</p>
              <p className="text-xs text-slate-500">{`${item.role} - ${item.project}`}</p>
            </div>
          </div>

          {/* Eye icon moved to top right */}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {item.isCollaborative ? "Collaborative" : "Solo worklog"}
            </span>
            <span>{item.project}</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => item.href && navigate(item.href)}>
              <BookmarkPlus className="h-4 w-4" />
              Open
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
