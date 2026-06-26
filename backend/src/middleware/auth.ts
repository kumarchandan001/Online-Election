// =============================================================================
// Auth Middleware — JWT Verification & Role-Based Access Control
// =============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Extend Express Request type to include authenticated user payload
// ---------------------------------------------------------------------------
export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "VOTER";
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// JWT secret — loaded once at module level
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set.");
}

// ---------------------------------------------------------------------------
// authenticate — Verifies the Bearer token and attaches user to request
// ---------------------------------------------------------------------------
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Provide a valid Bearer token." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }
}

// ---------------------------------------------------------------------------
// authorizeAdmin — Ensures the authenticated user has the ADMIN role
// ---------------------------------------------------------------------------
export function authorizeAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden. Admin access required." });
    return;
  }
  next();
}
