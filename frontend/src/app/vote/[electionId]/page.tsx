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

  const endDate = new Date(election.endTime);
  const now = new Date();
  const msLeft = endDate.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60)));
  const minsLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Elections
      </button>

      {/* Election Header — Rich gradient card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-6 shadow-xl shadow-indigo-500/10 dark:border-slate-700 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Election
            </div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {election.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-indigo-200">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {hoursLeft}h {minsLeft}m remaining
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {election.candidates.length} candidates
              </span>
            </div>
          </div>
        </div>

        {/* Closing time bar */}
        <div className="mt-5 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm">
          <p className="text-xs text-indigo-200">
            Voting closes on{" "}
            <span className="font-semibold text-white">
              {endDate.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
              {" at "}
              {endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step indicator — with labels */}
      <div className="mb-6 flex items-center gap-3">
        <StepDot active={stage === "select"} done={stage === "confirm"} label="1" text="Select" />
        <div className={`h-0.5 flex-1 rounded-full transition-colors ${stage === "confirm" ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`} />
        <StepDot active={stage === "confirm"} done={false} label="2" text="Confirm" />
      </div>

      {/* Section title */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          {stage === "select" ? (
            <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {stage === "select" ? "Select your candidate" : "Review & confirm your vote"}
          </h2>
          <p className="text-xs text-slate-500">
            {stage === "select"
              ? "Choose one candidate from the list below"
              : "This action is final and cannot be undone"}
          </p>
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="space-y-3">
        {election.candidates.map((candidate, index) => {
          const isSelected = selectedCandidate === candidate.id;
          const isDisabled = stage === "confirm" && !isSelected;
          const initials = candidate.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const avatarColors = [
            "from-violet-500 to-purple-600",
            "from-blue-500 to-cyan-600",
            "from-emerald-500 to-teal-600",
            "from-orange-500 to-rose-600",
            "from-pink-500 to-fuchsia-600",
          ];

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
                  ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-900/20"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              } ${isDisabled ? "opacity-30" : ""} ${
                stage === "confirm" ? "cursor-default" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md ${
                    avatarColors[index % avatarColors.length]
                  }`}
                >
                  {initials}
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
                    <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">
                      {candidate.description}
                    </p>
                  )}
                </div>

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
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Confirm your vote
                  </p>
                  <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                    You are about to cast your vote for{" "}
                    <strong>{selectedCandidateObj?.name}</strong>. This action is
                    final and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setStage("select")}
                disabled={submitting}
                className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
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
  text,
}: {
  active: boolean;
  done: boolean;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
          done
            ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
            : active
              ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400"
              : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
        }`}
      >
        {done ? "✓" : label}
      </div>
      <span
        className={`text-xs font-medium ${
          active || done
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

