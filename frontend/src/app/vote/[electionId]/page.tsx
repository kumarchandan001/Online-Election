"use client";

// =============================================================================
// Ballot Station — /vote/[electionId]
//
// Three states:
//   1. SELECT   → pick a candidate from radio-cards
//   2. CONFIRM  → review choice with confirmation modal
//   3. RECEIPT  → success screen with vote_hash + copy button
// =============================================================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI, ApiRequestError } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { ElectionStatus } from "@/lib/types";

// Types for this page
interface BallotElection {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: ElectionStatus;
  candidates: { id: string; name: string; description: string | null }[];
  hasVoted: boolean;
}

interface VoteResponse {
  message: string;
  ballot: {
    id: string;
    voteHash: string;
    createdAt: string;
  };
}

type Stage = "select" | "confirm" | "receipt";

export default function BallotStationPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.electionId as string;

  const [election, setElection] = useState<BallotElection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Voting state
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [submitting, setSubmitting] = useState(false);
  const [voteResult, setVoteResult] = useState<VoteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Load election data
  useEffect(() => {
    fetchAPI<{ elections: BallotElection[] }>("/elections")
      .then((data) => {
        const found = data.elections.find((e) => e.id === electionId);
        if (found) setElection(found);
        else setError("Election not found or you are not registered.");
      })
      .catch((err) => {
        if (err instanceof ApiRequestError) setError(err.message);
        else setError("Failed to load election.");
      })
      .finally(() => setLoading(false));
  }, [electionId]);

  // Submit vote
  async function handleVote() {
    if (!selectedCandidate) return;
    setSubmitting(true);
    setError("");

    try {
      const result = await fetchAPI<VoteResponse>(
        `/elections/${electionId}/vote`,
        {
          method: "POST",
          body: JSON.stringify({ candidateId: selectedCandidate }),
        }
      );
      setVoteResult(result);
      setStage("receipt");
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Failed to cast vote. Please try again.");
      setStage("select");
    } finally {
      setSubmitting(false);
    }
  }

  // Copy hash
  async function copyHash() {
    if (!voteResult) return;
    await navigator.clipboard.writeText(voteResult.ballot.voteHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ---- Loading ----
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

  // ---- Error / Not found ----
  if (error && !election) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!election) return null;

  // ---- Already voted guard ----
  if (election.hasVoted && stage !== "receipt") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <span className="mb-3 text-5xl">✅</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Already Voted
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          You have already cast your ballot in{" "}
          <strong>{election.title}</strong>. Each voter may only vote once.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 cursor-pointer rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================================================================
  // STAGE 3: RECEIPT — Professional Vote Confirmation
  // =========================================================================
  if (stage === "receipt" && voteResult) {
    const votedAt = new Date(voteResult.ballot.createdAt);
    const receiptId = voteResult.ballot.voteHash.slice(0, 8).toUpperCase();

    return (
      <div className="flex flex-col items-center">
        {/* Success Animation */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-4xl shadow-2xl shadow-emerald-500/30 sm:h-24 sm:w-24 sm:text-5xl">
          ✓
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Vote Cast Successfully!
        </h1>
        <p className="mb-8 max-w-md text-center text-sm text-slate-500 sm:text-base">
          Thank you for participating. Your ballot has been securely recorded
          and your identity remains anonymous.
        </p>

        {/* Receipt Card */}
        <div className="w-full rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 shadow-lg dark:border-emerald-800 dark:from-emerald-900/20 dark:to-slate-800 sm:p-8">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-700 uppercase dark:text-emerald-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Vote Confirmation
          </div>

          {/* Summary Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3 dark:border-slate-600 dark:bg-slate-700">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Election</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{election.title}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3 dark:border-slate-600 dark:bg-slate-700">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Voted At</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {votedAt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}{" "}
                at {votedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3 dark:border-slate-600 dark:bg-slate-700">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Receipt No.</span>
              <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">#{receiptId}</span>
            </div>
          </div>

          {/* Status Banner */}
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 dark:bg-emerald-900/30">
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Your vote is anonymous and cannot be traced back to you.
            </p>
          </div>

          {/* Advanced: Full Hash (collapsible) */}
          <details className="mt-4 group">
            <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Advanced: View verification hash
            </summary>
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <p className="mb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Cryptographic Hash
              </p>
              <p className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">
                {voteResult.ballot.voteHash}
              </p>
              <button
                onClick={copyHash}
                className="mt-3 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {copied ? "✓ Copied!" : "📋 Copy Hash"}
              </button>
            </div>
          </details>
        </div>

        {/* Back to Dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 cursor-pointer rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          ← Back to My Elections
        </button>
      </div>
    );
  }

  // =========================================================================
  // STAGE 1 & 2: SELECT + CONFIRM
  // =========================================================================
  const selectedCandidateObj = election.candidates.find(
    (c) => c.id === selectedCandidate
  );

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-500 transition-colors cursor-pointer"
      >
        ← Back
      </button>

      {/* Election Header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              {election.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Voting closes {new Date(election.endTime).toLocaleString()}
            </p>
          </div>
          <StatusBadge status={election.status} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-3">
        <StepDot active={stage === "select"} done={stage === "confirm"} label="1" />
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <StepDot active={stage === "confirm"} done={false} label="2" />
      </div>

      {/* Candidate Cards */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {stage === "select" ? "Select your candidate" : "Confirm your choice"}
      </h2>

      <div className="space-y-3">
        {election.candidates.map((candidate) => {
          const isSelected = selectedCandidate === candidate.id;
          const isDisabled = stage === "confirm" && !isSelected;

          return (
            <button
              key={candidate.id}
              type="button"
              disabled={stage === "confirm"}
              onClick={() => {
                setSelectedCandidate(candidate.id);
                setError("");
              }}
              className={`w-full cursor-pointer rounded-2xl border-2 p-4 text-left transition-all sm:p-5 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-900/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              } ${isDisabled ? "opacity-40" : ""} ${
                stage === "confirm" ? "cursor-default" : ""
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Radio indicator */}
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Candidate info */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-base font-semibold ${
                      isSelected
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {candidate.name}
                  </p>
                  {candidate.description && (
                    <p className="mt-0.5 text-sm text-slate-500">
                      {candidate.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {stage === "select" && (
          <button
            onClick={() => selectedCandidate && setStage("confirm")}
            disabled={!selectedCandidate}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Confirm →
          </button>
        )}

        {stage === "confirm" && (
          <>
            {/* Confirmation Banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                ⚠️ You are about to cast your vote for{" "}
                <strong>{selectedCandidateObj?.name}</strong>. This action is
                final and cannot be undone.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setStage("select")}
                disabled={submitting}
                className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                ← Go Back
              </button>
              <button
                onClick={handleVote}
                disabled={submitting}
                className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Casting Vote…
                  </span>
                ) : (
                  "🗳️ Confirm & Cast Vote"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// StepDot — Progress indicator for the 2-step flow
// =============================================================================
function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
        done
          ? "bg-indigo-500 text-white"
          : active
            ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400"
            : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
      }`}
    >
      {done ? "✓" : label}
    </div>
  );
}
