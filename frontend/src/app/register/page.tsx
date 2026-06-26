"use client";

// =============================================================================
// Voter Registration Page — /register
// =============================================================================

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI, ApiRequestError } from "@/lib/api";
import Link from "next/link";

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
}

export default function VoterRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError("Password must contain at least one letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await fetchAPI<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      // Redirect to login page with success message
      router.push("/login?registered=true");
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl shadow-2xl shadow-indigo-500/20 sm:h-20 sm:w-20 sm:text-4xl">
            🗳️
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            VoteSecure
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Create your account to participate in elections
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm sm:max-w-md sm:p-8 dark:border-slate-700/50 dark:bg-slate-800/70 dark:shadow-none">
          <h2 className="mb-6 text-center text-lg font-semibold text-slate-900 dark:text-white">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                minLength={6}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-500 hover:underline">
            Sign in →
          </Link>
        </p>

        {/* Admin link */}
        <p className="mt-2 text-center text-xs text-slate-400">
          Election administrator?{" "}
          <Link href="/admin/login" className="text-indigo-500 hover:underline">
            Access admin portal →
          </Link>
        </p>
      </div>
    </div>
  );
}
