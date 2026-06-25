"use client";

// =============================================================================
// Election Creator Form — /admin/dashboard/new
// =============================================================================

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI, ApiRequestError } from "@/lib/api";

export default function NewElectionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!title.trim()) return "Election title is required.";
    if (!startTime) return "Start date/time is required.";
    if (!endTime) return "End date/time is required.";
    if (new Date(endTime) <= new Date(startTime)) {
      return "End date must be after the start date.";
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await fetchAPI("/elections", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });
      router.push("/admin/dashboard");
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Failed to create election.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create New Election
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up a new election with a title and voting window
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Election Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Student Council President 2026"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            />
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startTime"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Start Date & Time
              </label>
              <input
                id="startTime"
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                End Date & Time
              </label>
              <input
                id="endTime"
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {/* Validation hint */}
          {startTime && endTime && new Date(endTime) <= new Date(startTime) && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ End date must be after the start date
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "🗳️ Create Election"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
