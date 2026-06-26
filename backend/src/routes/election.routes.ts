// =============================================================================
// Election Routes — /api/elections (Security-Hardened)
// =============================================================================

import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import { validateUUIDParams } from "../middleware/validators";
import {
  createElection,
  addCandidate,
  registerVoter,
  getElections,
  vote,
  getAllElections,
  getElectionById,
  getElectionResults,
  exportElectionResults,
} from "../controllers/election.controller";

const router = Router();

// ---- Authenticated (any role) ---------------------------------------------

// GET  /api/elections — Fetch elections the user is registered for
router.get("/", authenticate, getElections);

// POST /api/elections/:id/vote — Cast an anonymous ballot (transactional)
router.post("/:id/vote", authenticate, validateUUIDParams, vote);

// ---- Admin only -----------------------------------------------------------

// GET  /api/elections/all — Fetch ALL elections (admin dashboard)
router.get("/all", authenticate, authorizeAdmin, getAllElections);

// GET  /api/elections/:id — Fetch single election detail
router.get("/:id", authenticate, authorizeAdmin, validateUUIDParams, getElectionById);

// GET  /api/elections/:id/results — Aggregated anonymous vote counts
router.get("/:id/results", authenticate, authorizeAdmin, validateUUIDParams, getElectionResults);

// GET  /api/elections/:id/export — Download results as CSV
router.get("/:id/export", authenticate, authorizeAdmin, validateUUIDParams, exportElectionResults);

// POST /api/elections — Create a new election
router.post("/", authenticate, authorizeAdmin, createElection);

// POST /api/elections/:id/candidates — Add a candidate to an election
router.post("/:id/candidates", authenticate, authorizeAdmin, validateUUIDParams, addCandidate);

// POST /api/elections/:id/register-voter — Register a voter for an election
router.post("/:id/register-voter", authenticate, authorizeAdmin, validateUUIDParams, registerVoter);

export default router;
