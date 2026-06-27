"use client";

// =============================================================================
// Dashboard Overview — /admin/dashboard
// =============================================================================

import { useEffect, useState } from "react";
import { fetchAPI, ApiRequestError } from "@/lib/api";
import type { Election } from "@/lib/types";
import ElectionCard from "@/components/ElectionCard";
import Link from "next/link";

export default function DashboardPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  function loadElections() {
    setLoading(true);
    fetchAPI<{ elections: Election[] }>("/elections/all")
      .then((data) => setElections(data.elections))
      .catch((err) => {
        if (err instanceof ApiRequestError) setError(err.message);
        else setError("Failed to load elections.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadElections();
  }, []);

  async function handleDelete(electionId: string, title: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis will permanently remove the election and all its data (candidates, voters, votes). This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(electionId);
    try {
      await fetchAPI(`/elections/${electionId}`, { method: "DELETE" });
      setElections((prev) => prev.filter((e) => e.id !== electionId));
    } catch (err) {
      if (err instanceof ApiRequestError) {
        alert(err.message);
      } else {
        alert("Failed to delete election.");
      }
    } finally {
      setDeleting(null);
    }
  }

  const upcoming = elections.filter((e) => e.status === "UPCOMING");
  const active = elections.filter((e) => e.status === "ACTIVE");
  const completed = elections.filter((e) => e.status === "COMPLETED");

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Elections Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor all elections
          </p>
        </div>
        <Link
          href="/admin/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30"
        >
          <span>➕</span> Create Election
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" count={upcoming.length} color="amber" icon="🕐" />
        <StatCard label="Active" count={active.length} color="emerald" icon="🟢" />
        <StatCard label="Completed" count={completed.length} color="slate" icon="✅" />
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center py-20">
          <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Election Grid */}
      {!loading && !error && (
        <>
          {elections.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 dark:border-slate-700">
              <span className="mb-3 text-4xl">🗳️</span>
              <p className="text-lg font-semibold text-slate-500">No elections yet</p>
              <p className="text-sm text-slate-400">
                Create your first election to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {elections.map((election) => (
                <div key={election.id} className="relative">
                  <ElectionCard election={election} />
                  {/* Delete button for completed elections */}
                  {election.status === "COMPLETED" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(election.id, election.title);
                      }}
                      disabled={deleting === election.id}
                      className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:bg-red-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete this completed election"
                    >
                      {deleting === election.id ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Deleting…
                        </>
                      ) : (
                        <>🗑️ Delete</>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard — Small metric card for the top row
// ---------------------------------------------------------------------------
function StatCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: "amber" | "emerald" | "slate";
  icon: string;
}) {
  const colors = {
    amber: "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800",
    emerald: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800",
    slate: "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

