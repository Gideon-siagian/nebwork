import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AUTH_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NebworkLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@nebwork.id");
  const [password, setPassword] = useState("Nebwork123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      sessionStorage.setItem("token", data.token || "");
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/");
    } catch (submitError) {
      setError(submitError.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_44%,#eef4ff_100%)] px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white shadow-lg shadow-[#2563eb]/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2563eb]">Nebwork</p>
            <h1 className="font-display text-5xl leading-tight text-slate-900">
              Welcome back to your knowledge workspace.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Sign back in to open worklogs, continue team documentation, and keep company knowledge alive.
            </p>
          </div>
        </div>

        <Card className="border-white/60 bg-white/88 shadow-[0_32px_90px_-50px_rgba(37,99,235,0.25)] backdrop-blur-xl">
          <CardContent className="space-y-5 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500">Sign in with a Nebwork backend account to experience real worklogs and the AI assistant.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Work email</p>
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Password</p>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-2xl bg-white"
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Enter Nebwork
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
