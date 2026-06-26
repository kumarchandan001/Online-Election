// =============================================================================
// API Client — Centralized fetch wrapper (Security-Hardened)
// =============================================================================

import type { ApiError } from "./types";

const API_BASE = "/api";

export class ApiRequestError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

/**
 * Sanitize error messages to prevent XSS from server responses
 * being rendered in the UI.
 */
function sanitizeErrorMessage(msg: unknown): string {
  if (typeof msg !== "string") return "An unexpected error occurred.";
  // Strip HTML tags and limit length
  return msg.replace(/<[^>]*>/g, "").slice(0, 200);
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // Handle 401 — token expired or invalid → auto-logout
    if (res.status === 401 && typeof window !== "undefined") {
      // Clear stale credentials
      localStorage.removeItem("token");

      // Redirect to login only if not already on login/register page
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }

    const body: ApiError = await res.json().catch(() => ({
      error: "An unexpected error occurred.",
    }));

    throw new ApiRequestError(res.status, sanitizeErrorMessage(body.error));
  }

  return res.json() as Promise<T>;
}
