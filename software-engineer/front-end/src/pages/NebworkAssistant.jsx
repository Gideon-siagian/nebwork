import { Bot, Compass, Mic, PenSquare, Plus, Search, Send, Sparkles } from "lucide-react";

import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  assistantInlineCitations,
  assistantMessages,
  assistantPromptChips,
  assistantThreads,
} from "@/data/nebwork-mock";
import { cn } from "@/lib/utils";

export default function NebworkAssistant() {
  return (
    <AppShell
      title="AI assistant"
      description="RAG-powered assistant untuk menjawab pertanyaan, menemukan worklog relevan, dan menunjuk expert yang tepat."
      actions={<Button className="rounded-2xl bg-[#0f766e] hover:bg-[#0c5d57]">Open answer history</Button>}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {assistantStats.map((stat) => (
            <Card key={stat.label} className="bg-white/80">
              <CardHeader className="pb-3">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
          <Card className="bg-white/[0.85]">
            <CardHeader className="border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f766e] text-white">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Ask Nebwork AI</CardTitle>
                  <CardDescription>
                    Jawaban selalu dibangun dari worklog dan komentar yang memang bisa diakses user.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <div className="space-y-4">
                {assistantMessages.map((message, index) => (
                  <div
                    key={`${message.author}-${index}`}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-[28px] px-5 py-4 shadow-sm",
                        message.role === "user"
                          ? "bg-[#123f40] text-white"
                          : "border border-border/60 bg-[#f8faf9] text-slate-800",
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                        <span>{message.author}</span>
                        <span>•</span>
                        <span>{message.time}</span>
                      </div>
                      <p className="leading-7">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-border/60 bg-[#f6fbfa] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-[#0f766e]" />
                  Confidence-aware answer
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  Jika confidence di bawah 50%, assistant akan menyarankan contact expert alih-alih memberi jawaban
                  yang berpotensi salah. Semua query juga tercatat di audit log.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-[28px] border border-border/60 bg-white p-4 sm:flex-row">
                <Input
                  defaultValue="Apa best practice untuk handover project payroll yang sedang aktif?"
                  className="h-12 rounded-2xl border-border/60 bg-transparent"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button className="h-12 rounded-2xl bg-[#0f766e] px-5 hover:bg-[#0c5d57]">
                    <Send className="h-4 w-4" />
                    Ask
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquareText className="h-5 w-5 text-[#0f766e]" />
                  Source-backed answers
                </CardTitle>
                <CardDescription>Combined view untuk jawaban AI dan worklog yang mendasarinya.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assistantSources.map((source) => (
                  <div key={source.title} className="rounded-2xl border border-border/60 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{source.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Author: {source.author}</p>
                      </div>
                      <Badge variant="secondary">{source.confidence}%</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{source.excerpt}</p>
                    <Progress value={source.confidence} className="mt-4 h-2 bg-[#f3ebe1]" indicatorClassName="bg-[#0f766e]" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="text-xl">Related people</CardTitle>
                <CardDescription>Expert yang paling sering muncul di jawaban untuk konteks saat ini.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assistantExperts.map((person) => (
                  <div key={person.name} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#123f40] text-white">{person.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{person.name}</p>
                        <p className="text-xs text-slate-500">{person.role}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{person.specialty}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.85]">
              <CardHeader>
                <CardTitle className="text-xl">Knowledge gaps</CardTitle>
                <CardDescription>Pertanyaan tanpa jawaban kuat yang perlu diprioritaskan tim.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {knowledgeGaps.map((gap) => (
                  <div key={gap} className="rounded-2xl border border-dashed border-[#e76f51]/30 bg-[#fff7f4] px-4 py-3 text-sm leading-6 text-slate-700">
                    {gap}
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
