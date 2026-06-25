// =============================================================================
// Auth Routes — /api/auth
// =============================================================================

import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/register — Register a new user (default role: VOTER)
router.post("/register", register);

// POST /api/auth/login — Validate credentials and return JWT
router.post("/login", login);

export default router;
