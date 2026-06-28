"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@components/auth/AuthCard";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import api from "@lib/api";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const initialEmail = searchParams.get("email") || "your email";
  const phone = searchParams.get("phone") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // Start with 60s cooldown

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // decrement timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Missing user session ID. Please try signing up again.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/verify-email", {
        userId,
        otp: otp.trim(),
      });

      setSuccess("Email verified successfully! Redirecting you to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.warn("Email verification failed:", err.message || err);
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) return;
    setError("");
    setSuccess("");
    setResending(true);

    try {
      await api.post("/auth/resend-verification", {
        userId,
        type: "EMAIL",
      });
      setSuccess("A new verification code has been sent!");
      setResendCooldown(60); // 60s time delay to resend OTP
    } catch (err: any) {
      console.warn("Resend email code failed:", err.message || err);
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl border border-green-500/20 bg-green-500/10 text-sm text-green-400 font-medium">
          {success}
        </div>
      )}

      <div className="space-y-2 text-center mb-2">
        <p className="text-sm text-zinc-400">
          We have sent a 6-digit verification code to
          <br />
          <strong className="text-zinc-200">{initialEmail}</strong>
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">
          Verification Code
        </label>
        <Input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="text-center text-2xl tracking-[0.5em] font-bold"
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" variant="shimmer" className="w-full mt-2 py-3" disabled={loading || !!success}>
        {loading ? "Verifying..." : "Verify Code"}
      </Button>

      <div className="flex flex-col items-center gap-4 mt-6 text-sm text-zinc-500">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0 || !userId}
          className="text-brand-primary hover:text-brand-hover font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {resending
            ? "Resending..."
            : resendCooldown > 0
            ? `Resend code in ${formatDuration(resendCooldown)}`
            : "Resend Code"}
        </button>

        <p className="text-xs text-zinc-400 -mt-2">
          OTP is valid for 3 minutes.
        </p>

        <Link href="/login" className="hover:text-zinc-300 transition-colors">
          Back to Login
        </Link>
      </div>
    </form>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Verify Email" subtitle="Enter your 6-digit confirmation code">
      <Suspense fallback={<div className="text-center text-zinc-400">Loading params...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  );
}
