import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Compass, LoaderCircle, Mic, PenSquare, Plus, Search, Send, Sparkles } from "lucide-react";

import { ASSISTANT_ENDPOINTS, AUTH_ENDPOINTS } from "@/config/api";
import { AppShell } from "@/components/nebwork/app-shell-v2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assistantPromptChips } from "@/data/nebwork-mock";
import { cn } from "@/lib/utils";

export default function NebworkAssistantChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [inputValue, setInputValue] = useState("Help me find the most relevant handover worklogs for a new analyst.");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("You");
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const bootstrap = async () => {
      try {
        const profileResponse = await fetch(AUTH_ENDPOINTS.PROFILE, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const profileData = await profileResponse.json();
        if (profileResponse.ok) {
          const profile = profileData.user || profileData;
          setUserName(profile.name || "You");
        }
      } catch (profileError) {
        console.error("Failed to load profile", profileError);
      }

      await loadHistory(token);
    };

    bootstrap();
  }, [navigate]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const historyPreview = useMemo(() => chatHistory.slice(0, 10), [chatHistory]);

  const loadHistory = async (token) => {
    setLoadingHistory(true);

    try {
      const response = await fetch(`${ASSISTANT_ENDPOINTS.GET_HISTORY}?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load chat history");
      }

      setChatHistory(data.chats || []);
    } catch (historyError) {
      console.error(historyError);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSession = async (sessionId) => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(ASSISTANT_ENDPOINTS.GET_MESSAGES(sessionId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load conversation");
      }

      const hydratedMessages = (data.messages || []).flatMap((entry) => [
        {
          role: "user",
          author: userName,
          time: new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: entry.message,
        },
        {
          role: "assistant",
          author: "Nebwork AI",
          time: new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: entry.response,
          contextUsed: entry.context_used,
        },
      ]);

      setCurrentSessionId(sessionId);
      setMessages(hydratedMessages);
    } catch (sessionError) {
      setError(sessionError.message || "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError("");
  };

  const handlePromptClick = (prompt) => {
    setInputValue(prompt);
  };

  const handleSend = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    const askedAt = new Date();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        author: userName,
        time: askedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: question,
      },
    ]);
    setInputValue("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(ASSISTANT_ENDPOINTS.SEND_MESSAGE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: question,
          sessionId: currentSessionId,
          history: messages.slice(-6).map((entry) => ({
            role: entry.role,
            content: entry.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Assistant request failed");
      }

      const nextSessionId = data.sessionId || data.session_id || currentSessionId;
      setCurrentSessionId(nextSessionId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          author: "Nebwork AI",
          time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: data.answer || data.response,
          contextUsed: data.context_logs_count,
          processingTime: data.processing_time,
        },
      ]);

      await loadHistory(token);
    } catch (sendError) {
      setError(sendError.message || "Assistant request failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          author: "Nebwork AI",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: "I can't answer right now. Please try again once the AI backend and worklog data are ready.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell
      title="AI assistant"
      description="Workspace chat to ask questions, search worklogs, and learn from company documentation naturally."
      actions={
        <Button onClick={handleNewChat} className="rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <Card className="h-fit bg-white/[0.88]">
          <CardContent className="space-y-5 p-5">
            <Button onClick={handleNewChat} className="w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
              <PenSquare className="h-4 w-4" />
              Start a new conversation
            </Button>

            <div className="rounded-2xl border border-border/60 bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Compass className="h-4 w-4 text-[#2563eb]" />
                What you can ask
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Search for similar worklogs, request onboarding summaries, or find experts who have handled similar cases.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recent chats</p>
              {loadingHistory ? (
                <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                  Loading chat history...
                </div>
              ) : historyPreview.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-500">
                  No conversations yet.
                </div>
              ) : historyPreview.map((thread) => (
                <button
                  key={thread.session_id}
                  onClick={() => loadSession(thread.session_id)}
                  className="w-full rounded-2xl border border-border/60 bg-white px-4 py-3 text-left transition hover:border-[#2563eb]/30 hover:bg-[#f8fbff]"
                >
                  <p className="text-sm font-medium text-slate-900">{thread.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{thread.last_message}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    {new Date(thread.updated_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white/[0.9]">
          <CardContent className="flex min-h-[720px] flex-col p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl text-slate-900">Nebwork AI</p>
                  <p className="text-sm text-slate-500">Chat-first assistant for knowledge discovery.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {assistantPromptChips.slice(0, 2).map((chip) => (
                  <Badge key={chip} variant="outline" className="rounded-full px-3 py-1.5 text-xs">
                    {chip}
                  </Badge>
                ))}
              </div>
            </div>

            <div ref={scrollAreaRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6 lg:px-8">
              <div className="grid gap-2 md:grid-cols-2">
                {assistantPromptChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handlePromptClick(chip)}
                    className="rounded-2xl border border-border/60 bg-[#f8fbff] px-4 py-4 text-left text-sm text-slate-700 transition hover:border-[#2563eb]/30 hover:bg-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="space-y-4 pt-2">
                {messages.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-border/70 bg-white px-5 py-6 text-sm leading-7 text-slate-500">
                    Start a new conversation to search for worklogs, onboarding guides, or troubleshooting records from your team.
                  </div>
                ) : null}

                {messages.map((message, index) => (
                  <div
                    key={`${message.author}-${index}`}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div className="max-w-[88%] space-y-2">
                      <div
                        className={cn(
                          "rounded-[28px] px-5 py-4 shadow-sm",
                          message.role === "user"
                            ? "bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white"
                            : "border border-border/60 bg-[#f8fbff] text-slate-800",
                        )}
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs opacity-75">
                          <span>{message.author}</span>
                          <span>|</span>
                          <span>{message.time}</span>
                        </div>
                        <p className="leading-7">{message.content}</p>
                      </div>

                      {message.role === "assistant" && (message.contextUsed || message.processingTime) ? (
                        <div className="flex flex-wrap gap-2 px-2">
                          {message.contextUsed ? (
                            <Badge variant="soft" className="rounded-full px-3 py-1.5 text-xs">
                              {`${message.contextUsed} worklogs used`}
                            </Badge>
                          ) : null}
                          {message.processingTime ? (
                            <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs">
                              {message.processingTime}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-[28px] border border-border/60 bg-[#f8fbff] px-5 py-4 text-sm text-slate-600">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Nebwork AI is thinking...
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-border/60 bg-[#fbfdff] px-5 py-5 lg:px-8">
              <div className="rounded-[28px] border border-border/60 bg-white p-3 shadow-sm">
                <Input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  className="h-12 border-none bg-transparent text-base shadow-none focus-visible:ring-0"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5">
                      <Search className="h-3.5 w-3.5" />
                      Search worklogs
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Summarize context
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSend} disabled={isLoading} className="h-11 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] px-5 hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
