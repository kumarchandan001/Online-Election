"use client";

// =============================================================================
// useAuth Hook — JWT Authentication Lifecycle Manager
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { fetchAPI, ApiRequestError } from "@/lib/api";
import type { JwtPayload, Role, User } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        // Check expiry
        if (decoded.exp * 1000 > Date.now()) {
          setAuthState({
            token,
            user: decoded,
            isAuthenticated: true,
            isAdmin: decoded.role === "ADMIN",
          });
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ role: Role }> => {
      const data = await fetchAPI<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const decoded = jwtDecode<JwtPayload>(data.token);
      localStorage.setItem("token", data.token);

      setAuthState({
        token: data.token,
        user: decoded,
        isAuthenticated: true,
        isAdmin: decoded.role === "ADMIN",
      });

      return { role: decoded.role as Role };
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    router.push("/admin/login");
  }, [router]);

  return {
    ...authState,
    loading,
    login,
    logout,
  };
}
