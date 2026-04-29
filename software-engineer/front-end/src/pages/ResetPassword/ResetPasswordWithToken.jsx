import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { AUTH_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordWithToken() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Password reset token is missing. Please check your email link.");
      setIsLoading(false);
      return;
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validate form
    if (!formData.password) {
      setError("Password is required");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password reset successfully!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (submitError) {
      setError(submitError.message || "Failed to reset password. Please try again.");
      toast.error(submitError.message || "Failed to reset password");
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
              Set your new password
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Buat password baru yang kuat untuk mengamankan akun Nebwork Anda.
            </p>
          </div>
        </div>

        <Card className="border-white/60 bg-white/88 shadow-[0_32px_90px_-50px_rgba(37,99,235,0.25)] backdrop-blur-xl">
          <CardContent className="space-y-5 p-8">
            {isSuccess ? (
              <div className="space-y-6 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl text-slate-900">Password reset successful!</h2>
                  <p className="text-sm text-slate-600">
                    Password Anda telah direset dengan sukses. Anda akan dialihkan ke halaman login dalam beberapa detik.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="font-display text-3xl text-slate-900">Reset password</h2>
                  <p className="text-sm text-slate-500">Masukkan password baru untuk akun Nebwork Anda.</p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">New password</p>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="h-11 rounded-2xl bg-white"
                      placeholder="At least 8 characters"
                      required
                    />
                    <p className="text-xs text-slate-500">Gunakan kombinasi huruf, angka, dan simbol untuk keamanan lebih baik.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">Confirm password</p>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className="h-11 rounded-2xl bg-white"
                      placeholder="Repeat your password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] hover:bg-[linear-gradient(135deg,#020617_0%,#1d4ed8_100%)]"
                  >
                    {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Reset password
                  </Button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full text-sm text-slate-600 hover:text-slate-900 font-medium py-2"
                  >
                    Back to login
                  </button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
