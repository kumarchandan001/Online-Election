// =============================================================================
// Election Controller — Admin CRUD + Voter Actions + Transactional Voting
// =============================================================================

import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { sendVoterRegistrationEmail } from "../lib/email";
import {
  sanitizeTitle,
  sanitizeName,
  sanitizeString,
  isValidUUID,
} from "../middleware/validators";

// ---------------------------------------------------------------------------
// Helper: compute real-time election status from start/end times
// ---------------------------------------------------------------------------
function computeElectionStatus(
  startTime: Date,
  endTime: Date
): "UPCOMING" | "ACTIVE" | "COMPLETED" {
  const now = new Date();
  if (now < startTime) return "UPCOMING";
  if (now > endTime) return "COMPLETED";
  return "ACTIVE";
}

// ---------------------------------------------------------------------------
// POST /api/elections  (Admin only)
// Create a new election
// ---------------------------------------------------------------------------
export async function createElection(req: Request, res: Response): Promise<void> {
  try {
    const { title, startTime, endTime } = req.body;

    // --- Input validation & sanitization ------------------------------------
    const cleanTitle = sanitizeTitle(title);
    if (!cleanTitle) {
      res.status(400).json({ error: "Title must be 3–200 characters and cannot contain HTML." });
      return;
    }

    if (!startTime || !endTime) {
      res.status(400).json({ error: "Fields 'startTime' and 'endTime' are required." });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format for 'startTime' or 'endTime'." });
      return;
    }

    if (start >= end) {
      res.status(400).json({ error: "'startTime' must be before 'endTime'." });
      return;
    }

    // --- Create election ----------------------------------------------------
    const election = await prisma.election.create({
      data: {
        title: cleanTitle,
        startTime: start,
        endTime: end,
        // status defaults to UPCOMING via Prisma schema
      },
    });

    res.status(201).json({
      message: "Election created successfully.",
      election,
    });
  } catch (err) {
    console.error("Create election error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/elections/:id/candidates  (Admin only)
// Add a candidate to a specific election
// ---------------------------------------------------------------------------
export async function addCandidate(req: Request, res: Response): Promise<void> {
  try {
    const electionId = req.params.id as string;
    const { name, description } = req.body;

    // --- Sanitize inputs ----------------------------------------------------
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      res.status(400).json({ error: "Candidate name must be 2–100 characters and cannot contain HTML." });
      return;
    }

    const cleanDesc = sanitizeString(description, 500);

    // --- Verify election exists ---------------------------------------------
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) {
      res.status(404).json({ error: "Election not found." });
      return;
    }

    // --- Create candidate ---------------------------------------------------
    const candidate = await prisma.candidate.create({
      data: {
        name: cleanName,
        description: cleanDesc,
        electionId,
      },
    });

    res.status(201).json({
      message: "Candidate added successfully.",
      candidate,
    });
  } catch (err) {
    console.error("Add candidate error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/elections/:id/register-voter  (Admin only)
// Register a user as a voter for a specific election
// ---------------------------------------------------------------------------
export async function registerVoter(req: Request, res: Response): Promise<void> {
  try {
    const electionId = req.params.id as string;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "Field 'userId' is required." });
      return;
    }

    // --- Verify election exists ---------------------------------------------
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) {
      res.status(404).json({ error: "Election not found." });
      return;
    }

    // --- Verify user exists -------------------------------------------------
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // --- Check if already registered ----------------------------------------
    const existingRegistry = await prisma.voterRegistry.findUnique({
      where: { userId_electionId: { userId, electionId } },
    });
    if (existingRegistry) {
      res.status(409).json({ error: "User is already registered for this election." });
      return;
    }

    // --- Create voter registry entry ----------------------------------------
    const registry = await prisma.voterRegistry.create({
      data: {
        userId,
        electionId,
        hasVoted: false,
      },
    });

    // --- Send email notification (fire-and-forget) -------------------------
    const loginUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login`
      : "http://localhost:3001/login";

    sendVoterRegistrationEmail({
      toEmail: user.email,
      toName: user.name,
      electionTitle: election.title,
      loginUrl,
    });

    res.status(201).json({
      message: "Voter registered for election successfully. Notification email sent.",
      registry,
    });
  } catch (err) {
    console.error("Register voter error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// GET /api/elections  (Authenticated)
// Fetch all active or upcoming elections for any logged-in voter
// ---------------------------------------------------------------------------
export async function getElections(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const elections = await prisma.election.findMany({
      where: {
        status: {
          in: ["UPCOMING", "ACTIVE"],
        },
      },
      include: {
        candidates: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        voterRegistries: {
          where: { userId },
          select: {
            hasVoted: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Compute real-time status and flatten voterRegistries
    const result = elections.map((election) => {
      const liveStatus = computeElectionStatus(election.startTime, election.endTime);

      // Auto-sync stale DB status (fire-and-forget)
      if (liveStatus !== election.status) {
        prisma.election.update({
          where: { id: election.id },
          data: { status: liveStatus },
        }).catch(() => {});
      }

      return {
        id: election.id,
        title: election.title,
        startTime: election.startTime,
        endTime: election.endTime,
        status: liveStatus,
        candidates: election.candidates,
        hasVoted: election.voterRegistries[0]?.hasVoted ?? false,
      };
    });

    res.status(200).json({ elections: result });
  } catch (err) {
    console.error("Get elections error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// POST /api/elections/:id/vote  (Authenticated)
//
// CRITICAL: Runs inside a strict Prisma $transaction to prevent double voting.
//
// Steps:
//   1. Verify election is currently ACTIVE (now between start/end time).
//   2. Verify voter is registered AND has_voted === false.
//   3. Verify candidate belongs to this election.
//   4. Update VoterRegistry → has_voted = true.
//   5. Create anonymous Ballot with crypto vote_hash (NO userId).
// ---------------------------------------------------------------------------
export async function vote(req: Request, res: Response): Promise<void> {
  try {
    const electionId = req.params.id as string;
    const { candidateId } = req.body;
    const userId = req.user!.userId;

    if (!candidateId) {
      res.status(400).json({ error: "Field 'candidateId' is required." });
      return;
    }

    // Validate candidateId format
    if (!isValidUUID(candidateId)) {
      res.status(400).json({ error: "Invalid candidateId format." });
      return;
    }

    // =====================================================================
    // TRANSACTIONAL VOTING — all-or-nothing
    // =====================================================================
    const ballot = await prisma.$transaction(async (tx) => {
      // Step 1: Verify election exists and is within its active time window
      const election = await tx.election.findUnique({
        where: { id: electionId },
      });

      if (!election) {
        throw new TransactionError(404, "Election not found.");
      }

      const now = new Date();
      if (now < election.startTime || now > election.endTime) {
        throw new TransactionError(
          403,
          "Voting is not allowed. The election is not currently active."
        );
      }

      // Step 2: Find or auto-create voter registry entry
      let registry = await tx.voterRegistry.findUnique({
        where: { userId_electionId: { userId, electionId } },
      });

      if (registry && registry.hasVoted) {
        throw new TransactionError(409, "You have already voted in this election.");
      }

      // Auto-register the voter if they haven't been registered yet
      if (!registry) {
        registry = await tx.voterRegistry.create({
          data: { userId, electionId, hasVoted: false },
        });
      }

      // Step 3: Verify candidate belongs to this election
      const candidate = await tx.candidate.findFirst({
        where: { id: candidateId, electionId },
      });

      if (!candidate) {
        throw new TransactionError(404, "Candidate not found in this election.");
      }

      // Step 4: Mark voter as having voted
      await tx.voterRegistry.update({
        where: { id: registry.id },
        data: { hasVoted: true },
      });

      // Step 5: Create anonymous ballot — NO userId, only a random vote_hash
      const voteHash = crypto.randomUUID();

      const newBallot = await tx.ballot.create({
        data: {
          electionId,
          candidateId,
          voteHash,
          // ⚠️ SECURITY: userId is deliberately NOT included here
        },
        select: {
          id: true,
          voteHash: true,
          createdAt: true,
        },
      });

      return newBallot;
    });

    res.status(201).json({
      message: "Vote cast successfully. Your vote is anonymous and cannot be traced back to you.",
      ballot,
    });
  } catch (err) {
    // Handle known transactional errors with proper status codes
    if (err instanceof TransactionError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    console.error("Vote error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// =============================================================================
// Admin-Only Endpoints (added for Phase 3 Frontend)
// =============================================================================

// ---------------------------------------------------------------------------
// GET /api/elections/all  (Admin only)
// Fetch ALL elections regardless of voter registration
// ---------------------------------------------------------------------------
export async function getAllElections(req: Request, res: Response): Promise<void> {
  try {
    const elections = await prisma.election.findMany({
      include: {
        _count: {
          select: {
            candidates: true,
            voterRegistries: true,
            ballots: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute real-time status for admin view too
    const result = elections.map((election) => {
      const liveStatus = computeElectionStatus(election.startTime, election.endTime);

      if (liveStatus !== election.status) {
        prisma.election.update({
          where: { id: election.id },
          data: { status: liveStatus },
        }).catch(() => {});
      }

      return { ...election, status: liveStatus };
    });

    res.status(200).json({ elections: result });
  } catch (err) {
    console.error("Get all elections error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// GET /api/elections/:id  (Admin only)
// Fetch a single election with full details
// ---------------------------------------------------------------------------
export async function getElectionById(req: Request, res: Response): Promise<void> {
  try {
    const electionId = req.params.id as string;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        candidates: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
        voterRegistries: {
          select: {
            id: true,
            userId: true,
            hasVoted: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            ballots: true,
          },
        },
      },
    });

    if (!election) {
      res.status(404).json({ error: "Election not found." });
      return;
    }

    res.status(200).json({ election });
  } catch (err) {
    console.error("Get election by ID error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// GET /api/elections/:id/results  (Admin only)
// Aggregated anonymous vote counts per candidate
// ---------------------------------------------------------------------------
export async function getElectionResults(req: Request, res: Response): Promise<void> {
  try {
    const electionId = req.params.id as string;

    // Verify election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, title: true, status: true },
    });

    if (!election) {
      res.status(404).json({ error: "Election not found." });
      return;
    }

    // Get total registered voters and total votes cast
    const [totalRegistered, totalVotesCast] = await Promise.all([
      prisma.voterRegistry.count({ where: { electionId } }),
      prisma.ballot.count({ where: { electionId } }),
    ]);

    // Get vote counts grouped by candidate
    const candidates = await prisma.candidate.findMany({
      where: { electionId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { ballots: true },
        },
      },
    });

    const results = candidates.map((c) => ({
      candidateId: c.id,
      candidateName: c.name,
      voteCount: c._count.ballots,
    }));

    res.status(200).json({
      election: {
        id: election.id,
        title: election.title,
        status: election.status,
      },
      totalRegistered,
      totalVotesCast,
      turnoutPercent:
        totalRegistered > 0
          ? Math.round((totalVotesCast / totalRegistered) * 100 * 10) / 10
          : 0,
      results,
    });
  } catch (err) {
    console.error("Get election results error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// ---------------------------------------------------------------------------
// GET /api/elections/:id/export  (Admin only)
// Download election results as a CSV file
// ---------------------------------------------------------------------------
export async function exportElectionResults(req: Request, res: Response): Promise<void> {
  try {
    const electionId = req.params.id as string;

    // Verify election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, title: true, status: true },
    });

    if (!election) {
      res.status(404).json({ error: "Election not found." });
      return;
    }

    // Get aggregate data
    const [totalRegistered, totalVotesCast] = await Promise.all([
      prisma.voterRegistry.count({ where: { electionId } }),
      prisma.ballot.count({ where: { electionId } }),
    ]);

    const candidates = await prisma.candidate.findMany({
      where: { electionId },
      select: {
        name: true,
        _count: { select: { ballots: true } },
      },
      orderBy: { name: "asc" },
    });

    const turnout =
      totalRegistered > 0
        ? Math.round((totalVotesCast / totalRegistered) * 100 * 10) / 10
        : 0;

    // Build CSV
    const csvRows: string[] = [];

    // Header metadata rows
    csvRows.push(`Election Title,"${election.title}"`);
    csvRows.push(`Status,${election.status}`);
    csvRows.push(`Total Registered Voters,${totalRegistered}`);
    csvRows.push(`Total Votes Cast,${totalVotesCast}`);
    csvRows.push(`Turnout (%),${turnout}`);
    csvRows.push(""); // blank separator

    // Candidate results header
    csvRows.push("Candidate Name,Votes,Percentage (%)");

    // Candidate rows
    for (const c of candidates) {
      const pct =
        totalVotesCast > 0
          ? Math.round((c._count.ballots / totalVotesCast) * 100 * 10) / 10
          : 0;
      // Escape candidate name in case it contains commas
      const safeName = c.name.includes(",") ? `"${c.name}"` : c.name;
      csvRows.push(`${safeName},${c._count.ballots},${pct}`);
    }

    const csvContent = csvRows.join("\n");
    const filename = `election-results-${electionId.slice(0, 8)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error("Export results error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}

// =============================================================================
// Helper: TransactionError — carries an HTTP status code out of $transaction
// =============================================================================
class TransactionError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TransactionError";
  }
}
