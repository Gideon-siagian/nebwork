import { BookmarkPlus, Eye, Heart, MessageCircle, Share2, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneClasses = {
  teal: "from-[#0f766e]/20 via-white to-white",
  amber: "from-[#f59e0b]/20 via-white to-white",
  rose: "from-[#fb7185]/20 via-white to-white",
  sky: "from-[#38bdf8]/20 via-white to-white",
};

export function FeedCard({ item }) {
  return (
    <Card className="overflow-hidden border-border/70 bg-white/90 backdrop-blur">
      <div className={cn("h-28 bg-gradient-to-br", toneClasses[item.tone] || toneClasses.teal)} />
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{item.team}</Badge>
          <Badge variant="outline">{item.privacy}</Badge>
          <span className="text-xs text-muted-foreground">{item.publishedAgo}</span>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-xl leading-tight text-slate-900">{item.title}</h3>
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
              <AvatarFallback className="bg-[#0f766e] text-white">{item.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.author}</p>
              <p className="text-xs text-slate-500">
                {item.role} • {item.project}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {item.metrics.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {item.metrics.comments}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {item.metrics.likes}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Team ready
            </span>
            <span>AI-citable summary tersedia</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="ghost">
              <BookmarkPlus className="h-4 w-4" />
              Save
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
