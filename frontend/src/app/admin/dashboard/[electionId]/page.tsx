"use client";

// =============================================================================
// Election Detail — /admin/dashboard/[electionId]
// Candidates Panel + Voter Registry + Results Metrics
// =============================================================================

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI, ApiRequestError } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import type {
  ElectionDetail,
  Candidate,
  VoterRegistryEntry,
  ElectionResults,
  CandidateResult,
} from "@/lib/types";
import { ElectionStatus } from "@/lib/types";

export default function ElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<ElectionDetail | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch election + results
  function loadData() {
    Promise.all([
      fetchAPI<{ election: ElectionDetail }>(`/elections/${electionId}`),
      fetchAPI<ElectionResults>(`/elections/${electionId}/results`),
    ])
      .then(([elData, resData]) => {
        setElection(elData.election);
        setResults(resData);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError) setError(err.message);
        else setError("Failed to load election data.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

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

  if (error || !election) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
        {error || "Election not found."}
      </div>
    );
  }

  return (
    <div>
      {/* Back + Header */}
      <button
        onClick={() => router.push("/admin/dashboard")}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </button>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {election.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(election.startTime).toLocaleString()} →{" "}
            {new Date(election.endTime).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={election.status as ElectionStatus} />
      </div>

      {/* Three-panel grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Candidates Panel */}
        <CandidatesPanel
          electionId={electionId}
          candidates={election.candidates}
          onAdded={loadData}
        />

        {/* Voter Registry Panel */}
        <VoterRegistryPanel
          electionId={electionId}
          voters={election.voterRegistries}
          onAdded={loadData}
        />

        {/* Results Metrics — spans full width */}
        <div className="lg:col-span-2">
          <ResultsPanel results={results} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Candidates Panel
// =============================================================================
function CandidatesPanel({
  electionId,
  candidates,
  onAdded,
}: {
  electionId: string;
  candidates: Candidate[];
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);

    try {
      await fetchAPI(`/elections/${electionId}/candidates`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      setName("");
      setDescription("");
      onAdded();
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Failed to add candidate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <span>👤</span> Candidates
        <span className="ml-auto rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          {candidates.length}
        </span>
      </h2>

      {/* Candidate List */}
      <div className="mb-5 max-h-60 space-y-2 overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No candidates yet</p>
        ) : (
          candidates.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50"
            >
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                {c.name}
              </p>
              {c.description && (
                <p className="mt-0.5 text-xs text-slate-500">{c.description}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Candidate name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Adding..." : "➕ Add Candidate"}
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// Voter Registry Panel
// =============================================================================
function VoterRegistryPanel({
  electionId,
  voters,
  onAdded,
}: {
  electionId: string;
  voters: VoterRegistryEntry[];
  onAdded: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // First, we need to find user by email — look them up
      // The backend register-voter expects userId, so we pass email
      // and the backend resolves it. But our current API expects userId.
      // Workaround: send email to a search, but since we don't have that endpoint,
      // we'll pass the email as userId hint. Let me use a direct approach:
      // We'll call register-voter with the email text as the userId.
      // Actually, the admin should know the userId. For UX, we'll try registering
      // by userId directly - the admin can copy user IDs from the list.

      await fetchAPI(`/elections/${electionId}/register-voter`, {
        method: "POST",
        body: JSON.stringify({ userId: email.trim() }),
      });
      setEmail("");
      setSuccess("Voter registered successfully!");
      onAdded();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Failed to register voter.");
    } finally {
      setSubmitting(false);
    }
  }

  const votedCount = voters.filter((v) => v.hasVoted).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <span>📋</span> Voter Registry
        <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {votedCount}/{voters.length} voted
        </span>
      </h2>

      {/* Voter List */}
      <div className="mb-5 max-h-60 space-y-2 overflow-y-auto">
        {voters.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No voters registered</p>
        ) : (
          voters.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white text-sm">
                  {v.user.name}
                </p>
                <p className="text-xs text-slate-500">{v.user.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  v.hasVoted
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-600 dark:text-slate-300"
                }`}
              >
                {v.hasVoted ? "Voted ✓" : "Pending"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Register Form */}
      <form onSubmit={handleRegister} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-700">
        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-emerald-500">{success}</p>}
        <input
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User ID to register"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Registering..." : "📋 Register Voter"}
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// Results Panel — Anonymous aggregate vote counts
// =============================================================================
function ResultsPanel({ results }: { results: ElectionResults | null }) {
  if (!results) return null;

  const maxVotes = Math.max(...results.results.map((r) => r.voteCount), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <span>📊</span> Election Results
        <span className="ml-auto text-xs font-normal text-slate-400">
          Anonymous & aggregated — no voter identities
        </span>
      </h2>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-indigo-50 p-4 text-center dark:bg-indigo-900/10">
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
            {results.totalRegistered}
          </p>
          <p className="text-xs text-slate-500">Registered Voters</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/10">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {results.totalVotesCast}
          </p>
          <p className="text-xs text-slate-500">Votes Cast</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4 text-center dark:bg-purple-900/10">
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {results.turnoutPercent}%
          </p>
          <p className="text-xs text-slate-500">Turnout</p>
        </div>
      </div>

      {/* Candidate Bars */}
      {results.results.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No candidates or votes yet</p>
      ) : (
        <div className="space-y-4">
          {results.results
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((r: CandidateResult) => {
              const pct =
                results.totalVotesCast > 0
                  ? Math.round((r.voteCount / results.totalVotesCast) * 100)
                  : 0;
              const barWidth = maxVotes > 0 ? (r.voteCount / maxVotes) * 100 : 0;

              return (
                <div key={r.candidateId}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {r.candidateName}
                    </span>
                    <span className="text-sm text-slate-500">
                      {r.voteCount} vote{r.voteCount !== 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
