// =============================================================================
// Validators Middleware — Input Sanitization & Validation
// =============================================================================
// Centralized validation functions to prevent XSS, injection, and malformed
// input from reaching business logic or the database.
// =============================================================================

import { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// UUID v4 format validator
// ---------------------------------------------------------------------------
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Middleware: validates that every `:id`, `:electionId`, etc. route param
 * is a properly formatted UUID. Returns 400 if any param fails.
 */
export function validateUUIDParams(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  for (const [key, value] of Object.entries(req.params)) {
    if (typeof value === "string" && !isValidUUID(value)) {
      res.status(400).json({
        error: `Invalid format for parameter '${key}'. Expected a valid UUID.`,
      });
      return;
    }
  }
  next();
}

// ---------------------------------------------------------------------------
// Email validation & normalization
// ---------------------------------------------------------------------------
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false; // RFC 5321 max
  return EMAIL_REGEX.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Name sanitization
// ---------------------------------------------------------------------------

/** Strip HTML tags and control characters from a string */
function stripHTML(str: string): string {
  return str
    .replace(/<[^>]*>/g, "") // remove HTML tags
    .replace(/[<>]/g, "")    // remove any leftover angle brackets
    .trim();
}

export function sanitizeName(name: string): string | null {
  if (!name || typeof name !== "string") return null;
  const clean = stripHTML(name).slice(0, 100);
  if (clean.length < 2) return null;
  return clean;
}

// ---------------------------------------------------------------------------
// Password strength validation
// ---------------------------------------------------------------------------
export function isStrongPassword(password: string): {
  valid: boolean;
  reason?: string;
} {
  if (!password || typeof password !== "string") {
    return { valid: false, reason: "Password is required." };
  }
  if (password.length < 8) {
    return {
      valid: false,
      reason: "Password must be at least 8 characters long.",
    };
  }
  if (password.length > 128) {
    return {
      valid: false,
      reason: "Password must be at most 128 characters long.",
    };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      reason: "Password must contain at least one letter.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      reason: "Password must contain at least one number.",
    };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Election title sanitization
// ---------------------------------------------------------------------------
export function sanitizeTitle(title: string): string | null {
  if (!title || typeof title !== "string") return null;
  const clean = stripHTML(title).slice(0, 200);
  if (clean.length < 3) return null;
  return clean;
}

// ---------------------------------------------------------------------------
// Generic string sanitizer (for descriptions, etc.)
// ---------------------------------------------------------------------------
export function sanitizeString(
  str: string | undefined | null,
  maxLength = 500
): string | null {
  if (!str || typeof str !== "string") return null;
  return stripHTML(str).slice(0, maxLength) || null;
}
