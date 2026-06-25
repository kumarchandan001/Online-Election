"use client";

// =============================================================================
// Admin Login Page — /admin/login
// =============================================================================

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/api";
import { Role } from "@/lib/types";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { role } = await login(email, password);

      if (role !== Role.ADMIN) {
        setError("Unauthorized: Admin access required. Voters cannot access this panel.");
        localStorage.removeItem("token");
        setSubmitting(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-2xl shadow-indigo-500/25">
            🗳️
          </div>
          <h1 className="text-2xl font-bold text-white">
            Election Admin Portal
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to manage elections
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@election.org"
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure Online Election System · Admin Access Only
        </p>
      </div>
    </div>
  );
}
