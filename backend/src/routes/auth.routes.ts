// =============================================================================
// Auth Routes — /api/auth
// =============================================================================

import { Router } from "express";
import { register, login, promoteAdmin } from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/register — Register a new user (default role: VOTER)
router.post("/register", register);

// POST /api/auth/login — Validate credentials and return JWT
router.post("/login", login);

// POST /api/auth/promote-admin — One-time admin setup (requires secret)
router.post("/promote-admin", promoteAdmin);

export default router;
