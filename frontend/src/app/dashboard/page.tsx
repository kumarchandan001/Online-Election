"use client";

// =============================================================================
// Voter Dashboard — /dashboard
// Premium election dashboard with stats, categorized listings, and rich cards
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-slate-400">Loading your elections...</p>
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
      {/* Hero Header */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-5 shadow-xl shadow-indigo-500/10 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-white sm:text-2xl">
              My Elections
            </h1>
            <p className="mt-1 text-xs text-indigo-200 sm:text-sm">
              View and participate in elections assigned to you
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <StatPill
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              count={available.length}
              label="Active"
            />
            <StatPill
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              count={upcoming.length}
              label="Upcoming"
            />
            <StatPill
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              count={past.length}
              label="Voted"
            />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {elections.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
            <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No elections available</p>
          <p className="mt-1 text-sm text-slate-400">
            Check back later — elections will appear here when available
          </p>
        </div>
      )}

      {/* Available to Vote */}
      {available.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            icon={
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            }
            title="Ready to Vote"
            subtitle="These elections are open — cast your ballot now"
            count={available.length}
            color="emerald"
          />
          <div className="space-y-4">
            {available.map((el) => (
              <ElectionCard key={el.id} election={el} actionType="vote" />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            icon={
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Upcoming Elections"
            subtitle="These elections haven't started yet"
            count={upcoming.length}
            color="amber"
          />
          <div className="space-y-4">
            {upcoming.map((el) => (
              <ElectionCard key={el.id} election={el} actionType="upcoming" />
            ))}
          </div>
        </section>
      )}

      {/* Completed / Voted */}
      {past.length > 0 && (
        <section>
          <SectionHeader
            icon={
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Completed"
            subtitle="Past elections and your voting history"
            count={past.length}
            color="slate"
          />
          <div className="space-y-4">
            {past.map((el) => (
              <ElectionCard key={el.id} election={el} actionType="done" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// =============================================================================
// StatPill — Compact stat inside the hero header
// =============================================================================
function StatPill({
  icon,
  count,
  label,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/25 px-3.5 py-2 backdrop-blur-md">
      <span className="text-white">{icon}</span>
      <div>
        <p className="text-lg font-bold leading-none text-white">{count}</p>
        <p className="text-[10px] font-semibold text-white/80">{label}</p>
      </div>
    </div>
  );
}

// =============================================================================
// SectionHeader — Section divider with icon, title, subtitle, and count badge
// =============================================================================
function SectionHeader({
  icon,
  title,
  subtitle,
  count,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  color: "emerald" | "amber" | "slate";
}) {
  const badgeColors = {
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    slate:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeColors[color]}`}
      >
        {count}
      </span>
    </div>
  );
}

// =============================================================================
// ElectionCard — Rich election card with gradient accent
// =============================================================================
function ElectionCard({
  election,
  actionType,
}: {
  election: VoterElection;
  actionType: "vote" | "upcoming" | "done";
}) {
  const start = new Date(election.startTime);
  const end = new Date(election.endTime);

  function formatDate(date: Date) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Calculate time remaining for active elections
  const now = new Date();
  const msLeft = end.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
  const minsLeft = Math.max(
    0,
    Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))
  );

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      {/* Gradient accent bar */}
      <div
        className={`h-1 ${
          actionType === "vote"
            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
            : actionType === "upcoming"
              ? "bg-gradient-to-r from-amber-400 to-orange-500"
              : "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"
        }`}
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {election.title}
              </h3>
              <StatusBadge status={election.status} />
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(start)} – {formatDate(end)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {election.candidates.length} candidate{election.candidates.length !== 1 ? "s" : ""}
              </span>
              {actionType === "vote" && msLeft > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {hoursLeft}h {minsLeft}m left
                </span>
              )}
            </div>
          </div>

          {/* Right: Action */}
          <div className="shrink-0">
            {actionType === "vote" && (
              <Link
                href={`/vote/${election.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Vote Now
              </Link>
            )}
            {actionType === "upcoming" && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Opens {formatTime(start)}
              </span>
            )}
            {actionType === "done" && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                {election.hasVoted ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Vote Recorded
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-slate-500">Ended</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
