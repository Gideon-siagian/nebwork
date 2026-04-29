import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Mail, Sparkles, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AUTH_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function NebworkLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("admin@nebwork.id");
  const [password, setPassword] = useState("Nebwork123!");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Check if there's a password reset token in URL
  useEffect(() => {
    const resetToken = searchParams.get("resetToken");
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`);
    }
  }, [searchParams, navigate]);

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

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setIsForgotSubmitting(true);

    try {
      const response = await fetch(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send password reset email");
      }

      setForgotSuccess(true);
      setForgotEmail("");
      toast.success("Password reset link sent to your email");
    } catch (submitError) {
      toast.error(submitError.message || "Failed to send password reset email");
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_44%,#eef4ff_100%)] px-4 py-10">
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="max-w-md rounded-[28px] border-white/60 bg-white/88 p-0 shadow-[0_32px_90px_-50px_rgba(37,99,235,0.25)]">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="font-display text-2xl text-slate-900">Forgot password?</DialogTitle>
                <DialogDescription>
                  Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
                </DialogDescription>
              </div>
              <button
                onClick={() => setForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-6 py-6">
            {forgotSuccess ? (
              <div className="space-y-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-display text-lg text-slate-900 mb-2">Check your email</p>
                  <p className="text-sm text-slate-600">
                    Kami telah mengirim link untuk mereset password ke email Anda. Silakan cek inbox atau folder spam.
                  </p>
                </div>
                <Button
                  className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setForgotSuccess(false);
                  }}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleForgotPassword}>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">Email address</p>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    className="h-11 rounded-2xl bg-white"
                    placeholder="name@nebwork.id"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-2xl"
                    onClick={() => setForgotPasswordOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isForgotSubmitting}
                    className="h-11 flex-1 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                  >
                    {isForgotSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Send reset link"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
              Masuk kembali untuk membuka worklog, melanjutkan dokumentasi tim, dan menjaga knowledge perusahaan tetap hidup.
            </p>
          </div>
        </div>

        <Card className="border-white/60 bg-white/88 shadow-[0_32px_90px_-50px_rgba(37,99,235,0.25)] backdrop-blur-xl">
          <CardContent className="space-y-5 p-8">
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500">Masuk dengan akun backend Nebwork untuk mencoba worklog dan AI assistant secara nyata.</p>
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
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">Password</p>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
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
