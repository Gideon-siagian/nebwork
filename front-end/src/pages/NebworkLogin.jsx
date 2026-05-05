import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, ChevronLeft, Clock, KeyRound, LoaderCircle, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AUTH_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NebworkLogin() {
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState("admin@nebwork.id");
  const [password, setPassword] = useState("Nebwork123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password state
  const [view, setView] = useState("login"); // login | request | waiting | set-password | success
  const [forgotEmail, setForgotEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" }); // type: info | error | success

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) { navigate("/"); return; }
    const savedId = sessionStorage.getItem("resetRequestId");
    if (savedId) {
      setRequestId(savedId);
      setView("waiting");
    }
  }, [navigate]);

  const clearError = () => { setError(""); setStatusMsg({ text: "", type: "" }); };

  const goToLogin = () => {
    setView("login");
    clearError();
    setForgotEmail("");
    setRequestId("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // === Login ===
  const handleLogin = async (event) => {
    event.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      sessionStorage.setItem("token", data.token || "");
      if (data.user) sessionStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Forgot Password - Submit Request ===
  const handleRequestReset = async (event) => {
    event.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      const res = await fetch(AUTH_ENDPOINTS.REQUEST_RESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit request");
      const id = String(data.requestId);
      setRequestId(id);
      sessionStorage.setItem("resetRequestId", id);
      setView("waiting");
    } catch (err) {
      setError(err.message || "Failed to submit reset request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Check Approval Status ===
  const handleCheckStatus = async () => {
    if (!requestId) return;
    setIsSubmitting(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await fetch(AUTH_ENDPOINTS.RESET_STATUS(requestId));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to check status");

      if (data.status === "approved") {
        setResetToken(data.resetToken);
        sessionStorage.removeItem("resetRequestId");
        setView("set-password");
      } else if (data.status === "rejected") {
        sessionStorage.removeItem("resetRequestId");
        setStatusMsg({ text: "Your request was rejected by the admin.", type: "error" });
      } else if (data.status === "expired") {
        sessionStorage.removeItem("resetRequestId");
        setStatusMsg({ text: "Reset token has expired. Please submit a new request.", type: "error" });
      } else {
        setStatusMsg({ text: "Your request is still waiting for admin approval.", type: "info" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to check status", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // === Set New Password ===
  const handleSetPassword = async (event) => {
    event.preventDefault();
    clearError();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setView("success");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCard = () => {
    // ── Login ──────────────────────────────────────────────────
    if (view === "login") {
      return (
        <>
          <div className="space-y-2">
            <h2 className="font-display text-3xl text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500">Sign in with a Nebwork backend account to experience real worklogs and the AI assistant.</p>
          </div>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Work email</p>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-2xl bg-white" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">Password</p>
                <button
                  type="button"
                  onClick={() => { clearError(); setView("request"); }}
                  className="text-xs text-[#2563eb] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-2xl bg-white" />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Enter Nebwork
            </Button>
          </form>
        </>
      );
    }

    // ── Request Reset ──────────────────────────────────────────
    if (view === "request") {
      return (
        <>
          <button type="button" onClick={goToLogin} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> Back to sign in
          </button>
          <div className="space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
              <KeyRound className="h-5 w-5 text-[#2563eb]" />
            </div>
            <h2 className="font-display text-3xl text-slate-900">Forgot password?</h2>
            <p className="text-sm text-slate-500">Enter your work email and an admin will review your reset request.</p>
          </div>
          <form className="space-y-4" onSubmit={handleRequestReset}>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Work email</p>
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@nebwork.id"
                className="h-11 rounded-2xl bg-white"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting || !forgotEmail} className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Send reset request
            </Button>
          </form>
        </>
      );
    }

    // ── Waiting for Approval ───────────────────────────────────
    if (view === "waiting") {
      return (
        <>
          <div className="space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="font-display text-3xl text-slate-900">Waiting for approval</h2>
            <p className="text-sm text-slate-500">
              Your password reset request has been sent to the admin. Click the button below to check if it has been approved.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white px-4 py-3 text-sm text-slate-600">
            Request ID: <span className="font-mono text-xs text-slate-400">{requestId}</span>
          </div>

          {statusMsg.text ? (
            <div className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${
              statusMsg.type === "error" ? "bg-red-50 text-red-700" :
              statusMsg.type === "success" ? "bg-green-50 text-green-700" :
              "bg-blue-50 text-blue-700"
            }`}>
              {statusMsg.type === "error" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> :
               statusMsg.type === "success" ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> :
               <Clock className="mt-0.5 h-4 w-4 shrink-0" />}
              {statusMsg.text}
            </div>
          ) : null}

          <div className="space-y-2">
            <Button onClick={handleCheckStatus} disabled={isSubmitting} className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Check approval status
            </Button>
            <Button variant="outline" onClick={goToLogin} className="h-11 w-full rounded-2xl">
              Back to sign in
            </Button>
          </div>
        </>
      );
    }

    // ── Set New Password ───────────────────────────────────────
    if (view === "set-password") {
      return (
        <>
          <div className="space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="font-display text-3xl text-slate-900">Set new password</h2>
            <p className="text-sm text-slate-500">Your request was approved. Create a new password for your account.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSetPassword}>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">New password</p>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="h-11 rounded-2xl bg-white" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Confirm password</p>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="h-11 rounded-2xl bg-white" />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting || !newPassword || !confirmPassword} className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset password
            </Button>
          </form>
        </>
      );
    }

    // ── Success ────────────────────────────────────────────────
    if (view === "success") {
      return (
        <>
          <div className="space-y-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="font-display text-3xl text-slate-900">Password reset!</h2>
            <p className="text-sm text-slate-500">Your password has been updated successfully. You can now sign in with your new password.</p>
          </div>
          <Button onClick={goToLogin} className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]">
            <ArrowRight className="h-4 w-4" />
            Sign in
          </Button>
        </>
      );
    }

    return null;
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
            {renderCard()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
