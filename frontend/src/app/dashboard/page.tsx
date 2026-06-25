"use client";

// =============================================================================
// Voter Dashboard — /dashboard
// Lists elections split into "Available to Vote" and "Completed / Past"
// =============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI, ApiRequestError } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { ElectionStatus } from "@/lib/types";

interface VoterElection {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: ElectionStatus;
  candidates: { id: string; name: string; description: string | null }[];
  hasVoted: boolean;
}

export default function VoterDashboardPage() {
  const [elections, setElections] = useState<VoterElection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAPI<{ elections: VoterElection[] }>("/elections")
      .then((data) => setElections(data.elections))
      .catch((err) => {
        if (err instanceof ApiRequestError) setError(err.message);
        else setError("Failed to load elections.");
      })
      .finally(() => setLoading(false));
  }, []);

  const available = elections.filter(
    (e) => e.status === ElectionStatus.ACTIVE && !e.hasVoted
  );
  const past = elections.filter(
    (e) => e.status === ElectionStatus.COMPLETED || e.hasVoted
  );
  const upcoming = elections.filter(
    (e) => e.status === ElectionStatus.UPCOMING && !e.hasVoted
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          My Elections
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your registered elections and voting status
        </p>
      </div>

      {/* Empty State */}
      {elections.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <span className="mb-3 text-5xl">📭</span>
          <p className="text-base font-semibold text-slate-500">No elections found</p>
          <p className="mt-1 text-sm text-slate-400">
            You haven&apos;t been registered for any elections yet
          </p>
        </div>
      )}

      {/* Available to Vote */}
      {available.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs dark:bg-emerald-900/30">
              🟢
            </span>
            Available to Vote
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {available.length}
            </span>
          </h2>
          <div className="space-y-3">
            {available.map((el) => (
              <ElectionRow key={el.id} election={el} actionType="vote" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs dark:bg-amber-900/30">
              🕐
            </span>
            Upcoming Elections
          </h2>
          <div className="space-y-3">
            {upcoming.map((el) => (
              <ElectionRow key={el.id} election={el} actionType="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Completed / Voted */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs dark:bg-slate-700">
              ✅
            </span>
            Completed / Voted
          </h2>
          <div className="space-y-3">
            {past.map((el) => (
              <ElectionRow key={el.id} election={el} actionType="done" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// =============================================================================
// ElectionRow — Single election card (mobile-friendly)
// =============================================================================
function ElectionRow({
  election,
  actionType,
}: {
  election: VoterElection;
  actionType: "vote" | "upcoming" | "done";
}) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {election.title}
            </h3>
            <StatusBadge status={election.status} />
          </div>
          <p className="text-xs text-slate-500">
            {formatDate(election.startTime)} → {formatDate(election.endTime)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {election.candidates.length} candidate
            {election.candidates.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {actionType === "vote" && (
            <Link
              href={`/vote/${election.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:shadow-indigo-500/30 sm:w-auto"
            >
              🗳️ Vote Now
            </Link>
          )}
          {actionType === "upcoming" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              🕐 Not yet open
            </span>
          )}
          {actionType === "done" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              {election.hasVoted ? "✓ You voted" : "Election ended"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
