"use client";

// =============================================================================
// ElectionCard — Dashboard grid card for an election
// =============================================================================

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { Election } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ElectionCard({ election }: { election: Election }) {
  const counts = election._count;

  return (
    <Link href={`/admin/dashboard/${election.id}`} className="group block">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-600">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors">
            {election.title}
          </h3>
          <StatusBadge status={election.status} />
        </div>

        {/* Time Range */}
        <div className="mb-5 space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-xs">🟢</span>
            <span>Start: {formatDate(election.startTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">🔴</span>
            <span>End: {formatDate(election.endTime)}</span>
          </div>
        </div>

        {/* Stats Row */}
        {counts && (
          <div className="flex gap-4 border-t border-slate-100 pt-4 dark:border-slate-700">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {counts.candidates}
              </p>
              <p className="text-[11px] text-slate-400">Candidates</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {counts.voterRegistries}
              </p>
              <p className="text-[11px] text-slate-400">Voters</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {counts.ballots}
              </p>
              <p className="text-[11px] text-slate-400">Votes Cast</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
