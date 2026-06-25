// =============================================================================
// API Client — Centralized fetch wrapper for backend communication
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
    const body: ApiError = await res.json().catch(() => ({
      error: "An unexpected error occurred.",
    }));
    throw new ApiRequestError(res.status, body.error);
  }

  return res.json() as Promise<T>;
}
